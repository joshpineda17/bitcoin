'use server';

// Entry points the payment screen calls. Each reads the session itself; the buyer check
// happens in src/servidor/pagos.ts.

import { estadoDePago, reintentarCobro, simularPago } from '@/servidor/pagos';
import { fallo, type Resultado } from '@/servidor/resultado';
import { sesionActual } from '@/servidor/sesion';

import type { EstadoPago } from './tipos';

const MENSAJE_NO_ENCONTRADA = 'No encontramos esa orden.';

export async function estadoDePagoAccion(ordenId: string): Promise<Resultado<EstadoPago>> {
  const sesion = await sesionActual();
  if (!sesion) return fallo('NO_ENCONTRADA', MENSAJE_NO_ENCONTRADA);
  return estadoDePago(ordenId, sesion.usuario.id);
}

export async function reintentarCobroAccion(ordenId: string): Promise<Resultado<EstadoPago>> {
  const sesion = await sesionActual();
  if (!sesion) return fallo('NO_ENCONTRADA', MENSAJE_NO_ENCONTRADA);
  return reintentarCobro(ordenId, sesion.usuario.id);
}

export async function simularPagoAccion(ordenId: string): Promise<Resultado<null>> {
  const sesion = await sesionActual();
  if (!sesion) return fallo('NO_ENCONTRADA', MENSAJE_NO_ENCONTRADA);
  return simularPago(ordenId, sesion.usuario.id);
}
