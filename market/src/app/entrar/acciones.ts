'use server';

import { redirect } from 'next/navigation';

import { destinoSeguro, normalizarCelular, normalizarCorreo, rutaCuenta } from '@/servidor/cuentas';
import { exito, fallo, type Resultado } from '@/servidor/resultado';
import { clienteSesion } from '@/servidor/supabase';

import { demoActivo, metodosHabilitados, type Metodo } from './configuracion';
import { CODIGO_DEMO, PERSONAS_DEMO, type PersonaDemo } from './demo';

// One form drives both steps. The state carries the step and the typed values, so a wrong
// code keeps what the visitor typed.
export type EstadoEntrar = {
  metodo: Metodo;
  paso: 'contacto' | 'codigo';
  contacto: string;
  codigo: string;
  aviso?: string;
  error?: { campo: 'contacto' | 'codigo'; mensaje: string };
};

type ClienteSesion = Awaited<ReturnType<typeof clienteSesion>>;

// A normalized sign-in address: eight digits for a phone, a checked address for email.
type Destino = { metodo: 'telefono'; celular: string } | { metodo: 'correo'; correo: string };

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

function mensajeDeEnvioCorreo(codigo: string | undefined): string {
  switch (codigo) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Pediste demasiados códigos. Esperá unos minutos antes de intentar otra vez.';
    case 'email_address_invalid':
      return 'Ese correo no es válido. Revisalo y probá de nuevo.';
    default:
      return 'No pudimos mandar el código al correo. Probá más tarde.';
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

// The address the visitor typed, normalized for its method, or null when it is not valid.
function destinoDe(metodo: Metodo, texto: string): Destino | null {
  if (metodo === 'telefono') {
    const celular = normalizarCelular(texto);
    return celular ? { metodo: 'telefono', celular } : null;
  }
  const correo = normalizarCorreo(texto);
  return correo ? { metodo: 'correo', correo } : null;
}

// Asks GoTrue to send a code. Returns the sentence to show, or null when it went out.
// A new address gets an account at once; an existing one just gets a new code.
async function pedirCodigo(supabase: ClienteSesion, destino: Destino): Promise<string | null> {
  if (destino.metodo === 'telefono') {
    const { error } = await supabase.auth.signInWithOtp({ phone: `+503${destino.celular}` });
    if (error) {
      console.error('signInWithOtp:', error.code, error.message);
      return mensajeDeEnvio(error.code);
    }
    return null;
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: destino.correo,
    options: { shouldCreateUser: true },
  });
  if (error) {
    console.error('signInWithOtp:', error.code, error.message);
    return mensajeDeEnvioCorreo(error.code);
  }
  return null;
}

// Checks the code. On success the session cookies are set and the user id comes back.
async function confirmarCodigo(
  supabase: ClienteSesion,
  destino: Destino,
  codigo: string,
): Promise<{ ok: true; usuarioId: string } | { ok: false; mensaje: string }> {
  const { data, error } =
    destino.metodo === 'telefono'
      ? await supabase.auth.verifyOtp({ phone: `+503${destino.celular}`, token: codigo, type: 'sms' })
      : await supabase.auth.verifyOtp({ email: destino.correo, token: codigo, type: 'email' });
  if (error || !data.user) {
    if (error) console.error('verifyOtp:', error.code, error.message);
    return { ok: false, mensaje: mensajeDeVerificacion(error?.code) };
  }
  return { ok: true, usuarioId: data.user.id };
}

// A new account has no name yet: set it first, then come back to the visitor's page.
// The client already holds the new session, so this read runs as the signed-in user.
async function irADestino(supabase: ClienteSesion, usuarioId: string, volver: string): Promise<void> {
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', usuarioId)
    .maybeSingle();
  if (!perfil?.nombre?.trim()) {
    redirect(rutaCuenta(volver));
  }
  redirect(volver);
}

