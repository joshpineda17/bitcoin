'use client';

import { usePathname } from 'next/navigation';

import { NavegacionPrincipal } from './NavegacionPrincipal';

// Marks the current section. Client only because it reads the pathname.
export function NavegacionActual({ variante }: { variante: 'barra' | 'cabecera' }) {
  const ruta = usePathname();
  return <NavegacionPrincipal actual={ruta} variante={variante} />;
}
