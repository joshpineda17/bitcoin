import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import type { EstadoOrden } from '@/lib/estados';
import { asegurarCobro, estadoDePago } from '@/servidor/pagos';
import { exigirSesion } from '@/servidor/sesion';

import { PagoCliente } from './PagoCliente';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// States that still belong on this screen. Anything later means the order was paid.
const ESTADOS_DE_PAGO: EstadoOrden[] = ['creada', 'esperando_pago', 'expirada'];

export const metadata: Metadata = { title: 'Pagar la orden' };

export default function PaginaPagar(props: PageProps<'/ordenes/[id]/pagar'>) {
  return (
    <Suspense fallback={<p role="status">Cargando el pago…</p>}>
      <PagoOrden params={props.params} />
    </Suspense>
  );
}

async function PagoOrden({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const sesion = await exigirSesion(`/ordenes/${id}/pagar`);
  const lectura = await estadoDePago(id, sesion.usuario.id);
  if (!lectura.ok) {
    // Not the buyer and not found look the same on purpose.
    if (lectura.codigo === 'NO_ENCONTRADA') notFound();
    return <p role="alert">{lectura.mensaje}</p>;
  }

  let estado = lectura.dato;
  let problema: string | null = null;
  // The order exists but its payment request failed earlier: try again on load.
  if (estado.estado === 'creada') {
    const cobro = await asegurarCobro(id);
    if (cobro.ok) {
      const relectura = await estadoDePago(id, sesion.usuario.id);
      if (relectura.ok) estado = relectura.dato;
    } else {
      problema = cobro.mensaje;
    }
  }

  if (!ESTADOS_DE_PAGO.includes(estado.estado)) redirect(`/ordenes/${id}`);

  return <PagoCliente ordenId={id} inicial={estado} errorCobro={problema} />;
}
