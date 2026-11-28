// Genera tráfico real del formulario de Login a través del proxy de OWASP ZAP.
// Así el endpoint POST /api/v1/auth/login queda en el árbol de sitios antes del active scan.
// Uso: node tests/zap/trafico-login.mjs
import { chromium } from '@playwright/test';

const PROXY = process.env.ZAP_PROXY || 'http://127.0.0.1:8090';
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.LOGIN_EMAIL || 'admin@burritoflowos.com';
const PASSWORD = process.env.LOGIN_PASSWORD || 'Admin123!';

const navegador = await chromium.launch({
  headless: true,
  proxy: { server: PROXY },
});

try {
  const pagina = await navegador.newPage();
  await pagina.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pagina.locator('#email').waitFor({ timeout: 20000 });
  await pagina.locator('#email').fill(EMAIL);
  await pagina.locator('#password').fill(PASSWORD);
  await pagina.locator('button.login-btn').click();
  await pagina.getByText('Dashboard', { exact: false }).first().waitFor({ timeout: 20000 });

  // Segundo envío con credenciales inválidas en una sesión limpia.
  await pagina.close();
  const paginaError = await navegador.newPage();
  await paginaError.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await paginaError.locator('#email').waitFor({ timeout: 20000 });
  await paginaError.locator('#email').fill(EMAIL);
  await paginaError.locator('#password').fill('PasswordIncorrecta123!');
  await paginaError.locator('button.login-btn').click();
  await paginaError.locator('.alert-inline.error').waitFor({ timeout: 20000 });

  await paginaError.waitForTimeout(1000);
  console.log('Tráfico del formulario de login registrado en ZAP.');
} finally {
  await navegador.close();
}
