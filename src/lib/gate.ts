// Cacao Gate, browser side. The reader's device only keeps the token the server signed; the locked
// text itself is fetched with that token and never stored.
export type EstadoGate = 'bloqueado' | 'desbloqueado' | 'expirado';

export const CLAVE = 'cacao-gate:';

interface Guardado {
  token: string;
  expira: number;
}

function leer(slug: string): Guardado | null {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE + slug) ?? 'null') as Guardado | null;
    return g && typeof g.token === 'string' && typeof g.expira === 'number' ? g : null;
  } catch {
    return null;
  }
}

function guardar(slug: string, g: Guardado): void {
  try {
    localStorage.setItem(CLAVE + slug, JSON.stringify(g));
  } catch {
    // Storage blocked: the story stays open for this page view only.
  }
}

/** What the device believes. The server has the last word when the text is requested. */
export function estadoGate(slug: string, ahora: number = Date.now()): EstadoGate {
  const g = leer(slug);
  if (!g) return 'bloqueado';
  return g.expira > ahora ? 'desbloqueado' : 'expirado';
}

/** The stored token for a story, if it has not expired. Cacao Travel links carry it for the reader discount. */
export function tokenDe(slug: string, ahora: number = Date.now()): string | null {
  const g = leer(slug);
  return g && g.expira > ahora ? g.token : null;
}

/** Asks the server for an unlock token. Throws if the server refuses. */
export async function desbloquear(slug: string): Promise<void> {
  const r = await fetch('/api/desbloquear/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  if (!r.ok) throw new Error('No se pudo desbloquear.');
  const { token, expira } = (await r.json()) as Guardado;
  guardar(slug, { token, expira });
}

/** Stores a pass that arrived from a Cacao Travel booking. Its expiry is read from the payload. */
export function aceptarPase(slug: string, token: string): boolean {
  try {
    const datos = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const pase = JSON.parse(decodeURIComponent(escape(atob(datos)))) as { slugs?: string[]; exp?: number };
    if (!pase.slugs?.includes(slug) || typeof pase.exp !== 'number') return false;
    guardar(slug, { token, expira: pase.exp });
    return true;
  } catch {
    return false;
  }
}

/** The locked HTML, or null when the server says the token is no longer good. */
export async function traerCerrado(slug: string): Promise<string | null> {
  const g = leer(slug);
  if (!g) return null;
  const r = await fetch(`/api/contenido/${slug}/`, { headers: { Authorization: `Bearer ${g.token}` } });
  if (r.status === 401) {
    // Signature or expiry rejected: forget it so the wall comes back.
    try {
      localStorage.removeItem(CLAVE + slug);
    } catch {}
    return null;
  }
  if (!r.ok) throw new Error('No se pudo cargar la historia.');
  return ((await r.json()) as { html: string }).html;
}
