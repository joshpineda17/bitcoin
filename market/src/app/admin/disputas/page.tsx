import type { Metadata } from 'next';

import { disputasAdmin } from '@/servidor/admin';
import { exigirAdmin } from '@/servidor/sesion';

import estilos from '../estilos.module.css';
import { ListaDisputas } from './ListaDisputas';

export const metadata: Metadata = {
  title: 'Disputas',
};

export default async function PaginaDisputas() {
  const sesion = await exigirAdmin();
  const disputas = await disputasAdmin(sesion.usuario.id);

  return (
    <>
      <section className={estilos.bloque} aria-labelledby="titulo-disputas">
        <h2 id="titulo-disputas" className={estilos.subtitulo}>
          Disputas
        </h2>
        <p className={estilos.descripcion}>
          Las abiertas van primero, la más antigua arriba. Resolvé cada una con una nota que explique la decisión.
        </p>
      </section>

      {disputas.length === 0 ? (
        <p className={estilos.vacio}>No hay disputas todavía.</p>
      ) : (
        <ListaDisputas disputas={disputas} />
      )}
    </>
  );
}
