import { contarNoLeidos } from '@/servidor/avisos';
import { sesionActual } from '@/servidor/sesion';

// Unread notice count, drawn as a small badge over the "Órdenes" label. It reads the session,
// so the caller wraps it in Suspense. Nothing is rendered at zero or when signed out.
// The badge is absolutely placed, so the tab bar keeps its layout either way.
export async function InsigniaAvisos() {
  const sesion = await sesionActual();
  if (!sesion) return null;
  const total = await contarNoLeidos(sesion.usuario.id);
  if (total === 0) return null;

  const etiqueta = `${total} ${total === 1 ? 'aviso' : 'avisos'} sin leer`;
  return (
    <span
      role="img"
      aria-label={etiqueta}
      style={{
        position: 'absolute',
        top: -10,
        right: -16,
        minWidth: 22,
        height: 22,
        padding: '0 6px',
        borderRadius: 999,
        border: '2px solid var(--tostado)',
        background: 'var(--mazorca)',
        color: 'var(--tostado)',
        fontFamily: 'var(--mono)',
        fontSize: '0.75rem',
        fontWeight: 700,
        lineHeight: '18px',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      {total > 99 ? '99+' : total}
    </span>
  );
}
