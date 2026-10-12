# CacaoMarket Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each task below is owned by one agent with its own list of files; agents working in the same wave never share a file.

**Goal:** A phone-first PWA where farm producers publish products, buyers order and pay in sats straight to the seller's wallet, and the app records the order end to end and measures whether sellers re-spend their sats inside the network.

**Architecture:** Next.js (App Router) renders the pages and runs all business logic on the server. Postgres (Supabase) holds the data; every write goes through server code that checks the session and then calls a Postgres function with the service role, so stock reservation and order transitions are atomic. Row-level security only grants reads. Payments go through one interface, `ProveedorDePago`, with a `manual` adapter (Lightning Address) and a `falso` adapter for tests.

**Tech Stack:** Next.js 16.4 (App Router, React 19, TypeScript), Supabase local (Postgres, phone auth with test codes, storage, realtime), `@supabase/supabase-js`, `@supabase/ssr`, Vitest, Playwright, plain CSS with the Cacao brand tokens.

**Spec:** `docs/superpowers/specs/2026-10-12-cacaomarket-fase-1-design.md`

## Global Constraints

- The project lives in `market/`. Run every command from `market/`. Never touch files outside `market/` (the repo root is Cacao Media, `travel/` is Cacao Travel).
- Next.js 16 is newer than most training data. Before using a Next API, read the matching guide under `market/node_modules/next/dist/docs/01-app/`. Never guess an API.
- Non-custodial: the app never receives, holds or sends money, and never asks for or stores private keys or seed phrases.
- The browser never writes to the database. Every write is a server action or route handler that (1) reads the session, (2) calls a function in `src/servidor/`, which (3) calls a Postgres function with the service role. Client code never imports the service-role client.
- Prices are set in USD cents (integers). Sats are integers, rounded up. An order stores both totals and the quote used. A payment request expires after 600 seconds.
- User-session and browser queries on `negocios`, `cobros` and `usuarios` must name their columns (`select *` is refused by column grants). Phones are never selectable by a session.
- User-facing text: Spanish with Salvadoran voseo (tenés, pagá, elegí), sentence case, no em or en dashes. Amounts read "1,250 sats" and "$3.50". Sats and USD always appear together.
- Brand (binding): colours Pulpa `#F5EDE3`, Tostado `#2A1912`, Mazorca `#D9902F`, Criollo `#8C2F2B`, Grano fresco `#5E3050`, Chocolate `#5A3221`, Arena `#E6D8C6`, Blanco cálido `#FFFAF4`, used only through CSS variables. Fonts Bricolage Grotesque (400/600/800) and JetBrains Mono for prices and data. No shadows, no gradients. Allowed text pairs: Tostado on Pulpa/Arena/Blanco cálido/Mazorca; Pulpa on Tostado/Criollo/Grano fresco/Chocolate.
- Phone first: design at 375px wide; nothing may scroll sideways at 320px; tap targets at least 44px tall.
- Code comments in English, short, saying why. No new dependencies beyond those in `package.json` without saying so in the task report.
- Commits: plain messages, no co-author or tool attribution lines.

## Review Focus

- Two buyers order the last unit at the same moment: exactly one order is created; the other gets "sin stock" and no stock goes negative.
- The buyer double-taps "Hacer pedido": one order, not two (idempotency key per cart).
- A payment request expires while the buyer is on the payment screen: the screen says so, the stock comes back, and paying late does not mark the order paid.
- A seller's Lightning Address is wrong, slow, or points at an internal address: the server does not hang or reach private networks; the order still gets a payable request (address plus amount) or a clear error.
- A user opens another person's order, chat or dispute by guessing the URL: they get "no encontrada", not data.

## File structure

