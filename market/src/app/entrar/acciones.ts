'use server';

import { redirect } from 'next/navigation';

import { destinoSeguro, normalizarCelular, rutaCuenta } from '@/servidor/cuentas';
import { clienteSesion } from '@/servidor/supabase';

// One form drives both steps. The state carries the step and the typed values, so a wrong
// code keeps what the visitor typed.
export type EstadoEntrar = {
  paso: 'telefono' | 'codigo';
  telefono: string;
  codigo: string;
  aviso?: string;
  error?: { campo: 'telefono' | 'codigo'; mensaje: string };
};

// Turns a sign-in error into a sentence. Never says whether the phone is registered.
function mensajeDeEnvio(codigo: string | undefined): string {
  switch (codigo) {
    case 'over_sms_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Pediste demasiados códigos. Esperá unos minutos antes de intentar otra vez.';
    case 'phone_provider_disabled':
    case 'sms_send_failed':
    case 'unexpected_failure':
      return 'No pudimos mandar el código por SMS. Probá más tarde.';
    case 'validation_failed':
      return 'Ese número no es válido. Revisalo y probá de nuevo.';
    default:
      return 'No pudimos mandar el código. Probá de nuevo en un momento.';
  }
}

function mensajeDeVerificacion(codigo: string | undefined): string {
  switch (codigo) {
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.';
    // GoTrue answers a wrong code and an expired one with the same code, so one sentence covers both.
    case 'otp_expired':
    default:
      return 'El código no es correcto o ya venció. Revisalo, o reenviá uno nuevo.';
  }
}

export async function entrar(previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const intencion = String(datos.get('intencion') ?? 'enviar');
  const volver = destinoSeguro(datos.get('volver') as string | null);
  const telefonoTecleado = String(datos.get('telefono') ?? previo.telefono);
  const codigoTecleado = String(datos.get('codigo') ?? '');

  if (intencion === 'cambiar') {
    return { paso: 'telefono', telefono: previo.telefono, codigo: '' };
  }

  if (intencion === 'enviar' || intencion === 'reenviar' || previo.paso === 'telefono') {
    const celular = normalizarCelular(telefonoTecleado);
    if (!celular) {
      return {
        paso: 'telefono',
        telefono: telefonoTecleado,
        codigo: '',
        error: { campo: 'telefono', mensaje: 'Escribí los 8 números de tu celular, por ejemplo 7000 0001.' },
      };
    }

    const supabase = await clienteSesion();
    const { error } = await supabase.auth.signInWithOtp({ phone: `+503${celular}` });
    if (error) {
      console.error('signInWithOtp:', error.code, error.message);
      return {
        paso: 'telefono',
        telefono: telefonoTecleado,
        codigo: '',
        error: { campo: 'telefono', mensaje: mensajeDeEnvio(error.code) },
      };
    }

    return {
      paso: 'codigo',
      telefono: telefonoTecleado,
      codigo: '',
      aviso: intencion === 'reenviar' ? 'Te reenviamos el código.' : 'Listo. Ingresá el código de seis números.',
    };
  }

  // Second step: check the code.
  const codigo = codigoTecleado.replace(/[\s-]/g, '');
  const celular = normalizarCelular(previo.telefono);
  if (!celular) {
    return { paso: 'telefono', telefono: previo.telefono, codigo: '' };
  }
  if (!/^\d{6}$/.test(codigo)) {
    return {
      paso: 'codigo',
      telefono: previo.telefono,
      codigo: codigoTecleado,
      error: { campo: 'codigo', mensaje: 'El código tiene seis números.' },
    };
  }

  const supabase = await clienteSesion();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+503${celular}`,
    token: codigo,
    type: 'sms',
  });
  if (error || !data.user) {
    if (error) console.error('verifyOtp:', error.code, error.message);
    return {
      paso: 'codigo',
      telefono: previo.telefono,
      codigo: codigoTecleado,
      error: { campo: 'codigo', mensaje: mensajeDeVerificacion(error?.code) },
    };
  }

  // A new account has no name yet: set it first, then come back to the visitor's page.
  // The client already holds the new session, so this read runs as the signed-in user.
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!perfil?.nombre?.trim()) {
    redirect(rutaCuenta(volver));
  }
  redirect(volver);
}
