'use client';

import { useActionState, useState } from 'react';

import { cambiarEstadoNegocioAccion } from '../acciones';
import { BotonEnvio } from '../BotonEnvio';
import estilos from '../estilos.module.css';
import type { EstadoNegocio } from '../etiquetas';

// Approve (pending or suspended) and suspend (approved, after a confirm step).
export function AccionesNegocio({
  negocioId,
  nombre,
  estado,
}: {
  negocioId: string;
  nombre: string;
  estado: EstadoNegocio;
}) {
  const [resultado, accion] = useActionState(cambiarEstadoNegocioAccion, null);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className={estilos.formulario}>
      {estado !== 'aprobado' && (
        <form action={accion}>
          <input type="hidden" name="negocio" value={negocioId} />
          <input type="hidden" name="estado" value="aprobado" />
          <BotonEnvio pendiente="Aprobando…">Aprobar</BotonEnvio>
        </form>
      )}

      {estado === 'aprobado' && !confirmando && (
        <div className={estilos.acciones}>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => setConfirmando(true)}
          >
            Suspender
          </button>
        </div>
      )}

      {estado === 'aprobado' && confirmando && (
        <form action={accion} className={estilos.confirmacion}>
          <input type="hidden" name="negocio" value={negocioId} />
          <input type="hidden" name="estado" value="suspendido" />
          <p>
            Confirmá la suspensión de {nombre}. Sus productos dejan de mostrarse y no recibe pedidos
            nuevos.
          </p>
          <div className={estilos.acciones}>
            <BotonEnvio pendiente="Suspendiendo…">Confirmar suspensión</BotonEnvio>
            <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

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
    </div>
  );
}
