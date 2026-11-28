// Genera evidencia real de la sesión de Clarity sobre el túnel público.
// Uso: node tests/clarity/capturar-vivo.mjs
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const URL_BASE = process.env.CLARITY_URL || 'https://quad-scene-ceremony-world.trycloudflare.com';
const SALIDA = path.resolve('evidence/entregable-2/clarity');

await mkdir(SALIDA, { recursive: true });

const navegador = await chromium.launch({ headless: true });
const contexto = await navegador.newContext({ viewport: { width: 1365, height: 900 } });
const pagina = await contexto.newPage();

const peticiones = [];
pagina.on('response', (respuesta) => {
  if (respuesta.url().includes('clarity.ms')) {
    peticiones.push({ url: respuesta.url(), status: respuesta.status() });
  }
});

await pagina.goto(`${URL_BASE}/#/login`, { waitUntil: 'networkidle' });
await pagina.locator('#email').fill('admin@burritoflowos.com');
await pagina.locator('#password').fill('Admin123!');
await pagina.screenshot({ path: path.join(SALIDA, 'clarity-vivo-login.png'), fullPage: true });

await pagina.locator('button.login-btn').click();
await pagina.getByText('Dashboard', { exact: false }).first().waitFor({ timeout: 20000 });
await pagina.waitForTimeout(2500);
await pagina.screenshot({ path: path.join(SALIDA, 'clarity-vivo-dashboard.png'), fullPage: true });

await writeFile(
  path.join(SALIDA, 'evidencia-red-vivo.json'),
  JSON.stringify(
    {
      fecha: new Date().toISOString(),
      url: URL_BASE,
      projectId: 'zkk57nzpdj',
      peticiones,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`Evidencia Clarity generada en ${SALIDA}`);
console.log(`Peticiones a clarity.ms: ${peticiones.length}`);
await navegador.close();
