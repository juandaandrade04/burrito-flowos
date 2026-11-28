// Captura los reportes HTML como PNG para incrustarlos en el documento Word.
// Usa archivos locales, sin necesidad de servidor temporal.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SALIDA = path.resolve('evidence/entregable-2/capturas');
await mkdir(SALIDA, { recursive: true });

const archivos = [
  ['jmeter', 'evidence/entregable-2/jmeter/report/index.html'],
  ['zap', 'evidence/entregable-2/zap/report.html'],
  ['playwright', 'evidence/entregable-1/playwright-report/index.html'],
  ['robot', 'evidence/entregable-1/robot/report.html'],
];

const navegador = await chromium.launch({ headless: true });
for (const [nombre, relativo] of archivos) {
  const url = pathToFileURL(path.resolve(relativo)).href;
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1000 } });
  await pagina.goto(url, { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(1200);
  await pagina.screenshot({ path: path.join(SALIDA, `reporte-${nombre}.png`), fullPage: false });
  console.log(`Capturado: reporte-${nombre}.png`);
  await pagina.close();
}
await navegador.close();
