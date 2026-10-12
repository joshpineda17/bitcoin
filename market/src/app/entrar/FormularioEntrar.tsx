'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

import { entrar, type EstadoEntrar } from './acciones';
import estilos from './estilos.module.css';

const ESTADO_INICIAL: EstadoEntrar = { paso: 'telefono', telefono: '', codigo: '' };

export function FormularioEntrar({ volver }: { volver: string }) {
  const [estado, accion] = useActionState(entrar, ESTADO_INICIAL);
  const campoTelefono = useRef<HTMLInputElement>(null);
  const campoCodigo = useRef<HTMLInputElement>(null);

  // Move focus to the field that needs the visitor: the one with the error, or the new step.
  useEffect(() => {
    if (estado.error?.campo === 'codigo' || (!estado.error && estado.paso === 'codigo')) {
      campoCodigo.current?.focus();
    } else {
      campoTelefono.current?.focus();
    }
  }, [estado]);

  const errorTelefono = estado.error?.campo === 'telefono' ? estado.error.mensaje : null;
  const errorCodigo = estado.error?.campo === 'codigo' ? estado.error.mensaje : null;

  return (
    <div className={estilos.bloque}>
      {estado.paso === 'telefono' ? (
        <form action={accion} className={estilos.formulario}>
          <input type="hidden" name="volver" value={volver} />
          <input type="hidden" name="intencion" value="enviar" />

          <div className={estilos.grupo}>
            <label htmlFor="telefono" className="campo-etiqueta">
              Número de celular
            </label>
            <div className={estilos.telefono}>
              <span className={estilos.prefijo}>+503</span>
              <input
                ref={campoTelefono}
                id="telefono"
                name="telefono"
                className="campo"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                defaultValue={estado.telefono}
                aria-describedby={errorTelefono ? 'error-telefono' : 'ayuda-telefono'}
                aria-invalid={errorTelefono ? true : undefined}
              />
            </div>
            <p id="ayuda-telefono" className={estilos.ayuda}>
              Son 8 números. Podés escribirlos con espacios o guiones.
            </p>
          </div>

          {errorTelefono && (
            <div id="error-telefono" role="alert" className={estilos.error}>
              {errorTelefono}
            </div>
          )}

          <p className={estilos.demo}>
            Modo demo: para probar usá un número de 7000 0001 a 7000 0009. No se manda SMS.
          </p>

          <BotonEnvio intencion="enviar" etiqueta="Enviar código" etiquetaEnvio="Enviando…" />
        </form>
      ) : (
        <form action={accion} className={estilos.formulario}>
          <input type="hidden" name="volver" value={volver} />
          <input type="hidden" name="telefono" value={estado.telefono} />

          <div className={estilos.grupo}>
            <label htmlFor="codigo" className="campo-etiqueta">
              Código de seis números
            </label>
            <input
              ref={campoCodigo}
              id="codigo"
              name="codigo"
              className="campo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              defaultValue={estado.codigo}
              aria-describedby={errorCodigo ? 'error-codigo' : 'ayuda-codigo'}
              aria-invalid={errorCodigo ? true : undefined}
            />
            <p id="ayuda-codigo" className={estilos.ayuda}>
              Enviado al +503 {mascara(estado.telefono)}.
            </p>
          </div>

          {errorCodigo && (
            <div id="error-codigo" role="alert" className={estilos.error}>
              {errorCodigo}
            </div>
          )}

          <p className={estilos.demo}>Modo demo: usá el código 123456. No se manda SMS.</p>

          <div className={estilos.acciones}>
            <BotonEnvio intencion="verificar" etiqueta="Entrar" etiquetaEnvio="Verificando…" />
            <BotonEnvio
              intencion="reenviar"
              etiqueta="Reenviar código"
              etiquetaEnvio="Reenviando…"
              secundario
              sinValidar
            />
            <BotonEnvio
              intencion="cambiar"
              etiqueta="Cambiar número"
              etiquetaEnvio="Cambiando…"
              secundario
              sinValidar
            />
          </div>
        </form>
      )}

      <p role="status" aria-live="polite" className="aviso">{estado.aviso ?? ''}</p>
    </div>
  );
}

// Each button sends its own intent. While the form is pending, the button that was pressed
// shows its "…" label and the others stay disabled.
function BotonEnvio({
  intencion,
  etiqueta,
  etiquetaEnvio,
  secundario = false,
  sinValidar = false,
}: {
  intencion: 'enviar' | 'verificar' | 'reenviar' | 'cambiar';
  etiqueta: string;
  etiquetaEnvio: string;
  secundario?: boolean;
  sinValidar?: boolean;
}) {
  const { pending, data } = useFormStatus();
  const esEste = pending && data?.get('intencion') === intencion;
  const clase = secundario ? 'boton boton--secundario' : 'boton';

  return (
    <button
      type="submit"
      name="intencion"
      value={intencion}
      formNoValidate={sinValidar}
      className={clase}
      disabled={pending}
    >
      {esEste ? etiquetaEnvio : etiqueta}
    </button>
  );
}

// Shows the last two digits only, as "•••• ••07", so the number is not read out in full.
function mascara(telefono: string): string {
  const digitos = telefono.replace(/[\s-]/g, '');
  return `•••• ••${digitos.slice(-2)}`;
}
