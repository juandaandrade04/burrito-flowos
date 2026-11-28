# Entregable 1 — Automatización de la pantalla de Login

**Pantalla elegida:** Login (`http://localhost:3000/#/login`)  
**Herramientas:** Playwright + Robot Framework (librería `SeleniumLibrary`)  
**Fecha:** 27/11/2026 (actualizado 28/11/2026)

## Casos automatizados

| # | Caso | Resultado esperado |
|---|------|--------------------|
| 1 | Login correcto con administrador | Redirección a `#/dashboard` y título “Dashboard” visible |
| 2 | Contraseña incorrecta | Mensaje “Credenciales incorrectas.” y permanencia en `#/login` |
| 3 | Campos vacíos | Mensaje “Por favor completa todos los campos.” |

Ambas suites ejecutan los mismos 3 casos, pero con enfoques distintos: código JavaScript con Playwright y palabras clave con Robot Framework + SeleniumLibrary (Selenium, no Playwright).

## Requisitos

```bash
npm install
npx playwright install chromium

python -m pip install -r tests/robot/requirements.txt
```

SeleniumLibrary usa Selenium 4 y Chrome. Si Selenium Manager no encuentra el navegador, instala Google Chrome o define el `executable_path` en el `Open Browser`.

## Ejecución

La aplicación debe estar corriendo en `http://localhost:3000`.

```bash
# Playwright
npm run test:e2e

# Robot Framework
npm run test:robot
```

También se pueden ejecutar directamente:

```bash
npx playwright test
python -m robot --outputdir evidence/entregable-1/robot tests/robot/login.robot
```

### Modo presentación (navegador visible)

```powershell
# Playwright con navegador visible
$env:HEADED='1'; npx playwright test

# Robot Framework con navegador visible
python -m robot --variable HEADLESS:False --outputdir evidence/entregable-1/robot tests/robot/login.robot
```

Si la app está en otro puerto (por ejemplo Docker en `8080`):

```powershell
$env:BASE_URL='http://localhost:8080'; npx playwright test
python -m robot --variable BASE_URL:http://localhost:8080 --outputdir evidence/entregable-1/robot tests/robot/login.robot
```

Para volver al modo normal:

```powershell
Remove-Item Env:HEADED, Env:BASE_URL -ErrorAction SilentlyContinue
```

## Evidencia generada

```text
evidence/entregable-1/
├── capturas/            # PNG de los 3 casos en ambas herramientas
├── playwright-report/   # Reporte HTML de Playwright
├── playwright-results/  # traces/videos de fallos
└── robot/               # report.html, log.html, output.xml
```

Para abrir el reporte de Playwright:

```bash
npx playwright show-report evidence/entregable-1/playwright-report
```

## Resultados obtenidos

| Suite | Casos | Resultado |
|-------|-------|-----------|
| Playwright (`@playwright/test`) | 3 | 3 passed, 0 failed |
| Robot Framework (`SeleniumLibrary`) | 3 | 3 passed, 0 failed |

Las 6 capturas quedaron en `evidence/entregable-1/capturas/` (3 por herramienta). Los reportes HTML están en `evidence/entregable-1/playwright-report/` y `evidence/entregable-1/robot/`.

## Explicación para el profesor

Playwright es una librería de automatización de navegador usada desde código JavaScript. Robot Framework es un framework basado en palabras clave y en este trabajo usa **SeleniumLibrary**, que se apoya en Selenium/WebDriver, no en Playwright. Por eso las dos suites son tecnológicamente independientes aunque validen la misma pantalla.

- **Playwright:** código JavaScript con aserciones `expect`.
- **Robot Framework:** palabras clave legibles (`Input Text`, `Click Button`, `Wait Until Element Is Visible`).

> “Automatizamos la pantalla de Login con dos enfoques independientes: Playwright mediante código y Robot Framework mediante SeleniumLibrary. Validamos tres escenarios: login correcto, credenciales inválidas y campos vacíos. La evidencia son los reportes HTML y las capturas de cada caso.”