export async function entrar(previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const intencion = String(datos.get('intencion') ?? 'enviar');
  const volver = destinoSeguro(datos.get('volver') as string | null);
  const metodo = String(datos.get('metodo') ?? previo.metodo) as Metodo;
  const contactoTecleado = String(datos.get('contacto') ?? previo.contacto);
  const codigoTecleado = String(datos.get('codigo') ?? '');

  // The form only offers enabled methods; this refuses a forged one.
  if (!metodosHabilitados().includes(metodo)) {
    return {
      metodo: metodosHabilitados()[0],
      paso: 'contacto',
      contacto: '',
      codigo: '',
      error: { campo: 'contacto', mensaje: 'Ese modo de entrar no está disponible.' },
    };
  }

  if (intencion === 'cambiar') {
    return { metodo, paso: 'contacto', contacto: previo.contacto, codigo: '' };
  }

  if (intencion === 'enviar' || intencion === 'reenviar' || previo.paso === 'contacto') {
    const destino = destinoDe(metodo, contactoTecleado);
    if (!destino) {
      return {
        metodo,
        paso: 'contacto',
        contacto: contactoTecleado,
        codigo: '',
        error: {
          campo: 'contacto',
          mensaje:
            metodo === 'telefono'
              ? 'Escribí los 8 números de tu celular, por ejemplo 7000 0001.'
              : 'Escribí un correo válido, por ejemplo nombre@dominio.com.',
        },
      };
    }

    const supabase = await clienteSesion();
    const error = await pedirCodigo(supabase, destino);
    if (error) {
      return { metodo, paso: 'contacto', contacto: contactoTecleado, codigo: '', error: { campo: 'contacto', mensaje: error } };
    }

    return {
      metodo,
      paso: 'codigo',
      contacto: contactoTecleado,
      codigo: '',
      aviso: intencion === 'reenviar' ? 'Te reenviamos el código.' : 'Listo. Ingresá el código de seis números.',
    };
  }

  // Second step: check the code.
  const codigo = codigoTecleado.replace(/[\s-]/g, '');
  const destino = destinoDe(metodo, previo.contacto);
  if (!destino) {
    return { metodo, paso: 'contacto', contacto: previo.contacto, codigo: '' };
  }
  if (!/^\d{6}$/.test(codigo)) {
    return {
      metodo,
      paso: 'codigo',
      contacto: previo.contacto,
      codigo: codigoTecleado,
      error: { campo: 'codigo', mensaje: 'El código tiene seis números.' },
    };
  }

  const supabase = await clienteSesion();
  const verificado = await confirmarCodigo(supabase, destino, codigo);
  if (!verificado.ok) {
    return {
      metodo,
      paso: 'codigo',
      contacto: previo.contacto,
      codigo: codigoTecleado,
      error: { campo: 'codigo', mensaje: verificado.mensaje },
    };
  }

  await irADestino(supabase, verificado.usuarioId, volver);
  return { metodo, paso: 'codigo', contacto: previo.contacto, codigo: '' };
}

/**
 * One-tap sign-in to a demo account. Uses the phone steps of entrar(), with the fixed demo code.
 * Refused unless NEXT_PUBLIC_DEMO is 1, and only for the three names in PERSONAS_DEMO.
 */
export async function entrarDemo(persona: PersonaDemo, volver: string): Promise<Resultado<null>> {
  if (!demoActivo()) return fallo('NO_PERMITIDO', 'Las cuentas de demo no están activas.');
  if (!Object.prototype.hasOwnProperty.call(PERSONAS_DEMO, persona)) {
    return fallo('NO_PERMITIDO', 'Esa cuenta de demo no existe.');
  }

  const destino: Destino = { metodo: 'telefono', celular: PERSONAS_DEMO[persona] };
  const supabase = await clienteSesion();
  const error = await pedirCodigo(supabase, destino);
  if (error) return fallo('NO_ENVIADO', error);

  const verificado = await confirmarCodigo(supabase, destino, CODIGO_DEMO);
  if (!verificado.ok) return fallo('CODIGO_INCORRECTO', verificado.mensaje);

  await irADestino(supabase, verificado.usuarioId, destinoSeguro(volver));
  return exito(null);
}
