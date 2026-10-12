// Seeds the local database: nine test users, six categories, four shops, 24 products and eight
// orders in different states. Orders go through the real database functions, never direct inserts.
// Safe to run twice: whatever already exists is skipped.
//
// Run from the market folder: node --env-file=.env.local scripts/sembrar.mjs

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !claveServicio) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Usá --env-file=.env.local.');
  process.exit(1);
}

const s = createClient(url, claveServicio, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// Fixed quote for the seed: USD per BTC.
const COTIZACION = 100000;
const MINUTO_MS = 60 * 1000;
const DIA_MS = 24 * 60 * MINUTO_MS;
const ahora = Date.now();

const nuevos = { usuarios: 0, negocios: 0, productos: 0, ordenes: 0 };

// Test phones are 5037000000 plus one digit (see supabase/config.toml).
const USUARIOS = [
  { numero: 1, nombre: 'Ana', admin: true },
  { numero: 2, nombre: 'Rosa' },
  { numero: 3, nombre: 'Mario' },
  { numero: 4, nombre: 'Elena' },
  { numero: 5, nombre: 'Tomás' },
  { numero: 6, nombre: 'Lucía' },
  { numero: 7, nombre: 'Andrés' },
  { numero: 8, nombre: 'Sofía' },
  { numero: 9, nombre: 'Diego' },
];

const CATEGORIAS = ['Frutas', 'Verduras', 'Granos y café', 'Lácteos y huevos', 'Miel y conservas', 'Hierbas y plantas'];

// The shop owner is the user number; user 9 has no shop.
const TIENDAS = [
  {
    dueno: 2,
    nombre: 'Huerta La Ceiba',
    descripcion: 'Hortalizas y frutas de temporada, cultivadas a la orilla de la quebrada.',
    ubicacion: 'El Zonte, La Libertad',
    lightning: 'huerta-la-ceiba@ejemplo.sv',
  },
  {
    dueno: 3,
    nombre: 'Cafetal El Mirador',
    descripcion: 'Café y granos secados al sol en la ladera del Bálsamo. Tostado por pedido.',
    ubicacion: 'Cerro El Bálsamo, La Libertad',
    lightning: 'cafetal-el-mirador@ejemplo.sv',
  },
  {
    dueno: 4,
    nombre: 'Quesería Las Brisas',
    descripcion: 'Queso fresco, crema, huevos de gallina criolla y miel de abeja.',
    ubicacion: 'Zona de El Zonte, La Libertad',
    lightning: 'queseria-las-brisas@ejemplo.sv',
  },
  {
    dueno: 5,
    nombre: 'Hierbas del Cerro',
    descripcion: 'Hierbas aromáticas, té de flor de jamaica y conservas de temporada.',
    ubicacion: 'Bálsamo, La Libertad',
    lightning: 'hierbas-del-cerro@ejemplo.sv',
  },
];

// [dueño, categoría, nombre, unidad, precio en centavos de USD, stock, activo]
const PRODUCTOS = [
  [2, 'Verduras', 'Tomate criollo', 'libra', 80, 30, true],
  [2, 'Verduras', 'Chile verde', 'libra', 60, 25, true],
  [2, 'Verduras', 'Güisquil', 'unidad', 50, 40, true],
  [2, 'Verduras', 'Pepino', 'libra', 55, 20, true],
  [2, 'Frutas', 'Mango manila', 'libra', 70, 0, true],
  [2, 'Frutas', 'Banano', 'docena', 150, 20, true],
  [2, 'Frutas', 'Plátano maduro', 'docena', 200, 16, true],
  [2, 'Hierbas y plantas', 'Albahaca', 'manojo', 50, 15, true],
  [2, 'Hierbas y plantas', 'Culantro', 'manojo', 50, 12, true],
  [3, 'Granos y café', 'Café tostado en grano', 'bolsa de 1 libra', 1200, 18, true],
  [3, 'Granos y café', 'Café molido', 'bolsa de 1 libra', 1100, 22, true],
  [3, 'Granos y café', 'Cacao en grano tostado', 'bolsa de 1 libra', 1000, 9, true],
  [3, 'Granos y café', 'Maíz blanco', 'libra', 90, 40, true],
  [3, 'Granos y café', 'Frijol rojo', 'libra', 110, 35, true],
  [4, 'Lácteos y huevos', 'Queso fresco', 'libra', 650, 10, true],
  [4, 'Lácteos y huevos', 'Huevos de gallina criolla', 'docena', 400, 30, true],
  [4, 'Lácteos y huevos', 'Crema de leche', 'botella de 750 ml', 550, 8, true],
  [4, 'Miel y conservas', 'Miel de abeja', 'botella de 750 ml', 1000, 12, true],
  [4, 'Miel y conservas', 'Mermelada de nance', 'frasco de 370 ml', 550, 9, false],
  [5, 'Hierbas y plantas', 'Hierbabuena', 'manojo', 50, 0, true],
  [5, 'Hierbas y plantas', 'Té de flor de jamaica', 'bolsa de 1 libra', 500, 14, true],
  [5, 'Miel y conservas', 'Conserva de chile jalapeño', 'frasco de 370 ml', 600, 10, true],
  [5, 'Frutas', 'Maracuyá', 'docena', 300, 12, true],
  [5, 'Frutas', 'Limón mandarina', 'libra', 50, 25, true],
];

// comprador and tienda are user numbers. estado is where the order ends.
// entrega: who marks it delivered ('comprador' or 'vendedor', the latter with the code).
const PEDIDOS = [
  {
    clave: 'sembrar-01',
    comprador: 6,
    tienda: 2,
    lineas: [['Tomate criollo', 2], ['Albahaca', 1]],
    estado: 'esperando_pago',
  },
  {
    clave: 'sembrar-02',
    comprador: 2,
    tienda: 3,
    lineas: [['Café tostado en grano', 1], ['Maíz blanco', 2]],
    estado: 'pagada',
  },
  {
    clave: 'sembrar-03',
    comprador: 7,
    tienda: 4,
    modo: 'entrega_vendedor',
    lineas: [['Queso fresco', 1], ['Huevos de gallina criolla', 1]],
    estado: 'pagada',
  },
  {
    clave: 'sembrar-04',
    comprador: 9,
    tienda: 2,
    lineas: [['Banano', 2], ['Pepino', 1]],
    estado: 'lista',
    mensajes: [
      [9, '¿Me lo podés dejar en la entrada de la finca?'],
      [2, 'Sí, dejalo en la caseta junto al portón.'],
    ],
  },
  {
    clave: 'sembrar-05',
    comprador: 3,
    tienda: 4,
    lineas: [['Miel de abeja', 1], ['Crema de leche', 1]],
    estado: 'cerrada',
    entrega: 'comprador',
    resena: [5, 'Miel muy rica y todo llegó bien.'],
  },
  {
    clave: 'sembrar-06',
    comprador: 8,
    tienda: 5,
    lineas: [['Té de flor de jamaica', 1], ['Conserva de chile jalapeño', 1]],
    estado: 'cerrada',
    entrega: 'vendedor',
    resena: [4, 'Buena conserva, el té tiene buen aroma.'],
  },
  {
    clave: 'sembrar-07',
    comprador: 7,
    tienda: 5,
    lineas: [['Maracuyá', 1]],
    estado: 'entregada',
    entrega: 'comprador',
  },
  {
    clave: 'sembrar-08',
    comprador: 8,
    tienda: 3,
    lineas: [['Café molido', 1]],
    estado: 'disputada',
    disputa: 'El café llegó con otro tueste que el de la foto.',
    mensajes: [
      [8, 'Lo pedí de tueste medio, no oscuro.'],
      [3, 'Revisamos el lote y te mandamos una foto del empaque.'],
    ],
  },
];

// Calls a database function and stops with its message when it fails.
async function rpc(nombre, args) {
  const { data, error } = await s.rpc(nombre, args);
  if (error) throw new Error(`${nombre}: ${error.message}`);
  return data;
}

async function unico(tabla, columnas, filtros) {
  let consulta = s.from(tabla).select(columnas);
  for (const [columna, valor] of Object.entries(filtros)) consulta = consulta.eq(columna, valor);
  const { data, error } = await consulta.maybeSingle();
  if (error) throw error;
  return data;
}

async function asegurarUsuarios() {
  const ids = {};
  for (const u of USUARIOS) {
    const telefono = `5037000000${u.numero}`;
    const { data: existente, error } = await s.from('usuarios').select('id').eq('telefono', telefono).maybeSingle();
    if (error) throw error;
    let id = existente?.id;
    if (!id) {
      const { data, error: errorAlta } = await s.auth.admin.createUser({ phone: telefono, phone_confirm: true });
      if (errorAlta) throw errorAlta;
      id = data.user.id;
      nuevos.usuarios++;
    }
    await rpc('actualizar_perfil', { p_usuario: id, p_nombre: u.nombre });
    if (u.admin) {
      const { error: errorAdmin } = await s.from('usuarios').update({ es_admin: true }).eq('id', id);
      if (errorAdmin) throw errorAdmin;
    }
    ids[u.numero] = id;
  }
  return ids;
}

async function asegurarCategorias() {
  const { error } = await s
    .from('categorias')
    .upsert(CATEGORIAS.map((nombre, i) => ({ nombre, orden: i + 1 })), { onConflict: 'nombre', ignoreDuplicates: true });
  if (error) throw error;
  const { data, error: errorLectura } = await s.from('categorias').select('id, nombre');
  if (errorLectura) throw errorLectura;
  return Object.fromEntries(data.map((c) => [c.nombre, c.id]));
}

async function asegurarTiendas(ids, idAdmin) {
  const negocioDe = {};
  for (const t of TIENDAS) {
    const existente = await unico('negocios', 'id, estado', { usuario_id: ids[t.dueno] });
    let id = existente?.id;
    let estado = existente?.estado;
    if (!id) {
      const negocio = await rpc('solicitar_negocio', {
        p_usuario: ids[t.dueno],
        p_nombre: t.nombre,
        p_descripcion: t.descripcion,
        p_ubicacion: t.ubicacion,
        p_lightning_address: t.lightning,
      });
      id = negocio.id;
      estado = negocio.estado;
      nuevos.negocios++;
    }
    if (estado !== 'aprobado') {
      await rpc('cambiar_estado_negocio', { p_negocio: id, p_actor: idAdmin, p_estado: 'aprobado' });
    }
    // The fake provider lets developers simulate payments without a wallet.
    const { error } = await s.from('negocios').update({ tipo_proveedor_pago: 'falso' }).eq('id', id);
    if (error) throw error;
    negocioDe[t.dueno] = id;
  }
  return negocioDe;
}

async function asegurarProductos(ids, negocioDe, categoriaDe) {
  const { data: existentes, error } = await s.from('productos').select('negocio_id, nombre');
  if (error) throw error;
  const yaExisten = new Set(existentes.map((p) => `${p.negocio_id}|${p.nombre}`));

  for (const [dueno, categoria, nombre, unidad, precio, stock, activo] of PRODUCTOS) {
    if (yaExisten.has(`${negocioDe[dueno]}|${nombre}`)) continue;
    await rpc('guardar_producto', {
      p_usuario: ids[dueno],
      p_producto: null,
      p_categoria: categoriaDe[categoria],
      p_nombre: nombre,
      p_descripcion: '',
      p_unidad: unidad,
      p_precio: precio,
      p_stock: stock,
      p_activo: activo,
      p_fotos: [],
    });
    nuevos.productos++;
  }

  const { data: todos, error: errorLectura } = await s.from('productos').select('id, negocio_id, nombre');
  if (errorLectura) throw errorLectura;
  return new Map(todos.map((p) => [`${p.negocio_id}|${p.nombre}`, p.id]));
}

async function sembrarPedido(p, ids, negocioDe, productoDe) {
  const comprador = ids[p.comprador];
  const vendedor = ids[p.tienda];
  const { data: existe, error } = await s
    .from('ordenes')
    .select('id')
    .eq('comprador_id', comprador)
    .eq('clave_idempotencia', p.clave)
    .maybeSingle();
  if (error) throw error;
  if (existe) return;

  const orden = await rpc('crear_orden', {
    p_comprador: comprador,
    p_negocio: negocioDe[p.tienda],
    p_lineas: p.lineas.map(([nombre, cantidad]) => ({
      producto_id: productoDe.get(`${negocioDe[p.tienda]}|${nombre}`),
      cantidad,
    })),
    p_modo: p.modo ?? 'recogida',
    p_clave: p.clave,
    p_cotizacion: COTIZACION,
  });
  nuevos.ordenes++;

  if (p.estado === 'esperando_pago') {
    // A day, not ten minutes, so the seeded request does not expire while someone looks at it.
    await rpc('registrar_cobro', {
      p_orden: orden.id,
      p_proveedor: 'falso',
      p_referencia: `sembrar-${p.clave}`,
      p_bolt11: null,
      p_destino: null,
      p_verificar_url: null,
      p_expira_en: new Date(ahora + DIA_MS).toISOString(),
    });
  } else {
    await rpc('registrar_cobro', {
      p_orden: orden.id,
      p_proveedor: 'falso',
      p_referencia: `sembrar-${p.clave}`,
      p_bolt11: null,
      p_destino: null,
      p_verificar_url: null,
      p_expira_en: new Date(Date.now() + 10 * MINUTO_MS).toISOString(),
    });
    await rpc('confirmar_pago', { p_orden: orden.id, p_actor: null });

    if (p.disputa) {
      await rpc('abrir_disputa', {
        p_orden: orden.id,
        p_actor: comprador,
        p_motivo: p.disputa,
        p_evidencia: 'Foto del empaque enviada por el chat.',
      });
    }

    if (['lista', 'entregada', 'cerrada'].includes(p.estado)) {
      await rpc('marcar_lista', { p_orden: orden.id, p_actor: vendedor });
    }

    if (['entregada', 'cerrada'].includes(p.estado)) {
      const { data: fresca, error: errorCodigo } = await s
        .from('ordenes')
        .select('codigo_entrega')
        .eq('id', orden.id)
        .single();
      if (errorCodigo) throw errorCodigo;
      const porVendedor = p.entrega === 'vendedor';
      await rpc('marcar_entregada', {
        p_orden: orden.id,
        p_actor: porVendedor ? vendedor : comprador,
        p_codigo: porVendedor ? fresca.codigo_entrega : null,
      });
    }

    if (p.resena) {
      await rpc('crear_resena', {
        p_orden: orden.id,
        p_actor: comprador,
        p_puntuacion: p.resena[0],
        p_comentario: p.resena[1],
      });
    }
  }

  for (const [autor, texto] of p.mensajes ?? []) {
    await rpc('enviar_mensaje', { p_orden: orden.id, p_actor: ids[autor], p_texto: texto });
  }
}

async function resumen(negocioDe) {
  const tiendas = Object.values(negocioDe);

  const { count: usuarios } = await s
    .from('usuarios')
    .select('id', { count: 'exact', head: true })
    .in('telefono', USUARIOS.map((u) => `5037000000${u.numero}`));
  const { count: categorias } = await s.from('categorias').select('id', { count: 'exact', head: true });
  const { count: aprobados } = await s
    .from('negocios')
    .select('id', { count: 'exact', head: true })
    .in('id', tiendas)
    .eq('estado', 'aprobado');
  const { data: productos } = await s.from('productos').select('activo, stock').in('negocio_id', tiendas);
  const { data: ordenes } = await s.from('ordenes').select('id, estado').like('clave_idempotencia', 'sembrar-%');
  const idsOrdenes = (ordenes ?? []).map((o) => o.id);
  const { count: mensajes } = await s
    .from('mensajes')
    .select('id', { count: 'exact', head: true })
    .in('orden_id', idsOrdenes);
  const { count: avisos } = await s
    .from('avisos')
    .select('id', { count: 'exact', head: true })
    .in('orden_id', idsOrdenes);

  const porEstado = {};
  for (const o of ordenes ?? []) porEstado[o.estado] = (porEstado[o.estado] ?? 0) + 1;

  console.log('Sembrado listo.');
  console.log(`  Usuarios de prueba: ${usuarios} (nuevos: ${nuevos.usuarios})`);
  console.log(`  Categorías: ${categorias}`);
  console.log(`  Negocios aprobados: ${aprobados} (nuevos: ${nuevos.negocios})`);
  console.log(
    `  Productos: ${productos?.length ?? 0}, activos: ${(productos ?? []).filter((p) => p.activo).length}, ` +
      `sin stock: ${(productos ?? []).filter((p) => p.stock === 0).length} (nuevos: ${nuevos.productos})`,
  );
  console.log(`  Órdenes: ${ordenes?.length ?? 0} (nuevas: ${nuevos.ordenes})`);
  console.log(`  Por estado: ${Object.entries(porEstado).map(([e, n]) => `${e} ${n}`).join(', ')}`);
  console.log(`  Mensajes: ${mensajes}, avisos: ${avisos}`);
}

async function main() {
  const ids = await asegurarUsuarios();
  const categoriaDe = await asegurarCategorias();
  const negocioDe = await asegurarTiendas(ids, ids[1]);
  const productoDe = await asegurarProductos(ids, negocioDe, categoriaDe);

  for (const p of PEDIDOS) {
    await sembrarPedido(p, ids, negocioDe, productoDe);
  }

  await resumen(negocioDe);
}

main().catch((error) => {
  console.error('El sembrado falló:', error.message);
  process.exit(1);
});
