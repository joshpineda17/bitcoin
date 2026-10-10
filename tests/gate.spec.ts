import { expect, test } from '@playwright/test';

const PAGA = '/historias/la-ola-que-cambio-un-pueblo/';
const GRATIS = '/historias/como-pedir-un-cafe-de-altura/';
const CLAVE = 'cacao-gate:la-ola-que-cambio-un-pueblo';
const DIA = 24 * 60 * 60 * 1000;

test('paid story starts locked', async ({ page }) => {
  await page.goto(PAGA);
  await expect(page.locator('[data-historia]')).toHaveAttribute('data-gate-estado', 'bloqueado');
  await expect(page.locator('[data-gate-cerrado]')).toBeHidden();
  await expect(page.locator('[data-gate-muro]')).toBeVisible();
  await expect(page.locator('[data-gate-pastilla]')).toHaveText('$0.12');
  await expect(page.locator('[data-gate-muro]')).toContainText('Modo demo');
});

test('unlocking reveals the story and survives a reload', async ({ page }) => {
  await page.goto(PAGA);
  await page.locator('[data-gate-boton]').click();
  await expect(page.locator('[data-gate-cerrado]')).toBeVisible();
  await expect(page.locator('[data-gate-muro]')).toBeHidden();

  const expira = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).expira, CLAVE);
  expect(expira - Date.now()).toBeGreaterThan(6.9 * DIA);
  expect(expira - Date.now()).toBeLessThanOrEqual(7 * DIA);

  await page.reload();
  await expect(page.locator('[data-gate-cerrado]')).toBeVisible();
});

test('reading the unlocked part sets the state to leyendo', async ({ page }) => {
  await page.goto(PAGA);
  await page.locator('[data-gate-boton]').click();
  await page.locator('[data-gate-cerrado]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-historia]')).toHaveAttribute('data-gate-estado', 'leyendo');
  await expect(page.locator('[data-gate-pastilla]')).toHaveText('Leyendo');
});

test('an expired unlock locks the story again', async ({ page }) => {
  await page.goto(PAGA);
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ expira: Date.now() - 1000 })), CLAVE);
  await page.reload();
  await expect(page.locator('[data-historia]')).toHaveAttribute('data-gate-estado', 'expirado');
  await expect(page.locator('[data-gate-cerrado]')).toBeHidden();
  await expect(page.locator('[data-gate-vencido]')).toBeVisible();
  await expect(page.locator('[data-gate-boton]')).toHaveText('Desbloquear de nuevo');
  await expect(page.locator('[data-gate-pastilla]')).toHaveText('Expirado');

  await page.locator('[data-gate-boton]').click();
  await expect(page.locator('[data-gate-cerrado]')).toBeVisible();
});

test('unlocking one story does not unlock another', async ({ page }) => {
  await page.goto(PAGA);
  await page.locator('[data-gate-boton]').click();
  await page.goto('/historias/lo-que-nadie-te-cuenta-del-tunco/');
  await expect(page.locator('[data-gate-cerrado]')).toBeHidden();
});

test('free story has no wall', async ({ page }) => {
  await page.goto(GRATIS);
  await expect(page.locator('[data-historia]')).toHaveAttribute('data-gate-estado', 'gratis');
  await expect(page.locator('[data-gate-muro]')).toHaveCount(0);
  await expect(page.locator('[data-gate-pastilla]')).toHaveText('Gratis');
});

for (const ruta of ['/', '/cronicas/', '/archivo/', '/acerca/', PAGA]) {
  test(`no horizontal scroll at 375px on ${ruta}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(ruta);
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(0);
  });
}
