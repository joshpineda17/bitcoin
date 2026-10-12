// Order states, Spanish labels, and what each role can do next.

export type EstadoOrden =
  | 'creada'
  | 'esperando_pago'
  | 'pagada'
  | 'lista'
  | 'entregada'
  | 'cerrada'
  | 'expirada'
  | 'disputada'
  | 'resuelta';

export type Rol = 'comprador' | 'vendedor' | 'admin';

export type Accion =
  | 'pagar'
  | 'confirmar_pago'
  | 'marcar_lista'
  | 'marcar_entregada'
  | 'entregar_con_codigo'
  | 'resenar'
  | 'abrir_disputa'
  | 'resolver_disputa'
  | 'marcar_reembolso'
  | 'confirmar_reembolso';

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  creada: 'Creada',
  esperando_pago: 'Esperando pago',
  pagada: 'Pagada',
  lista: 'Lista',
  entregada: 'Entregada',
  cerrada: 'Cerrada',
  expirada: 'Expirada',
  disputada: 'En disputa',
  resuelta: 'Resuelta',
};

export const DESCRIPCION_ESTADO: Record<EstadoOrden, { comprador: string; vendedor: string }> = {
  creada: {
    comprador: 'Estamos registrando tu orden. Esperá un momento.',
    vendedor: 'Se está registrando la orden. Esperá un momento.',
  },
  esperando_pago: {
    comprador: 'Pagá la factura antes de que venza, o la orden expira.',
    vendedor: 'Esperá el pago. Si la Lightning Address no avisa sola, confirmalo a mano.',
  },
  pagada: {
    comprador: 'Pagaste. El vendedor está preparando tu pedido.',
    vendedor: 'Pago recibido. Preparalo y marcalo como lista cuando esté.',
  },
  lista: {
    comprador: 'Tu pedido está listo. Marcalo como entregado cuando lo recibas.',
    vendedor: 'Entregá el pedido y pedile al comprador el código de entrega.',
  },
  entregada: {
    comprador: 'Recibiste el pedido. Dejá una reseña o abrí una disputa dentro de las 48 h.',
    vendedor: 'El pedido fue entregado. La orden se cierra sola en 48 h si no hay disputa.',
  },
  cerrada: {
    comprador: 'La orden está cerrada. Podés dejar una reseña del vendedor.',
    vendedor: 'La orden está cerrada. El pago ya es tuyo.',
  },
  expirada: {
    comprador: 'El pago no llegó a tiempo y la orden expiró. Podés hacer otro pedido.',
    vendedor: 'El pago no llegó a tiempo y la orden expiró. El stock volvió a tu inventario.',
  },
  disputada: {
    comprador: 'Abriste una disputa. El administrador la va a revisar.',
    vendedor: 'El comprador abrió una disputa. El administrador la va a revisar.',
  },
  resuelta: {
    comprador: 'La disputa está resuelta. Revisá el resultado y confirmá el reembolso si corresponde.',
    vendedor: 'La disputa está resuelta. Si corresponde un reembolso, pagalo fuera de la app y marcalo.',
  },
};

// Happy path, in order, for the progress display.
export const PASOS: EstadoOrden[] = ['esperando_pago', 'pagada', 'lista', 'entregada', 'cerrada'];

const VENTANA_DISPUTA_MS = 48 * 60 * 60 * 1000;

export type OrdenParaAcciones = {
  estado: EstadoOrden;
  entregadaEn: Date | null;
  tieneResena: boolean;
  disputa: {
    estado: 'abierta' | 'resuelta';
    resultado: 'reembolso_total' | 'reembolso_parcial' | 'sin_reembolso' | null;
    reembolsoMarcado: boolean;
    reembolsoConfirmado: boolean;
  } | null;
  proveedor: 'manual' | 'falso' | 'nwc' | 'blink';
};

// Buyer may open a dispute from payment until 48 h after delivery, and only once.
function disputaPosible(orden: OrdenParaAcciones, ahora: Date): boolean {
  if (orden.disputa !== null) return false;
  if (orden.estado === 'pagada' || orden.estado === 'lista') return true;
  if (orden.estado === 'entregada' && orden.entregadaEn !== null) {
    return ahora.getTime() - orden.entregadaEn.getTime() <= VENTANA_DISPUTA_MS;
  }
  return false;
}

export function accionesPosibles(orden: OrdenParaAcciones, rol: Rol, ahora: Date = new Date()): Accion[] {
  const acciones: Accion[] = [];
  const comprador = rol === 'comprador';
  const vendedor = rol === 'vendedor';
  const admin = rol === 'admin';

  switch (orden.estado) {
    case 'esperando_pago':
      if (comprador) acciones.push('pagar');
      // Only manual payments need the seller to confirm; the others are detected.
      if (vendedor && orden.proveedor === 'manual') acciones.push('confirmar_pago');
      break;
    case 'pagada':
      if (vendedor) acciones.push('marcar_lista');
      break;
    case 'lista':
      if (comprador) acciones.push('marcar_entregada');
      if (vendedor) acciones.push('entregar_con_codigo');
      break;
    case 'entregada':
    case 'cerrada':
      if (comprador && !orden.tieneResena) acciones.push('resenar');
      break;
    case 'disputada':
      if (admin) acciones.push('resolver_disputa');
      break;
    case 'resuelta': {
      const disputa = orden.disputa;
      const ordenaReembolso =
        disputa !== null &&
        disputa.estado === 'resuelta' &&
        (disputa.resultado === 'reembolso_total' || disputa.resultado === 'reembolso_parcial');
      if (ordenaReembolso && disputa !== null) {
        // The seller pays outside the app and marks it; the buyer confirms receipt.
        if (vendedor && !disputa.reembolsoMarcado) acciones.push('marcar_reembolso');
        if (comprador && disputa.reembolsoMarcado && !disputa.reembolsoConfirmado) {
          acciones.push('confirmar_reembolso');
        }
      }
      break;
    }
    case 'creada':
    case 'expirada':
      break;
  }

  if (comprador && disputaPosible(orden, ahora)) acciones.push('abrir_disputa');
  return acciones;
}
