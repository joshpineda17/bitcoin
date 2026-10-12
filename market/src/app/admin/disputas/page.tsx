import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ETIQUETA_RESULTADO,
  formatoFecha,
  montoExacto,
  nombreVisible,
} from '@/app/admin/etiquetas';
import { type DisputaAdmin, disputasAdmin } from '@/servidor/admin';
import { exigirAdmin } from '@/servidor/sesion';

import estilos from '../estilos.module.css';
import { FormularioResolver } from './FormularioResolver';

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
        <div className={estilos.grupo}>
          {disputas.map((d) => (
            <TarjetaDisputa key={d.id} disputa={d} />
          ))}
        </div>
      )}
    </>
  );
}

function TarjetaDisputa({ disputa: d }: { disputa: DisputaAdmin }) {
  const abierta = d.estado === 'abierta';

  return (
    <article className={estilos.tarjetaGrande} aria-labelledby={`disputa-${d.id}`}>
      <div className={estilos.cabeceraTarjeta}>
        <h3 id={`disputa-${d.id}`} className={estilos.nombreTarjeta}>
          <Link href={`/admin/ordenes/${d.ordenId}`}>Orden {d.numero}</Link>
        </h3>
        <span className={abierta ? `${estilos.estado} ${estilos.estadoAtencion}` : `${estilos.estado} ${estilos.estadoCerrado}`}>
          {abierta ? 'Abierta' : 'Resuelta'}
        </span>
      </div>

      <dl className={estilos.datos}>
        <div>
          <dt>Comprador</dt>
          <dd>{nombreVisible(d.comprador)}</dd>
        </div>
        <div>
          <dt>Negocio</dt>
          <dd>{d.negocio || '—'}</dd>
        </div>
        <div>
          <dt>Total de la orden</dt>
          <dd className={estilos.dato}>{montoExacto(d.totalSats, d.totalUsdCentavos)}</dd>
        </div>
        <div>
          <dt>Abierta</dt>
          <dd>{formatoFecha(d.creadaEn)}</dd>
        </div>
        <div className={estilos.ancho}>
          <dt>Motivo</dt>
          <dd className={estilos.textoLargo}>{d.motivo}</dd>
        </div>
        <div className={estilos.ancho}>
          <dt>Evidencia</dt>
          <dd className={estilos.textoLargo}>{d.evidencia || 'Sin evidencia'}</dd>
        </div>
      </dl>

      {abierta ? (
        <FormularioResolver ordenId={d.ordenId} />
      ) : (
        <dl className={estilos.datos}>
          <div>
            <dt>Resultado</dt>
            <dd>{d.resultado ? ETIQUETA_RESULTADO[d.resultado] : '—'}</dd>
          </div>
          <div>
            <dt>Resuelta</dt>
            <dd>{formatoFecha(d.resueltaEn)}</dd>
          </div>
          <div className={estilos.ancho}>
            <dt>Nota de resolución</dt>
            <dd className={estilos.textoLargo}>{d.notaResolucion || '—'}</dd>
          </div>
          {d.resultado !== 'sin_reembolso' && (
            <>
              <div className={estilos.ancho}>
                <dt>Reembolso marcado por el vendedor</dt>
                <dd>{d.reembolsoMarcadoEn ? formatoFecha(d.reembolsoMarcadoEn) : 'Todavía no lo marcó'}</dd>
              </div>
              <div className={estilos.ancho}>
                <dt>Reembolso confirmado por el comprador</dt>
                <dd>{d.reembolsoConfirmadoEn ? formatoFecha(d.reembolsoConfirmadoEn) : 'Todavía no lo confirmó'}</dd>
              </div>
            </>
          )}
        </dl>
      )}
    </article>
  );
}