```
market/
  supabase/
    config.toml                         local stack; test phone codes
    migrations/20261012000001_esquema.sql   tables, read policies, bucket (done)
    migrations/20261012000002_funciones.sql every write: orders, payments, shops, chat, reviews, disputes, metrics
  scripts/sembrar.mjs                   seed users, shops, products
  src/
    tipos/db.ts                         generated from the database (never edited by hand)
    lib/                                pure code, no I/O except where noted; unit tested
      dinero.ts                         USD cents <-> sats, formatting
      estados.ts                        order states: labels, who can do what next
      lightning/direccion.ts            Lightning Address -> invoice (LNURL-pay), LUD-21 check; safe fetch
      pagos/proveedor.ts                ProveedorDePago interface and types
      pagos/manual.ts  pagos/falso.ts  pagos/index.ts
      precio/fuente.ts                  FuenteDePrecio: two live sources, 2% rule, fixed source for tests
      carrito.ts                        cart kept in the browser, grouped by shop
    servidor/                           server only (`import 'server-only'`)
      supabase.ts                       clienteSesion() and clienteServicio()
      sesion.ts                         sesionActual(), exigirSesion(), exigirVendedor(), exigirAdmin()
      catalogo.ts  cuentas.ts  ordenes.ts  pagos.ts  mensajes.ts  disputas.ts  admin.ts
    componentes/                        shared UI: EtiquetaPrecio, TarjetaProducto, Boton, Campo, Estado, BarraInferior ...
    app/                                routes (see Task 3 and Wave 2)
  tests/                                Vitest integration (db) and Playwright (e2e)
```

## Contracts shared by all tasks

### Database functions (Task 1 creates them; service role only)

All raise `exception` with a message that starts with a code in capitals, a colon, and a Spanish sentence for the user, e.g. `SIN_STOCK: Ya no quedan suficientes unidades de Tomate.` Codes: `SIN_STOCK`, `NEGOCIO_CERRADO`, `NO_PERMITIDO`, `ESTADO_INVALIDO`, `NO_ENCONTRADA`, `CODIGO_INCORRECTO`, `DATOS_INVALIDOS`, `FUERA_DE_PLAZO`.

| Function | Rule |
|---|---|
| `crear_orden(p_comprador uuid, p_negocio uuid, p_lineas jsonb, p_modo modo_entrega, p_clave text, p_cotizacion numeric, p_comision_bps int default 100) returns ordenes` | `p_lineas` = `[{"producto_id": uuid, "cantidad": int}]`. If an order with `(p_comprador, p_clave)` exists, return it. Shop must be `aprobado` and `abierto`; buyer cannot be the shop owner; products must be active and of that shop. Locks the product rows, checks and subtracts stock, copies name/unit/price into `lineas_orden`, computes `total_sats = ceil(total_usd_centavos * 1e6 / p_cotizacion)` and `comision_teorica_sats = ceil(total_sats * p_comision_bps / 10000)`. State `creada`. |
| `registrar_cobro(p_orden uuid, p_proveedor tipo_proveedor, p_referencia text, p_bolt11 text, p_destino text, p_verificar_url text, p_expira_en timestamptz) returns cobros` | Order must be `creada`. Inserts the payment request, moves the order to `esperando_pago`. |
| `confirmar_pago(p_orden uuid, p_actor uuid) returns ordenes` | `p_actor` null = the system saw the payment; otherwise it must be the shop owner. Order must be `esperando_pago` and its request not expired. Request `pagado`, order `pagada`, `codigo_entrega` = six random digits. |
| `expirar_ordenes() returns int` | Every `esperando_pago` order whose request is past `expira_en`, and every `creada` order older than 10 minutes: state `expirada`, request `expirado`, stock returned. Returns how many. |
| `marcar_lista(p_orden uuid, p_actor uuid) returns ordenes` | Shop owner; `pagada` -> `lista`. |
| `marcar_entregada(p_orden uuid, p_actor uuid, p_codigo text) returns ordenes` | Buyer (code ignored), or shop owner with the right `codigo_entrega`; `lista` -> `entregada`. |
| `cerrar_ordenes() returns int` | `entregada` for more than 48 h with no dispute -> `cerrada`. |
| `crear_resena(p_orden uuid, p_actor uuid, p_puntuacion int, p_comentario text) returns resenas` | Buyer; order `entregada` or `cerrada`; one per order; an `entregada` order becomes `cerrada`. |
| `abrir_disputa(p_orden uuid, p_actor uuid, p_motivo text, p_evidencia text) returns disputas` | Buyer; order `pagada`, `lista`, or `entregada` within 48 h of delivery -> `disputada`. |
| `resolver_disputa(p_orden uuid, p_actor uuid, p_resultado resultado_disputa, p_nota text) returns disputas` | Admin; `disputada` -> `resuelta`. |
| `marcar_reembolso(p_orden uuid, p_actor uuid) returns disputas` / `confirmar_reembolso(p_orden uuid, p_actor uuid) returns disputas` | Shop owner marks a refund paid outside the app; buyer confirms it. Only after a resolution that orders a refund. |
| `enviar_mensaje(p_orden uuid, p_actor uuid, p_texto text) returns mensajes` | Buyer or shop owner of that order. |
| `solicitar_negocio(p_usuario uuid, p_nombre text, p_descripcion text, p_ubicacion text, p_lightning_address text) returns negocios` | Creates the shop as `pendiente`. One per user. |
| `actualizar_negocio(p_usuario uuid, p_nombre text, p_descripcion text, p_ubicacion text, p_lightning_address text, p_abierto boolean) returns negocios` | Owner edits their shop. Cannot change `estado`. |
| `cambiar_estado_negocio(p_negocio uuid, p_actor uuid, p_estado estado_negocio) returns negocios` | Admin approves or suspends. |
| `guardar_producto(p_usuario uuid, p_producto uuid, p_categoria int, p_nombre text, p_descripcion text, p_unidad text, p_precio int, p_stock int, p_activo boolean, p_fotos text[]) returns productos` | `p_producto` null creates; otherwise it must belong to the user's shop. |
| `actualizar_perfil(p_usuario uuid, p_nombre text) returns usuarios` | Sets the display name. |
| `marcar_avisos_leidos(p_usuario uuid) returns int` | |
| `circularidad_red() returns table(sats_cobrados bigint, sats_regastados bigint, indice numeric, negocios int, negocios_que_compran int, porcentaje numeric)` and view `circularidad_negocios (negocio_id, nombre, sats_cobrados, sats_regastados, indice)` | "Paid" = orders in `pagada`, `lista`, `entregada`, `cerrada`, `resuelta`. Index is null when nothing was collected. |

