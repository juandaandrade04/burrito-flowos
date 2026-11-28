const { test, expect } = require('@playwright/test');

const CAPTURAS = 'evidence/entregable-1/capturas';

test.describe('Pantalla de Login - Burrito FlowOS', () => {
  test('inicia sesión con credenciales de administrador', async ({ page }) => {
    await page.goto('/#/login');

    await page.locator('#email').fill('admin@burritoflowos.com');
    await page.locator('#password').fill('Admin123!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.locator('main h1')).toHaveText('Dashboard');

    await page.screenshot({ path: `${CAPTURAS}/playwright-login-ok.png`, fullPage: true });
  });

  test('muestra error con contraseña incorrecta', async ({ page }) => {
    await page.goto('/#/login');

    await page.locator('#email').fill('admin@burritoflowos.com');
    await page.locator('#password').fill('PasswordIncorrecta123!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    const error = page.locator('.alert-inline.error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Credenciales incorrectas.');
    await expect(page).toHaveURL(/#\/login$/);

    await page.screenshot({ path: `${CAPTURAS}/playwright-login-invalido.png`, fullPage: true });
  });

  test('valida campos vacíos', async ({ page }) => {
    await page.goto('/#/login');

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    const error = page.locator('.alert-inline.error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Por favor completa todos los campos.');
    await expect(page).toHaveURL(/#\/login$/);

    await page.screenshot({ path: `${CAPTURAS}/playwright-login-vacios.png`, fullPage: true });
  });
});
