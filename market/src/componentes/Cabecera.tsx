import Link from 'next/link';
import { Suspense } from 'react';

import { ContadorCarrito } from './ContadorCarrito';
import { Logo } from './Logo';
import { NavegacionActual } from './NavegacionActual';
import { NavegacionPrincipal } from './NavegacionPrincipal';

export function Cabecera() {
  return (
    <header className="cabecera">
      <div className="contenedor cabecera__fila">
        <Link href="/" className="logo-enlace" aria-label="CacaoMarket, inicio">
          <Logo />
        </Link>
        <Suspense fallback={<NavegacionPrincipal variante="cabecera" />}>
          <NavegacionActual variante="cabecera" />
        </Suspense>
        <ContadorCarrito />
      </div>
    </header>
  );
}
