'use client';

import { useActionState, useId } from 'react';

import { resolverDisputaAccion } from '../acciones';
import { BotonEnvio } from '../BotonEnvio';
import estilos from '../estilos.module.css';
import { ETIQUETA_RESULTADO, RESULTADOS_DISPUTA } from '../etiquetas';

// Resolves an open dispute. The server checks the admin role and the note again.
export function FormularioResolver({ ordenId }: { ordenId: string }) {
  const [resultado, accion] = useActionState(resolverDisputaAccion, null);
  const id = useId();

  return (
    <form action={accion} className={estilos.formulario}>
      <input type="hidden" name="orden" value={ordenId} />

      <fieldset className={estilos.opciones}>
        <legend>Resultado</legend>
        {RESULTADOS_DISPUTA.map((r) => (
          <label key={r} className={estilos.opcion}>
            <input type="radio" name="resultado" value={r} required />
            {ETIQUETA_RESULTADO[r]}
          </label>
        ))}
      </fieldset>

      <div className={estilos.campo}>
        <label htmlFor={`${id}-nota`} className="campo-etiqueta">
          Nota de resolución
        </label>
        <textarea
          id={`${id}-nota`}
          name="nota"
          required
          minLength={10}
          maxLength={1000}
          className={estilos.areaTexto}
          aria-describedby={`${id}-ayuda`}
        />
        <p id={`${id}-ayuda`} className={estilos.ayuda}>
          Entre 10 y 1000 caracteres. El comprador y el vendedor la ven.
        </p>
      </div>

      <p className={estilos.explicacion}>
        CacaoMarket no mueve dinero. Si la resolución pide reembolso, el vendedor lo paga desde su billetera y el
        comprador lo confirma.
      </p>

      {resultado &&
        (resultado.ok ? (
          <p role="status" className={estilos.mensajeOk}>
            {resultado.dato}
          </p>
        ) : (
          <p role="alert" className={estilos.mensajeError}>
            {resultado.mensaje}
          </p>
        ))}

      <div className={estilos.acciones}>
        <BotonEnvio pendiente="Resolviendo…">Resolver disputa</BotonEnvio>
      </div>
    </form>
  );
}
