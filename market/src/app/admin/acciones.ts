'use server';

import { revalidatePath } from 'next/cache';

import { cambiarEstadoNegocio, resolverDisputa } from '@/servidor/admin';
import { exigirAdmin } from '@/servidor/sesion';
import { exito, fallo, type Resultado } from '@/servidor/resultado';

import { TODOS_LOS_RESULTADOS, type ResultadoDisputa } from '@/lib/estados';

// Accepts all five results; servidor/admin.ts checks each one against the order it is for.

// Every action checks the admin session itself. The id of the admin comes from the session,
// never from the form.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function cambiarEstadoNegocioAccion(
  _previo: Resultado<string> | null,
  datos: FormData,
): Promise<Resultado<string>> {
  const sesion = await exigirAdmin();
  const negocio = texto(datos.get('negocio'));
  const estado = texto(datos.get('estado'));

  if (!UUID.test(negocio)) return fallo('NO_ENCONTRADA', 'No encontramos ese negocio.');
  if (estado !== 'aprobado' && estado !== 'suspendido') {
    return fallo('DATOS_INVALIDOS', 'Elegí si el negocio se aprueba o se suspende.');
  }

  const resultado = await cambiarEstadoNegocio(sesion.usuario.id, negocio, estado);
  if (!resultado.ok) return resultado;

  // Shop counts, the shop groups and the summary all change with the state.
  revalidatePath('/admin', 'layout');
  return exito(estado === 'aprobado' ? 'Negocio aprobado. Ya puede publicar productos.' : 'Negocio suspendido.');
}

export async function resolverDisputaAccion(
  _previo: Resultado<string> | null,
  datos: FormData,
): Promise<Resultado<string>> {
  const sesion = await exigirAdmin();
  const orden = texto(datos.get('orden'));
  const resultadoTexto = texto(datos.get('resultado'));
  const nota = texto(datos.get('nota'));

  if (!UUID.test(orden)) return fallo('NO_ENCONTRADA', 'No encontramos esa orden.');
  if (!TODOS_LOS_RESULTADOS.includes(resultadoTexto as ResultadoDisputa)) {
    return fallo('DATOS_INVALIDOS', 'Elegí un resultado para la disputa.');
  }
  if (nota.length < 10 || nota.length > 1000) {
    return fallo('DATOS_INVALIDOS', 'La nota tiene que tener entre 10 y 1000 caracteres.');
  }

  const resultado = await resolverDisputa(
    sesion.usuario.id,
    orden,
    resultadoTexto as ResultadoDisputa,
    nota,
  );
  if (!resultado.ok) return resultado;

  revalidatePath('/admin', 'layout');
  return exito('Disputa resuelta. Si corresponde un reembolso, el vendedor lo paga y lo marca.');
}
