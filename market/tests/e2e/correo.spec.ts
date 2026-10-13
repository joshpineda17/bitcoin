import { type Browser, type Page, expect, test } from '@playwright/test';

import { codigoDeCorreo, OPCIONES_CONTEXTO, seDesborda } from './ayuda';

// One address for the whole file: the first test creates the account, the second signs in to it.
const CORREO = `prueba-${Date.now()}@correo.test`;
const NOMBRE = 'Vera Correo';

// Opens /entrar by email in a fresh context and sends the code. Returns the moment the send was clicked.
async function enviarCodigoCorreo(pagina: Page, correo: string): Promise<Date> {
  await pagina.goto('/entrar?metodo=correo');
  await pagina.getByLabel('Correo', { exact: true }).fill(correo);
  const desde = new Date();
  await pagina.getByRole('button', { name: 'Enviar código' }).click();
  await expect(pagina.getByLabel('Código de seis números')).toBeVisible({ timeout: 20_000 });
  return desde;
}

async function nuevaSesion(browser: Browser, viewport?: { width: number; height: number }): Promise<Page> {
  const contexto = await browser.newContext(viewport ? { ...OPCIONES_CONTEXTO, viewport } : OPCIONES_CONTEXTO);
  return contexto.newPage();
}

test('correo nuevo: entra con el código, pide el nombre y la cabecera lo muestra', async ({ browser }) => {
  const pagina = await nuevaSesion(browser);
  const desde = await enviarCodigoCorreo(pagina, CORREO);

  const codigo = await codigoDeCorreo(CORREO, desde);
  await pagina.getByLabel('Código de seis números').fill(codigo);
  await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();

  // A new account has no name yet, so the visitor goes to the profile first.
  await pagina.waitForURL((url) => url.pathname === '/cuenta', { timeout: 60_000 });
  await expect(pagina.getByRole('heading', { name: 'Tu cuenta' })).toBeVisible();
  await expect(pagina.getByRole('term')).toHaveText('Correo');
  await expect(pagina.getByRole('definition')).toContainText('@correo.test');

  await pagina.getByLabel('Tu nombre').fill(NOMBRE);
  await pagina.getByRole('button', { name: 'Guardar nombre' }).click();
  await expect(pagina.getByText('Guardamos tu nombre.')).toBeVisible({ timeout: 20_000 });
  await expect(pagina.locator('header').getByRole('link', { name: 'Vera', exact: true })).toBeVisible();
});

test('mismo correo otra vez: entra directo a la página de inicio', async ({ browser }) => {
  const pagina = await nuevaSesion(browser);
  const desde = await enviarCodigoCorreo(pagina, CORREO);

  // The newest code only: an earlier one from the first test must not work here.
  const codigo = await codigoDeCorreo(CORREO, desde);
  await pagina.getByLabel('Código de seis números').fill(codigo);
  await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();

  await pagina.waitForURL((url) => url.pathname === '/', { timeout: 60_000 });
  await expect(pagina.locator('header').getByRole('link', { name: 'Vera', exact: true })).toBeVisible();
});

test('código equivocado: lo dice y la persona sigue en el paso del código', async ({ browser }) => {
  const pagina = await nuevaSesion(browser);
  // Its own address: the local stack allows one code per address per second, and the test before
  // has just sent one to CORREO.
  await enviarCodigoCorreo(pagina, `prueba-equivocado-${Date.now()}@correo.test`);

  await pagina.getByLabel('Código de seis números').fill('000000');
  await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(pagina.getByRole('alert').filter({ hasText: 'El código no es correcto' })).toBeVisible();
  await expect(pagina.getByLabel('Código de seis números')).toBeVisible();
  await expect(pagina).toHaveURL(/\/entrar/);
});

test('demo: Lucía entra con un toque cuando la bandera está encendida', async ({ browser }) => {
  const pagina = await nuevaSesion(browser);
  await pagina.goto('/entrar');
  await expect(pagina.locator('h1').first()).toBeVisible();

  const panel = pagina.getByRole('heading', { name: 'Probar con una cuenta de demo' });
  const visible = await panel.isVisible();
  test.skip(
    !visible,
    'El servidor de desarrollo no ve NEXT_PUBLIC_DEMO=1: reiniciarlo o revisar .env.local para probar el panel.',
  );

  await pagina.getByRole('button', { name: 'Lucía, compradora' }).click();
  await pagina.waitForURL((url) => url.pathname === '/', { timeout: 60_000 });
  await expect(pagina.locator('header').getByRole('link', { name: /Lucía/ })).toBeVisible();
});

test('en 320 px ninguno de los dos métodos se desborda', async ({ browser }) => {
  const pagina = await nuevaSesion(browser, { width: 320, height: 800 });

  await pagina.goto('/entrar');
  await pagina.waitForLoadState('networkidle');
  await expect(pagina.locator('h1').first()).toBeVisible();
  expect(await seDesborda(pagina), 'entrar con celular tiene desplazamiento lateral').toBe(false);

  await pagina.getByRole('link', { name: 'Entrar con correo' }).click();
  await pagina.waitForURL((url) => url.searchParams.get('metodo') === 'correo');
  await pagina.waitForLoadState('networkidle');
  await expect(pagina.getByLabel('Correo', { exact: true })).toBeVisible();
  expect(await seDesborda(pagina), 'entrar con correo tiene desplazamiento lateral').toBe(false);
});
