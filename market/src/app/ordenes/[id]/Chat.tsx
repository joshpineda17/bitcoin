'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { clienteNavegador } from '@/lib/supabase-navegador';

import { fechaCorta } from '../fechas';
import type { Mensaje } from '../tipos';

import { enviarMensajeAccion } from './acciones';
import styles from './orden.module.css';

type Props = {
  ordenId: string;
  usuarioId: string;
  otraParte: string;
  soloLectura: boolean;
  inicial: Mensaje[];
};

type FilaMensaje = { id: string; autor_id: string; texto: string; creado_en: string };

function desdeFila(fila: FilaMensaje): Mensaje {
  return { id: fila.id, autorId: fila.autor_id, texto: fila.texto, creadoEn: fila.creado_en };
}

// Joins message lists, drops repeats by id and keeps the order oldest first.
function combinar(...listas: Mensaje[][]): Mensaje[] {
  const porId = new Map<string, Mensaje>();
  for (const lista of listas) {
    for (const mensaje of lista) porId.set(mensaje.id, mensaje);
  }
  return [...porId.values()].sort(
    (a, b) => Date.parse(a.creadoEn) - Date.parse(b.creadoEn) || a.id.localeCompare(b.id),
  );
}

const INTERVALO_SONDEO_MS = 10_000;

// Chat for one order. New messages arrive by Realtime; a 10 second read is the fallback.
export function Chat({ ordenId, usuarioId, otraParte, soloLectura, inicial }: Props) {
  const router = useRouter();
  const [recibidos, setRecibidos] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, empezarEnvio] = useTransition();
  const registro = useRef<HTMLDivElement>(null);

  const mensajes = useMemo(() => combinar(inicial, recibidos), [inicial, recibidos]);

  // Live: a new message is added as it arrives; an order change refreshes the page state.
  useEffect(() => {
    const cliente = clienteNavegador();
    const canal = cliente
      .channel(`orden-${ordenId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `orden_id=eq.${ordenId}` },
        (cambio) => {
          const fila = cambio.new as unknown as FilaMensaje;
          setRecibidos((previos) => combinar(previos, [desdeFila(fila)]));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ordenes', filter: `id=eq.${ordenId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void cliente.removeChannel(canal);
    };
  }, [ordenId, router]);

  // Fallback: read the latest messages every 10 seconds, in case a live event was missed.
  useEffect(() => {
    let activo = true;
    const sondeo = setInterval(async () => {
      const { data, error } = await clienteNavegador()
        .from('mensajes')
        .select('id, autor_id, texto, creado_en')
        .eq('orden_id', ordenId)
        .order('creado_en', { ascending: false })
        .limit(200);
      if (!activo || error || !data) return;
      const lista = data.map((fila) => desdeFila(fila)).reverse();
      setRecibidos((previos) => {
        const conocidos = new Set(previos.map((m) => m.id));
        const nuevos = lista.filter((m) => !conocidos.has(m.id));
        return nuevos.length > 0 ? combinar(previos, nuevos) : previos;
      });
    }, INTERVALO_SONDEO_MS);
    return () => {
      activo = false;
      clearInterval(sondeo);
    };
  }, [ordenId]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = registro.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length]);

  function enviar() {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setErrorEnvio(null);
    empezarEnvio(async () => {
      const resultado = await enviarMensajeAccion(ordenId, limpio);
      if (!resultado.ok) {
        setErrorEnvio(resultado.mensaje);
        return;
      }
      // Clear only what was sent; text typed while sending stays.
      setTexto((actual) => (actual.trim() === limpio ? '' : actual));
      setRecibidos((previos) => combinar(previos, [resultado.dato]));
    });
  }

  // Enter sends, Shift+Enter adds a line. Enter during IME composition is left alone.
  function alTeclear(evento: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault();
      enviar();
    }
  }

  return (
    <div className={styles.chat}>
      <div
        ref={registro}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`Mensajes con ${otraParte}`}
        tabIndex={0}
        className={styles.registro}
      >
        {mensajes.length === 0 && <p className={styles.ayuda}>Todavía no hay mensajes.</p>}
        {mensajes.map((mensaje) => {
          const propio = mensaje.autorId === usuarioId;
          return (
            <article key={mensaje.id} className={propio ? `${styles.mensaje} ${styles.mio}` : styles.mensaje}>
              <p className={styles.autor}>{propio ? 'Vos' : otraParte}</p>
              <p className={styles.texto}>{mensaje.texto}</p>
              <time className={`dato ${styles.hora}`} dateTime={mensaje.creadoEn}>
                {fechaCorta(mensaje.creadoEn)}
              </time>
            </article>
          );
        })}
      </div>

      {soloLectura ? (
        <p className={styles.ayuda}>La orden expiró. El chat quedó en solo lectura.</p>
      ) : (
        <form
          className={styles.formulario}
          onSubmit={(evento) => {
            evento.preventDefault();
            enviar();
          }}
        >
          <label htmlFor="mensaje-texto" className="campo-etiqueta">
            Escribí un mensaje
          </label>
          <textarea
            id="mensaje-texto"
            className={styles.campoTexto}
            rows={3}
            maxLength={1000}
            value={texto}
            aria-describedby="mensaje-ayuda"
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={alTeclear}
          />
          <div id="mensaje-ayuda" className={styles.fila}>
            <span className="dato">{texto.length}/1000</span>
            <span className={styles.ayuda}>Enter envía. Shift más Enter hace un salto de línea.</span>
          </div>
          {errorEnvio && (
            <p role="alert" className={styles.error}>
              {errorEnvio}
            </p>
          )}
          <div>
            <button type="submit" className="boton" disabled={enviando || texto.trim().length === 0}>
              {enviando ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