Every order transition also writes one `auditoria` row and one `avisos` row for the other party.

### Server layer (`src/servidor/`), Wave 2 creates it; pages only call these

```ts
// sesion.ts
type Sesion = { usuario: { id: string; nombre: string; esAdmin: boolean; telefono: string }; negocio: { id: string; nombre: string; estado: 'pendiente' | 'aprobado' | 'suspendido'; abierto: boolean } | null };
sesionActual(): Promise<Sesion | null>
exigirSesion(): Promise<Sesion>          // redirects to /entrar when there is none
exigirVendedor(): Promise<Sesion & { negocio: NonNullable<Sesion['negocio']> }>
exigirAdmin(): Promise<Sesion>           // notFound() when not admin

// Result of every mutation, so pages can show the Spanish message from the database.
type Resultado<T> = { ok: true; dato: T } | { ok: false; codigo: string; mensaje: string };
```

### Payments (`src/lib/pagos/proveedor.ts`), Task 2

```ts
export interface ProveedorDePago {
  crearCobro(input: { sats: number; memo: string; expiraEnSeg: number }): Promise<Cobro>;
  consultarCobro(cobro: { referencia: string | null; verificarUrl: string | null; expiraEn: Date }): Promise<'pendiente' | 'pagado' | 'expirado'>;
}
export type Cobro = { referencia: string | null; bolt11: string | null; destino: string | null; verificarUrl: string | null; expiraEn: Date };
export function proveedorPara(negocio: { tipoProveedorPago: 'manual' | 'falso' | 'nwc' | 'blink'; lightningAddress: string | null }): ProveedorDePago;
```

### Money (`src/lib/dinero.ts`), Task 2

```ts
usdCentavosASats(centavos: number, cotizacionUsdBtc: number): number   // integer, rounded up
formatoSats(sats: number): string       // "1,250 sats"
formatoUsd(centavos: number): string    // "$3.50"
```

## Wave 1 (three agents in parallel)

### Task 1: database functions, seed, database tests

**Files:** create `supabase/migrations/20261012000002_funciones.sql`, `scripts/sembrar.mjs`, `tests/db/*.test.ts`, `vitest.config.ts`. The only task allowed to run `supabase db reset`.

