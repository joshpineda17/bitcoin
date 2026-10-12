import Link from 'next/link';
import { Suspense } from 'react';

import { Vacio } from '@/componentes/Vacio';
import { misAvisos } from '@/servidor/avisos';
import { misCompras } from '@/servidor/pedidos';
import { exigirSesion } from '@/servidor/sesion';

import { BotonMarcarLeidos } from './BotonMarcarLeidos';
import { fechaCorta } from './fechas';
import styles from './ordenes.module.css';
import { TarjetaOrden } from './TarjetaOrden';

export default function PaginaCompras() {
  return (
    <Suspense fallback={<p role="status">Cargando tus órdenes…</p>}>
      <Compras />
    </Suspense>
  );
}

// The buyer's orders. Orders that wait for the buyer come first; the rest follow, newest first.
async function Compras() {
  const sesion = await exigirSesion('/ordenes');
  const [ordenes, avisos] = await Promise.all([
    misCompras(sesion.usuario.id),
    misAvisos(sesion.usuario.id, 5),
  ]);

  const atencion = ordenes.filter((o) => o.necesitaAccion);
  const demas = ordenes.filter((o) => !o.necesitaAccion);

  return (
    <div className={styles.pagina}>
      <div className={styles.encabezado}>
        <h1>Mis compras</h1>
        <p>Seguí cada pedido, desde el pago hasta la entrega.</p>
      </div>

      {avisos.length > 0 && (
        <section aria-labelledby="avisos-titulo" className={styles.grupo}>
          <h2 id="avisos-titulo">Avisos</h2>
          <ul className={styles.avisos}>
            {avisos.map((aviso) => (
              <li key={aviso.id} className={styles.avisoItem}>
                {aviso.ordenId ? (
                  <Link href={`/ordenes/${aviso.ordenId}`}>{aviso.texto}</Link>
                ) : (
                  <span>{aviso.texto}</span>
                )}
                <span className="dato">{fechaCorta(aviso.creadoEn)}</span>
              </li>
            ))}
          </ul>
          <BotonMarcarLeidos />
        </section>
      )}

      {ordenes.length === 0 ? (
        <Vacio texto="Todavía no hiciste ninguna compra." accion={{ href: '/', etiqueta: 'Ver productos' }} />
      ) : (
        <>
          {atencion.length > 0 && (
            <section aria-labelledby="atencion-titulo" className={styles.grupo}>
              <h2 id="atencion-titulo">Necesitan tu atención</h2>
              <ul className={styles.lista}>
                {atencion.map((orden) => (
                  <TarjetaOrden key={orden.id} orden={orden} rol="comprador" />
                ))}
              </ul>
            </section>
          )}

          {demas.length > 0 && (
            <section aria-labelledby="demas-titulo" className={styles.grupo}>
              <h2 id="demas-titulo">{atencion.length > 0 ? 'Las demás órdenes' : 'Tus órdenes'}</h2>
              <ul className={styles.lista}>
                {demas.map((orden) => (
                  <TarjetaOrden key={orden.id} orden={orden} rol="comprador" />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
