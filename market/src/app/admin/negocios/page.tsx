import type { Metadata } from 'next';

import {
  ETIQUETA_NEGOCIO,
  ETIQUETA_PROVEEDOR,
  type EstadoNegocio,
  formatoFecha,
  formatoTelefono,
  nombreVisible,
} from '@/app/admin/etiquetas';
import { negociosAdmin, type NegocioAdmin } from '@/servidor/admin';
import { exigirAdmin } from '@/servidor/sesion';

import estilos from '../estilos.module.css';
import { AccionesNegocio } from './AccionesNegocio';

export const metadata: Metadata = {
  title: 'Negocios',
};

const GRUPOS: { estado: EstadoNegocio; titulo: string }[] = [
  { estado: 'pendiente', titulo: 'Por aprobar' },
  { estado: 'aprobado', titulo: 'Aprobados' },
  { estado: 'suspendido', titulo: 'Suspendidos' },
];

export default async function PaginaNegocios() {
  const sesion = await exigirAdmin();
  const negocios = await negociosAdmin(sesion.usuario.id);

  return (
    <>
      <section className={estilos.bloque} aria-labelledby="titulo-negocios">
        <h2 id="titulo-negocios" className={estilos.subtitulo}>
          Negocios
        </h2>
        <p className={estilos.descripcion}>
          Aprobá un negocio para que publique productos. Suspendilo si incumple una resolución.
        </p>
      </section>

      {GRUPOS.map((grupo) => {
        const lista = negocios.filter((n) => n.estado === grupo.estado);
        return (
          <section key={grupo.estado} className={estilos.bloque} aria-labelledby={`grupo-${grupo.estado}`}>
            <h3 id={`grupo-${grupo.estado}`} className={estilos.subtitulo}>
              {grupo.titulo} ({lista.length})
            </h3>
            {lista.length === 0 ? (
              <p className={estilos.vacio}>Ninguno por ahora.</p>
            ) : (
              <div className={estilos.grupo}>
                {lista.map((n) => (
                  <TarjetaNegocio key={n.id} negocio={n} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

function TarjetaNegocio({ negocio: n }: { negocio: NegocioAdmin }) {
  return (
    <article className={estilos.tarjetaGrande} aria-labelledby={`negocio-${n.id}`}>
      <div className={estilos.cabeceraTarjeta}>
        <h4 id={`negocio-${n.id}`} className={estilos.nombreTarjeta}>
          {n.nombre}
        </h4>
        <span className={estilos.estado}>{ETIQUETA_NEGOCIO[n.estado]}</span>
      </div>

      <dl className={estilos.datos}>
        <div>
          <dt>Dueño</dt>
          <dd>{nombreVisible(n.dueno)}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd className={estilos.dato}>{formatoTelefono(n.telefono)}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>{n.ubicacion || '—'}</dd>
        </div>
        <div>
          <dt>Tipo de cobro</dt>
          <dd>{ETIQUETA_PROVEEDOR[n.tipoProveedorPago] ?? n.tipoProveedorPago}</dd>
        </div>
        <div>
          <dt>Lightning Address</dt>
          <dd className={estilos.dato}>{n.lightningAddress ?? 'Sin cargar'}</dd>
        </div>
        <div>
          <dt>Registrado</dt>
          <dd>{formatoFecha(n.creadoEn)}</dd>
        </div>
        <div className={estilos.ancho}>
          <dt>Descripción</dt>
          <dd className={estilos.textoLargo}>{n.descripcion || 'Sin descripción'}</dd>
        </div>
      </dl>

      <AccionesNegocio negocioId={n.id} nombre={n.nombre} estado={n.estado} />
    </article>
  );
}
