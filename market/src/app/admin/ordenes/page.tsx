import type { Metadata } from 'next';
import Link from 'next/link';

import { Chip } from '@/componentes/Chip';
import { ESTADOS_ORDEN, formatoFecha, montoExacto, nombreVisible } from '@/app/admin/etiquetas';
import { ETIQUETA_ESTADO } from '@/lib/estados';
import { estadoDesde, ordenesAdmin, paginaDesde, POR_PAGINA } from '@/servidor/admin';
import { exigirAdmin } from '@/servidor/sesion';

import estilos from '../estilos.module.css';
import { TablaAdmin } from '../TablaAdmin';

export const metadata: Metadata = {
  title: 'Órdenes',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valor(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// The link for one filter and page. Keeps the state filter when paging.
function enlace(estado: string | null, pagina: number): string {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (pagina > 1) params.set('pagina', String(pagina));
  const texto = params.toString();
  return texto ? `/admin/ordenes?${texto}` : '/admin/ordenes';
}

export default async function PaginaOrdenes(props: Props) {
  const sesion = await exigirAdmin();
  const params = await props.searchParams;
  // Unknown states are ignored (show all). The page number defaults to 1.
  const estado = estadoDesde(valor(params.estado));
  const pagina = paginaDesde(valor(params.pagina));

  const datos = await ordenesAdmin(sesion.usuario.id, { pagina, estado });
  const paginas = Math.max(1, Math.ceil(datos.total / POR_PAGINA));
  const desde = datos.total === 0 ? 0 : (datos.pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(datos.pagina * POR_PAGINA, datos.total);

  return (
    <>
      <section className={estilos.bloque} aria-labelledby="titulo-ordenes">
        <h2 id="titulo-ordenes" className={estilos.subtitulo}>
          Órdenes
        </h2>
        <p className={estilos.descripcion}>Todas las órdenes, de la más nueva a la más vieja.</p>

        <nav aria-label="Filtrar por estado">
          <ul className="chips">
            <li>
              <Chip href={enlace(null, 1)} activo={estado === null}>
                Todas
              </Chip>
            </li>
            {ESTADOS_ORDEN.map((e) => (
              <li key={e}>
                <Chip href={enlace(e, 1)} activo={estado === e}>
                  {ETIQUETA_ESTADO[e]}
                </Chip>
              </li>
            ))}
          </ul>
        </nav>

        <p className={estilos.ayuda} aria-live="polite">
          {datos.total === 0
            ? 'No hay órdenes con este filtro.'
            : `Mostrando ${desde} a ${hasta} de ${datos.total}.`}
        </p>
      </section>

      {datos.filas.length > 0 && (
        <TablaAdmin
          titulo="Órdenes"
          encabezados={['Orden', 'Fecha', 'Negocio', 'Comprador', 'Estado', 'Total']}
          filas={datos.filas.map((f) => ({
            clave: f.id,
            celdas: [
              <Link key="n" href={`/admin/ordenes/${f.id}`}>
                Orden {f.numero}
              </Link>,
              formatoFecha(f.creadaEn),
              f.negocio || '—',
              nombreVisible(f.comprador),
              <span key="e" className={estilos.estado}>
                {ETIQUETA_ESTADO[f.estado]}
              </span>,
              <span key="t" className={estilos.dato}>
                {montoExacto(f.totalSats, f.totalUsdCentavos)}
              </span>,
            ],
          }))}
        />
      )}

      <nav aria-label="Páginas de órdenes" className={estilos.paginacion}>
        <p className={estilos.ayuda}>
          Página {datos.pagina} de {paginas}
        </p>
        <div className={estilos.paginacionFila}>
          {datos.pagina > 1 ? (
            <Link href={enlace(estado, datos.pagina - 1)} className={estilos.paginacionBoton}>
              Anteriores
            </Link>
          ) : (
            <span className={estilos.paginacionBoton} aria-disabled="true">
              Anteriores
            </span>
          )}
          {datos.pagina < paginas ? (
            <Link href={enlace(estado, datos.pagina + 1)} className={estilos.paginacionBoton}>
              Siguientes
            </Link>
          ) : (
            <span className={estilos.paginacionBoton} aria-disabled="true">
              Siguientes
            </span>
          )}
        </div>
      </nav>
    </>
  );
}
