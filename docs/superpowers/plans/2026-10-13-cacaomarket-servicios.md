# CacaoMarket Services and Requests Board Implementation Plan

> **For agentic workers:** executed with subagent-driven development: one fresh agent per task, the
> orchestrator verifies each wave before the next starts.

**Goal:** Add a services marketplace to CacaoMarket: a catalogue of services (fixed price or quoted), a board where people post what they need and providers make offers, and service jobs paid in sats when the work is done.

**Architecture:** A job is an order of type `servicio`, so chat, reviews, disputes, notices, lists and the circularity metric are reused. New tables hold services, needs and quotes. Every write stays a Postgres function called by the server with the service role. The payment request for a service is created after the work is marked done.

**Tech Stack:** Next.js 16.4 App Router, React 19, Supabase (Postgres, Auth, Realtime), Vitest, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-13-cacaomarket-servicios-design.md` (Spanish). Read it in full; it is the source of behaviour and wording.

## Global Constraints

- Everything in `docs/superpowers/plans/2026-10-12-cacaomarket-fase-1.md`, section "Global Constraints", still binds: work only in `market/`; read the Next 16 docs before using an API; non-custodial; the browser never writes; prices in USD cents; sats integers rounded up; Spanish with voseo, sentence case, no dashes, no exclamation marks; brand colours through CSS variables only; phone first at 375px, no sideways scroll at 320px, 44px tap targets; comments in English saying why; no new dependencies; commits without tool attribution.
- Product orders do not change behaviour. All existing tests (215 unit and database, 26 end-to-end) keep passing.
- A new enum value is added in one migration and used only in a later one.
- Hosted Supabase grants nothing by default after `20261012000003_privilegios.sql`: every new table needs explicit, minimal `grant select` statements, row-level security enabled, and select-only policies. New functions: `security definer`, `set search_path = public`, `revoke execute ... from public, anon, authenticated`, `grant execute ... to service_role`.
- Errors are raised as `CODIGO: frase en español` with the existing codes (`SIN_STOCK`, `NEGOCIO_CERRADO`, `NO_PERMITIDO`, `ESTADO_INVALIDO`, `NO_ENCONTRADA`, `CODIGO_INCORRECTO`, `DATOS_INVALIDOS`, `FUERA_DE_PLAZO`).
- A service is paid after the work: the screens say "Pagás cuando el trabajo esté hecho. CacaoMarket no guarda tu dinero." to the client and "Cobrás al terminar. Coordiná bien antes de ir." to the provider.

## Review Focus

- Two clients accept two offers of the same need at the same moment, or one client double-taps accept: exactly one order, the need is `asignada`, the other offers are `rechazada`.
- Double tap on "Contratar": one job (idempotency key per client).
- A service payment request expires on the payment screen: the screen says so, the order returns to `hecha`, a new request can be made, and paying the old one late never marks the order paid.
- The provider edits the price or pauses the service after it was hired: the order keeps the agreed price.
- Someone guesses the URL of another person's quote, the offers of another person's need, or another person's job: "Esta página no existe", no data.

## File structure

```
market/supabase/migrations/
  20261013000001_servicios_tipos.sql     new enum values and new enums only
  20261013000002_servicios.sql           tables, policies, grants, functions
market/scripts/sembrar.mjs               adds service categories, services, needs, quotes, jobs
market/tests/db/servicios*.test.ts       database tests for the new functions
market/src/lib/estados.ts                states, labels and actions per order type
market/src/servidor/
  servicios.ts  necesidades.ts  cotizaciones.ts     new
  pagos.ts  pedidos.ts  disputas.ts  admin.ts  avisos.ts   extended for service orders
