import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { EstadoOrden } from '@/componentes/EstadoOrden';
import { EtiquetaPrecio } from '@/componentes/EtiquetaPrecio';
import { Estrellas } from '@/componentes/Estrellas';
import { formatoSats, formatoUsd, usdCentavosASats } from '@/lib/dinero';
import { accionesPosibles, DESCRIPCION_ESTADO } from '@/lib/estados';
import { mensajesDe } from '@/servidor/mensajes';
import { detalleDeOrden, paraAcciones } from '@/servidor/pedidos';
import { exigirSesion } from '@/servidor/sesion';

import { fechaCorta } from '../fechas';

import { AccionesOrden } from './AccionesOrden';
import { Chat } from './Chat';
import { Cronologia } from './Cronologia';
import styles from './orden.module.css';

// One page for both parties. The id comes from the URL, so the order is read per request.
// Anyone who is not a party gets notFound(), the same answer as for a missing order.
export default function PaginaOrden(props: PageProps<'/ordenes/[id]'>) {
  return (
    <Suspense fallback={<p role="status">Cargando la orden…</p>}>
      <Orden params={props.params} />
    </Suspense>
  );
}

const RESULTADO_TEXTO = {
  reembolso_total: 'Reembolso total',
  reembolso_parcial: 'Reembolso parcial',
  sin_reembolso: 'Sin reembolso',
} as const;

// Groups the delivery code in threes: "482 913".
function partirCodigo(codigo: string): string {
  return `${codigo.slice(0, 3)} ${codigo.slice(3)}`;
}

