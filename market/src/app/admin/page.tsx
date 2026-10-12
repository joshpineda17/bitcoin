import type { Metadata } from 'next';
import Link from 'next/link';

import { formatoUsd } from '@/lib/dinero';
import { porcentajeTexto } from '@/app/admin/etiquetas';
import { resumenAdmin } from '@/servidor/admin';
import { exigirAdmin } from '@/servidor/sesion';

import { Monto } from './Monto';
import { TablaAdmin } from './TablaAdmin';
import estilos from './estilos.module.css';

export const metadata: Metadata = {
  title: 'Resumen',
};

export default async function ResumenAdmin() {
  const sesion = await exigirAdmin();
  const resumen = await resumenAdmin(sesion.usuario.id);
  const red = resumen.circularidad;
  const cotizacion = resumen.cotizacionUsdBtc;

  return (
    <>
      <section className={estilos.bloque} aria-labelledby="titulo-resumen">
        <h2 id="titulo-resumen" className={estilos.subtitulo}>
          Resumen
        </h2>
        <ul className={estilos.contadores}>
          <Contador href="/admin/negocios" cifra={resumen.negociosPorAprobar} texto="Negocios por aprobar" />
          <Contador href="/admin/disputas" cifra={resumen.disputasAbiertas} texto="Disputas abiertas" />
          <Contador href="/admin/ordenes" cifra={resumen.pedidosHoy} texto="Órdenes de hoy" />
          <Contador
            href="/admin/ordenes?estado=esperando_pago"
            cifra={resumen.esperandoPago}
            texto="Órdenes esperando pago"
          />
        </ul>
      </section>

      <section className={estilos.bloque} aria-labelledby="titulo-circularidad">
        <h3 id="titulo-circularidad" className={estilos.subtitulo}>
          Circularidad de la red
        </h3>
        <p className={estilos.descripcion}>
          Mide cuántos de los sats que cobran los negocios vuelven a gastarse en otros negocios de la red.
        </p>

        <dl className={estilos.metricas}>
          <div className={estilos.metrica}>
            <dt>Sats cobrados por los negocios</dt>
            <dd>
              <Monto sats={red.satsCobrados} cotizacionUsdBtc={cotizacion} />
            </dd>
          </div>
          <div className={estilos.metrica}>
            <dt>Sats que volvieron a gastarse en la red</dt>
            <dd>
              <Monto sats={red.satsRegastados} cotizacionUsdBtc={cotizacion} />
            </dd>
          </div>
          <div className={estilos.metrica}>
            <dt>Índice de circularidad</dt>
            <dd className={estilos.cifra}>{porcentajeTexto(red.indice)}</dd>
          </div>
        </dl>

        <p className={estilos.destacado}>
          {red.negocios === 0
            ? 'Todavía no hay negocios aprobados.'
            : `${red.negociosQueCompran} de ${red.negocios} ${
                red.negocios === 1 ? 'negocio también compra' : 'negocios también compran'
              } en la red`}
        </p>

        <TablaAdmin
          titulo="Circularidad por negocio, del índice más alto al más bajo"
          encabezados={['Negocio', 'Cobrados', 'Regastados', 'Índice']}
          filas={red.porNegocio.map((f) => ({
            clave: f.negocioId,
            celdas: [
              f.nombre,
              <Monto key="c" sats={f.satsCobrados} cotizacionUsdBtc={cotizacion} />,
              <Monto key="r" sats={f.satsRegastados} cotizacionUsdBtc={cotizacion} />,
              porcentajeTexto(f.indice),
            ],
          }))}
        />
        {red.porNegocio.length === 0 && <p className={estilos.vacio}>Todavía no hay negocios.</p>}
      </section>

      <section className={estilos.bloque} aria-labelledby="titulo-comision">
        <h3 id="titulo-comision" className={estilos.subtitulo}>
          Comisión teórica (no se cobra en esta fase)
        </h3>
        <p className={estilos.descripcion}>Suma de la comisión que se habría cobrado en las órdenes pagadas.</p>
        <Monto sats={resumen.comisionTeoricaSats} cotizacionUsdBtc={cotizacion} />
        {cotizacion !== null && (
          <p className={estilos.ayuda}>
            Cotización de referencia: {formatoUsd(Math.round(cotizacion * 100))} por bitcoin.
          </p>
        )}
      </section>
    </>
  );
}

function Contador({ href, cifra, texto }: { href: string; cifra: number; texto: string }) {
  return (
    <li>
      <Link href={href} className={estilos.contador}>
        <span className={estilos.contadorNumero}>{cifra}</span>
        <span className={estilos.contadorTexto}>{texto}</span>
      </Link>
    </li>
  );
}
