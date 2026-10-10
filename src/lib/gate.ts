export type EstadoGate = 'bloqueado' | 'desbloqueado' | 'expirado';

export const CLAVE = 'cacao-gate:';
export const DIAS = 7;

/** Reads the mock Gate state for a story. Any storage failure counts as locked. */
export function estadoGate(slug: string, ahora: number = Date.now()): EstadoGate {
  try {
    const crudo = localStorage.getItem(CLAVE + slug);
    if (crudo === null) return 'bloqueado';
    const registro = JSON.parse(crudo) as { expira?: unknown } | null;
    if (typeof registro?.expira !== 'number') return 'bloqueado';
    return registro.expira > ahora ? 'desbloqueado' : 'expirado';
  } catch {
    return 'bloqueado';
  }
}

/** Unlocks a story on this device for DIAS days. Does nothing if storage fails. */
export function desbloquear(slug: string, ahora: number = Date.now()): void {
  try {
    const expira = ahora + DIAS * 24 * 60 * 60 * 1000;
    localStorage.setItem(CLAVE + slug, JSON.stringify({ expira }));
  } catch {
    // Storage blocked: the wall stays visible.
  }
}
