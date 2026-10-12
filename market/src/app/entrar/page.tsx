import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { destinoSeguro, rutaCuenta } from '@/servidor/cuentas';
import { sesionActual } from '@/servidor/sesion';

import { FormularioEntrar } from './FormularioEntrar';

export const metadata: Metadata = {
  title: 'Entrar',
};

// The sign-in form. The destination comes from the URL, so the form streams in behind a boundary.
export default function PaginaEntrar(props: PageProps<'/entrar'>) {
  return (
    <div className="entrar">
      <section className="encabezado">
        <h1>Entrá con tu celular</h1>
        <p>Te mandamos un código de seis números. No hace falta contraseña.</p>
      </section>

      <Suspense fallback={<p role="status">Cargando…</p>}>
        <EntradaConDestino busqueda={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function EntradaConDestino({ busqueda }: { busqueda: PageProps<'/entrar'>['searchParams'] }) {
  await connection();
  const params = await busqueda;
  const volver = destinoSeguro(params.volver);

  // Already signed in: skip the form. A new account without a name sets it first.
  const sesion = await sesionActual();
  if (sesion) {
    redirect(sesion.usuario.nombre.trim() ? volver : rutaCuenta(volver));
  }

  return <FormularioEntrar volver={volver} />;
}