async function Orden({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await exigirSesion(`/ordenes/${id}`);
  const detalle = await detalleDeOrden(id, sesion);
  if (!detalle) notFound();

  const mensajes = (await mensajesDe(id, sesion)) ?? [];
  // The buttons are exactly what the state machine allows for this role.
  const acciones = accionesPosibles(paraAcciones(detalle), detalle.rol);
  const esComprador = detalle.rol === 'comprador';
  const cotizacionTexto = `1 BTC = ${formatoUsd(Math.round(detalle.cotizacionUsdBtc * 100))}`;
  const modoTexto = detalle.modoEntrega === 'recogida' ? 'Recogida en punto' : 'Entrega por el vendedor';

  return (
    <article className={styles.orden} aria-labelledby="orden-titulo">
      <header className={styles.cabecera}>
        <p>
          <Link href={esComprador ? '/ordenes' : '/mi-negocio/ordenes'}>
            ← Volver a {esComprador ? 'mis compras' : 'mis ventas'}
          </Link>
        </p>
        <h1 id="orden-titulo">Orden {detalle.numero}</h1>
        <p className={styles.parte}>
          {esComprador ? 'Tienda' : 'Comprador'}: {detalle.otraParte}
        </p>
        <p>
          <EstadoOrden estado={detalle.estado} />
        </p>
        <p>{DESCRIPCION_ESTADO[detalle.estado][detalle.rol]}</p>
      </header>

      {acciones.length > 0 && (
        <section aria-labelledby="que-sigue" className={styles.bloque}>
          <h2 id="que-sigue">Qué sigue</h2>
          <AccionesOrden ordenId={detalle.id} acciones={acciones} />
        </section>
      )}

      {detalle.codigoEntrega && (
        <section aria-labelledby="codigo-titulo" className={styles.codigo}>
          <h2 id="codigo-titulo">Código de entrega</h2>
          <p className={styles.codigoNumero}>{partirCodigo(detalle.codigoEntrega)}</p>
          <p>Mostráselo al vendedor cuando recibás tu pedido. No lo compartás antes.</p>
        </section>
      )}

      <Cronologia
        estado={detalle.estado}
        fechas={{
          pagada: detalle.pagadaEn,
          lista: detalle.listaEn,
          entregada: detalle.entregadaEn,
          cerrada: detalle.cerradaEn,
          expirada: detalle.expiradaEn,
          disputada: detalle.disputadaEn,
          resuelta: detalle.resueltaEn,
        }}
      />

      <section aria-labelledby="productos-titulo" className={styles.bloque}>
        <h2 id="productos-titulo">Productos y total</h2>
        <ul className={styles.lineas}>
          {detalle.lineas.map((linea) => {
            const subtotal = linea.precioUsdCentavos * linea.cantidad;
            const sats = usdCentavosASats(subtotal, detalle.cotizacionUsdBtc);
            return (
              <li key={linea.id} className={styles.linea}>
                <span className={styles.lineaNombre}>{linea.nombre}</span>
                <span className="dato">
                  {linea.cantidad} × {formatoUsd(linea.precioUsdCentavos)} por {linea.unidad}
                </span>
                <span className={styles.totales}>
                  {formatoSats(sats)} · {formatoUsd(subtotal)}
                </span>
              </li>
            );
          })}
        </ul>
        <dl className={styles.datos}>
          <div>
            <dt>Total</dt>
            <dd>
              <EtiquetaPrecio usdCentavos={detalle.totalUsdCentavos} sats={detalle.totalSats} />
            </dd>
          </div>
          <div>
            <dt>Cotización usada</dt>
            <dd className="dato">{cotizacionTexto}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{modoTexto}</dd>
          </div>
        </dl>
      </section>

      {detalle.disputa && (
        <section aria-labelledby="disputa-titulo" className={styles.bloque}>
          <h2 id="disputa-titulo">Disputa</h2>
          <dl className={styles.datos}>
            <div>
              <dt>Estado</dt>
              <dd>{detalle.disputa.estado === 'abierta' ? 'Abierta, en revisión' : 'Resuelta'}</dd>
            </div>
            <div>
              <dt>Motivo</dt>
              <dd>{detalle.disputa.motivo}</dd>
            </div>
            {detalle.disputa.evidencia && (
              <div>
                <dt>Evidencia</dt>
                <dd>{detalle.disputa.evidencia}</dd>
              </div>
            )}
            <div>
              <dt>Abierta el</dt>
              <dd className="dato">{fechaCorta(detalle.disputa.creadaEn)}</dd>
            </div>
            {detalle.disputa.resultado && (
              <div>
                <dt>Resultado</dt>
                <dd>{RESULTADO_TEXTO[detalle.disputa.resultado]}</dd>
              </div>
            )}
            {detalle.disputa.notaResolucion && (
              <div>
                <dt>Nota del administrador</dt>
                <dd>{detalle.disputa.notaResolucion}</dd>
              </div>
            )}
            {detalle.disputa.reembolsoMarcadoEn && (
              <div>
                <dt>Reembolso</dt>
                <dd>Marcado por el vendedor el {fechaCorta(detalle.disputa.reembolsoMarcadoEn)}</dd>
              </div>
            )}
            {detalle.disputa.reembolsoConfirmadoEn && (
              <div>
                <dt>Confirmación</dt>
                <dd>Confirmado por el comprador el {fechaCorta(detalle.disputa.reembolsoConfirmadoEn)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {detalle.resena && (
        <section aria-labelledby="resena-titulo" className={styles.bloque}>
          <h2 id="resena-titulo">{esComprador ? 'Tu reseña' : 'Reseña del comprador'}</h2>
          <div className="resena">
            <Estrellas valor={detalle.resena.puntuacion} />
            <p>{detalle.resena.comentario || 'Sin comentario.'}</p>
            <time className="dato" dateTime={detalle.resena.creadaEn}>
              {fechaCorta(detalle.resena.creadaEn)}
            </time>
          </div>
        </section>
      )}

      <section aria-labelledby="chat-titulo" className={styles.bloque}>
        <h2 id="chat-titulo">Chat</h2>
        <Chat
          ordenId={detalle.id}
          usuarioId={sesion.usuario.id}
          otraParte={detalle.otraParte}
          soloLectura={detalle.estado === 'expirada'}
          inicial={mensajes}
        />
      </section>
    </article>
  );
}