market/src/componentes/Puertas.tsx       the Supermercado / Servicios / Necesito switch
market/src/app/
  servicios/**            catalogue and service page
  necesito/**             board, new need, need page with offers
  cotizaciones/**         the client's quotes and needs
  mi-negocio/servicios/** mi-negocio/cotizaciones/**   provider panel
  ordenes/**              job states on the existing order pages
  admin/servicios/**      moderation; unpaid jobs; new dispute results
market/tests/e2e/servicios*.spec.ts
```

## Database contract (Task 1 implements; the server layer consumes)

New enum values: `estado_orden` + `acordada`, `hecha`, `cancelada`; `resultado_disputa` + `corresponde_pagar`, `no_corresponde_pagar`. New enums: `tipo_orden` (`productos`, `servicio`), `tipo_precio` (`fijo`, `cotizar`), `estado_necesidad` (`abierta`, `asignada`, `cancelada`, `vencida`), `estado_cotizacion` (`solicitada`, `ofrecida`, `aceptada`, `rechazada`, `retirada`, `vencida`).

Tables (columns beyond `id uuid` and timestamps):

- `ordenes` gains `tipo tipo_orden not null default 'productos'`, `hecha_en`, `cancelada_en`, `motivo_cancelacion text`; `modo_entrega` becomes nullable with a check that product orders have it. Session column grants add the new columns (never `codigo_entrega`).
- `lineas_orden`: `producto_id` nullable, `servicio_id uuid references servicios`, check exactly one is set.
- `categorias_servicio (id smallint identity, nombre unique, orden)`.
- `servicios (negocio_id, categoria_id, titulo 2..80, descripcion <=600, zona <=160, tipo_precio, precio_usd_centavos null unless fijo, unidad <=40 null unless fijo, activo default true, oculto default false, fotos text[], creado_en)`.
- `necesidades (usuario_id, categoria_id, titulo 4..100, descripcion <=1000, zona <=160, presupuesto_usd_centavos null, estado default 'abierta', oculta default false, creada_en, vence_en default now() + 14 days)`.
- `cotizaciones (negocio_id, cliente_id, servicio_id null, necesidad_id null, check exactly one; descripcion_cliente <=1000, precio_usd_centavos null until offered, mensaje <=600, estado, orden_id null references ordenes, creada_en, respondida_en; unique (necesidad_id, negocio_id))`.
- `avisos` gains `ruta text` (site path for notices that are not about an order).

Read rules: `servicios` to everyone when `activo and not oculto` and the shop is `aprobado`, always to its owner and admins. `necesidades` to everyone when `estado = 'abierta' and not oculta`, always to its author and admins. `cotizaciones` only to its client, the owner of its shop, and admins. `categorias_servicio` to everyone.

Functions (all return the row named unless stated):

| Function | Rule |
|---|---|
| `guardar_servicio(p_usuario uuid, p_servicio uuid, p_categoria int, p_titulo text, p_descripcion text, p_zona text, p_tipo_precio tipo_precio, p_precio int, p_unidad text, p_activo boolean, p_fotos text[]) returns servicios` | `p_servicio` null creates; otherwise it must belong to the user's shop. `fijo` needs price > 0 and a unit; `cotizar` stores both as null. |
| `ocultar_servicio(p_servicio uuid, p_actor uuid, p_oculto boolean) returns servicios` | Admin. Audit row. |
| `publicar_necesidad(p_usuario uuid, p_categoria int, p_titulo text, p_descripcion text, p_zona text, p_presupuesto int) returns necesidades` | Any user. Budget null or > 0. |
| `cancelar_necesidad(p_necesidad uuid, p_usuario uuid) returns necesidades` | Author; `abierta` -> `cancelada`; its open quotes -> `rechazada`. |
| `ocultar_necesidad(p_necesidad uuid, p_actor uuid, p_oculta boolean) returns necesidades` | Admin. Audit row. |
| `vencer_necesidades() returns int` | `abierta` past `vence_en` -> `vencida`; their open quotes -> `vencida`. |
| `solicitar_cotizacion(p_cliente uuid, p_servicio uuid, p_descripcion text) returns cotizaciones` | Service visible and `cotizar`; shop `aprobado` and `abierto`; not the client's own shop; description 10..1000. State `solicitada`. Notice to the provider with `ruta`. |
| `responder_cotizacion(p_cotizacion uuid, p_actor uuid, p_precio int, p_mensaje text) returns cotizaciones` | Owner of the shop; `solicitada` -> `ofrecida`; price > 0. Notice to the client. |
| `ofertar(p_usuario uuid, p_necesidad uuid, p_precio int, p_mensaje text) returns cotizaciones` | User owns an `aprobado` shop; need `abierta`, not hidden, not past `vence_en`, not the user's own. One per shop and need: a `retirada` one is reused. State `ofrecida`. Notice to the author. |
| `retirar_cotizacion(p_cotizacion uuid, p_actor uuid) returns cotizaciones` | Provider; `solicitada` or `ofrecida` -> `retirada`. |
| `rechazar_cotizacion(p_cotizacion uuid, p_actor uuid) returns cotizaciones` | Client; `solicitada` or `ofrecida` -> `rechazada`. Notice to the provider. |
| `aceptar_cotizacion(p_cotizacion uuid, p_actor uuid, p_cotizacion_btc numeric) returns ordenes` | Client; quote `ofrecida`; shop `aprobado` and `abierto`. Locks the need row when there is one (must be `abierta`), sets it `asignada`, sets its other open quotes `rechazada`. Creates the order: `tipo = 'servicio'`, state `acordada`, one line (service title or need title, unit `trabajo`, quantity 1, the quoted price), totals from the price and `p_cotizacion_btc`. Quote `aceptada` with `orden_id`. If the quote is already `aceptada` by this client, return its order. Notices to both. |
| `contratar_servicio(p_cliente uuid, p_servicio uuid, p_nota text, p_clave text, p_cotizacion_btc numeric) returns ordenes` | Service visible and `fijo`; shop `aprobado` and `abierto`; not own. Idempotent on `(p_cliente, p_clave)`. Order as above with the service's price and unit. A non-empty note (<= 600) becomes the first chat message from the client. Notice to the provider. |
| `marcar_hecha(p_orden uuid, p_actor uuid) returns ordenes` | Shop owner; service order `acordada` -> `hecha`. Notice to the client: it can now be paid. |
| `cancelar_orden(p_orden uuid, p_actor uuid, p_motivo text) returns ordenes` | Client or shop owner; service order `acordada` -> `cancelada`; reason 4..300. If it came from a need not past `vence_en`, the need returns to `abierta`. Notice to the other party. |
| `registrar_cobro_servicio(p_orden uuid, p_proveedor tipo_proveedor, p_referencia text, p_bolt11 text, p_destino text, p_verificar_url text, p_expira_en timestamptz, p_cotizacion_btc numeric) returns cobros` | Service order `hecha`. Sets `cotizacion_usd_btc`, `total_sats = ceil(total_usd_centavos * 1e6 / p_cotizacion_btc)` and the theoretical commission, replaces any earlier request row for the order, moves the order to `esperando_pago`. |
| `confirmar_pago` (changed) | A service order goes `esperando_pago` -> `pagada` -> `entregada` in the same call, with both timestamps and no delivery code. Product orders unchanged. |
| `expirar_ordenes` (changed) | A service order in `esperando_pago` whose request expired returns to `hecha` and its request becomes `expirado`. Product orders unchanged. Also calls `vencer_necesidades()`. |
| `abrir_disputa` (changed) | Also allowed for the client of a service order in `hecha`. |
| `resolver_disputa` (changed) | For a service order never paid (`pagada_en is null`): only `corresponde_pagar` (order -> `hecha`) or `no_corresponde_pagar` (order -> `cancelada`). For every other order: only the three existing results. |

Every transition writes an `auditoria` row and the notices named above.

## Tasks

### Wave 1

**Task 1, database.** Files: the two migrations, `scripts/sembrar.mjs`, `tests/db/servicios*.test.ts`, regenerated `src/tipos/db.ts`. Implements the contract above; seeds six service categories, about twelve services across the sample shops, two service-only shops (a barber for Andrés, an electrician for Sofía), five open needs with one or two offers, and sample jobs in `acordada`, `hecha`, paid and cancelled. Tests: each function and role restriction; the full job cycle; payment expiry returning to `hecha` and late payment refused; the two concurrent accepts; idempotent hire; quote privacy through a second user's session; that sessions cannot write the new tables. Applies with `supabase migration up --local`, reseeds, runs every database test.

### Wave 2 (two agents in parallel, after Task 1)

**Task 2, server layer for services.** New `src/servidor/servicios.ts`, `necesidades.ts`, `cotizaciones.ts`: catalogue and detail reads, the provider's own lists, the client's quotes and needs, offers of a need for its author, offer counts, and one function per database write, each `(…ids, datos) => Promise<Resultado<T>>` with server-side validation. Integration tests in `tests/db/`.

**Task 3, order engine for jobs.** `src/lib/estados.ts` (and its tests): states, labels, descriptions, steps and `accionesPosibles` per order type, with the new actions `marcar_hecha`, `cancelar`, `pagar` at `hecha`. `src/servidor/pagos.ts`: payment request for a job at `hecha` with a fresh quote, expiry back to `hecha`. `pedidos.ts`, `disputas.ts`, `avisos.ts`, `admin.ts`: order type in lists and detail, `marcarHecha`, `cancelarOrden`, dispute on an unpaid job and its two resolutions, notices with `ruta`, hide and show for services and needs, the unpaid jobs list.

### Wave 3 (five agents in parallel, after Wave 2)

- **Task 4, catalogue:** `Puertas.tsx` on `/`, `/servicios`, `/necesito`; `/servicios` and `/servicios/[id]` with "Contratar" and "Pedir cotización".
- **Task 5, board:** `/necesito`, `/necesito/nuevo`, `/necesito/[id]` with offers; `/cotizaciones` for the client.
- **Task 6, provider panel:** `/mi-negocio/servicios/**`, `/mi-negocio/cotizaciones`, the sub-navigation.
- **Task 7, jobs:** job states, actions and copy on `/ordenes`, `/ordenes/[id]`, `/ordenes/[id]/pagar`, `/mi-negocio/ordenes`.
- **Task 8, administration:** `/admin/servicios`, the type filter and unpaid jobs in `/admin/ordenes`, the new results in `/admin/disputas`.

### Wave 4

- **Task 9, end-to-end tests:** fixed-price job, quoted job, board job with two offers, cancellation, unpaid dispute with both results, the five Review Focus cases, 320px on the new screens.
- **Task 10:** orchestrator: full test run, push migrations to the hosted project, seed it, deploy, live check.
