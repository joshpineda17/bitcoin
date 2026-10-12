import { EstadoOrden } from '@/componentes/EstadoOrden';
import { ETIQUETA_ESTADO, type EstadoOrden as Estado, PASOS } from '@/lib/estados';

import { fechaCorta } from '../fechas';

import styles from './orden.module.css';

type Situacion = 'hecho' | 'actual' | 'pendiente';

const TEXTO_SITUACION: Record<Situacion, string> = {
  hecho: 'Hecho',
  actual: 'Ahora',
  pendiente: 'Pendiente',
};

// States that leave the happy path. They are shown after the timeline, not inside it.
const FUERA_DEL_CAMINO: Estado[] = ['expirada', 'disputada', 'resuelta'];

/**
 * The happy path as an ordered list, with text for each step (not only colour).
 * `fechas` holds the timestamp of each state the order has reached.
 */
export function Cronologia({
  estado,
  fechas,
}: {
  estado: Estado;
  fechas: Partial<Record<Estado, string | null>>;
}) {
  const lateral = FUERA_DEL_CAMINO.includes(estado) ? estado : null;
  const indiceActual = estado === 'creada' ? 0 : PASOS.indexOf(estado);

  function situacionDe(paso: Estado, indice: number): Situacion {
    if (lateral) {
      // Disputed and resolved orders were paid, so the payment step is done. Expired ones never were.
      if (lateral === 'expirada') return fechas[paso] ? 'hecho' : 'pendiente';
      if (paso === 'esperando_pago') return 'hecho';
      return fechas[paso] ? 'hecho' : 'pendiente';
    }
    if (estado === 'cerrada') return 'hecho';
    if (indice < indiceActual) return 'hecho';
    if (indice === indiceActual) return 'actual';
    return 'pendiente';
  }

  return (
    <section aria-labelledby="cronologia-titulo" className={styles.bloque}>
      <h2 id="cronologia-titulo">Cómo va</h2>
      <ol className={styles.cronologia}>
        {PASOS.map((paso, indice) => {
          const situacion = situacionDe(paso, indice);
          const fecha = fechas[paso] ?? null;
          return (
            <li
              key={paso}
              className={`${styles.paso} ${styles[situacion]}`}
              aria-current={situacion === 'actual' ? 'step' : undefined}
            >
              <span className={styles.pasoSituacion}>{TEXTO_SITUACION[situacion]}</span>
              <span className={styles.pasoEtiqueta}>{ETIQUETA_ESTADO[paso]}</span>
              {fecha && (
                <time className={`dato ${styles.pasoFecha}`} dateTime={fecha}>
                  {fechaCorta(fecha)}
                </time>
              )}
            </li>
          );
        })}
        {lateral && (
          <li className={`${styles.paso} ${styles.lateral}`}>
            <span className={styles.pasoSituacion}>Fuera del camino normal</span>
            <EstadoOrden estado={lateral} />
            {fechas[lateral] && (
              <time className={`dato ${styles.pasoFecha}`} dateTime={fechas[lateral] ?? undefined}>
                {fechaCorta(fechas[lateral] ?? '')}
              </time>
            )}
          </li>
        )}
      </ol>
    </section>
  );
}