- [ ] Write the functions of the contract table, all `security definer`, `set search_path = public`, with `revoke execute ... from public, anon, authenticated` and `grant execute ... to service_role`.
- [ ] Write `scripts/sembrar.mjs`: with the service role, create the nine test users by phone (see `supabase/config.toml`), make `50370000001` admin, four approved shops with Lightning Addresses, six categories, at least 20 products, and a handful of orders in different states so every screen has data.
- [ ] Integration tests against the local stack: full order cycle with the fake provider; two concurrent orders for the last unit; idempotency; expiry returns stock; late payment refused; wrong delivery code refused; each role restriction; review closes the order; dispute window; metrics on the seeded data; row-level security (a second user reads none of the first user's orders, messages, notices, disputes; `select telefono` refused).
- [ ] `supabase db reset`, run the seed, run the tests until green. Report the totals.

### Task 2: domain library

**Files:** create everything under `src/lib/` listed above and `src/lib/**/*.test.ts`. Runs `npx vitest run src/lib`.

- [ ] `dinero.ts`, `estados.ts` (labels in Spanish and `accionesPosibles(estado, rol)`), `carrito.ts`.
- [ ] `lightning/direccion.ts`: resolve `usuario@dominio` over HTTPS to an invoice for an exact amount (LNURL-pay: metadata request, range check in millisats, callback), capture the LUD-21 `verify` URL when given, and `verificarPago(url)`. Safe fetch: HTTPS only, public hostnames only (refuse IP literals, `localhost`, `.local`, `.internal`, private ranges after DNS resolution), 5 second timeout, no redirects to other hosts, response size capped.
- [ ] `pagos/`: the interface, `manual` (uses `direccion.ts`; falls back to address plus amount when no invoice), `falso` (in-memory, controllable), `proveedorPara`.
- [ ] `precio/fuente.ts`: two public BTC/USD sources, refuse when both fail or differ by more than 2%, 60 second cache, and a fixed source selected with `PRECIO_FIJO_USD_BTC` for tests and offline work.
- [ ] Unit tests for every function, including each Review Focus item that lives here.

### Task 3: design system, app shell and public catalogue

**Files:** `src/app/layout.tsx`, `src/app/globals.css`, `src/app/manifest.ts`, `src/app/page.tsx`, `src/app/negocios/[id]/page.tsx`, `src/app/productos/[id]/page.tsx`, `src/app/not-found.tsx`, `src/componentes/*`, `src/servidor/supabase.ts`, `src/servidor/catalogo.ts`, `public/` icons.

- [ ] Brand tokens, fonts, base styles; header with the `cacaomarket` logo; bottom tab bar (Inicio, Carrito, Órdenes, Mi negocio).
- [ ] The price tag component as the signature element: sats large in the mono face, USD beside it.
- [ ] Home: search box, category chips, product grid from the database; shop page; product page with quantity and "Agregar al carrito" (cart in the browser, from `src/lib/carrito.ts` once Task 2 lands; until then a local stub with the same signatures).
- [ ] Installable PWA manifest. No horizontal scroll at 320px.

## Wave 2 (five agents in parallel, after Wave 1 is verified)

- **Task 4, accounts:** `/entrar` (phone, code), sign out, profile name, `src/servidor/sesion.ts`, `cuentas.ts`; `/mi-negocio` (apply, status, open/closed, Lightning Address with the "no pedimos llaves ni frases semilla" notice).
- **Task 5, seller catalogue:** `/mi-negocio/productos` list, create, edit, stock, activate; photo upload to the `productos` bucket through the server, validated by type and size.
- **Task 6, buying:** `/carrito`, creating the order (quote, `crear_orden`, payment request), `/ordenes/[id]/pagar` with QR, copy button, countdown, live detection and expiry; `src/servidor/ordenes.ts`, `pagos.ts`.
- **Task 7, the order:** `/ordenes` and `/ordenes/[id]` for buyer and seller: state timeline, actions allowed by `estados.ts`, chat (live), delivery code, review, dispute and refund marks; `/mi-negocio/ordenes`; notices badge.
- **Task 8, administration:** `/admin`: shops to approve or suspend, all orders, disputes to resolve, circularity panel, audit log.

## Wave 3

- **Task 9, end-to-end tests** (Playwright, phone viewport): seller applies and is approved, publishes a product, a buyer orders and pays with the fake provider, delivery with code, review; a dispute path; the five Review Focus cases.
- **Task 10, QA sweep** as done for Media and Travel: journey, mobile and accessibility, copy, code review; then fixes.
