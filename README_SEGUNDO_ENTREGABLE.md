# Entregable 2 — Pruebas especializadas sobre la pantalla de Login

**Pantalla elegida:** Login (`http://localhost:3000/#/login`)  
**Herramientas:** JMeter (carga), Microsoft Clarity (usabilidad/practicidad), OWASP ZAP (seguridad)  
**Fecha:** 28/11/2026

---

## 1. JMeter — Pruebas de carga

### Instalación

```powershell
winget install --id DEVCOM.JMeter --source winget --accept-package-agreements --accept-source-agreements
```

Queda en `%LOCALAPPDATA%\Programs\JMeter\bin\jmeter.bat`. El script `tests/jmeter/run.ps1` lo detecta automáticamente; si está en otra carpeta, define `$env:JMETER_BAT` con la ruta a `jmeter.bat`.

### Archivos

```text
tests/jmeter/login.jmx   # Plan de pruebas
tests/jmeter/run.ps1     # Script de ejecución
```

### Configuración del plan

| Parámetro | Valor |
|---|---|
| Usuarios concurrentes | 20 |
| Ramp-up | 5 s |
| Iteraciones por usuario | 3 |
| Requests totales | 120 |
| Endpoints | `GET /` y `POST /api/v1/auth/login` |
| Assertion | La respuesta del login contiene `Login exitoso` |
| Timeout de respuesta | 30 s |

### Ejecución

```powershell
cd <raíz del proyecto>
.\tests\jmeter\run.ps1
```

El script limpia resultados anteriores y genera:

```text
evidence/entregable-2/jmeter/results.jtl
evidence/entregable-2/jmeter/report/index.html
```

### Resultados obtenidos

| Métrica | Valor |
|---|---:|
| Requests totales | 120 |
| Errores | 0 (0.00%) |
| Tiempo mínimo | 5 ms |
| Tiempo promedio | 1464.4 ms |
| Percentil 95 | 4154 ms |
| Tiempo máximo | 6674 ms |
| `GET /` promedio | 13.9 ms (60 requests) |
| `POST /api/v1/auth/login` promedio | 2914.8 ms (60 requests) |

> Nota: con una primera configuración de 50 usuarios aparecieron timeouts y respuestas 502 en el login. El módulo de autenticación usa bcrypt y es intensivo en CPU; por eso se ajustó la carga a 20 usuarios para obtener una corrida limpia y reproducible.

---

## 2. OWASP ZAP — Pruebas de seguridad

### Instalación

El instalador silencioso de winget falló, así que se usa el paquete portable:

```powershell
$dir = '<carpeta local para ZAP>'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Invoke-WebRequest -Uri 'https://github.com/zaproxy/zaproxy/releases/download/v2.17.0/ZAP_2.17.0_Core.zip' -OutFile "$dir\zap-core.zip"
Expand-Archive "$dir\zap-core.zip" -DestinationPath $dir
$env:ZAP_BAT = "$dir\ZAP_2.17.0\zap.bat"
```

### Archivos

```text
tests/zap/scan.ps1           # Levanta ZAP en daemon, spider, active scan y reportes
tests/zap/trafico-login.mjs  # Registra el formulario de Login vía proxy de ZAP
```

### Ejecución

```powershell
$env:ZAP_BAT = '<ruta local>\ZAP_2.17.0\zap.bat'
.\tests\zap\scan.ps1
```

Genera:

```text
evidence/entregable-2/zap/report.html
evidence/entregable-2/zap/report.json
evidence/entregable-2/zap/resumen.json
```

### Resultados obtenidos

| Riesgo | Alertas (tipos únicos) | Instancias |
|---|---:|---:|
| High | 0 | 0 |
| Medium | 3 | 6 |
| Low | 2 | 10 |
| Informational | 3 | 7 |

> `resumen.json` se genera ahora desde el reporte exportado: **alertas** son tipos únicos y **instancias** es la suma del campo `count`. El resumen anterior mostraba 7/8/38 porque contabilizaba instancias acumuladas por la API `alertsSummary`, no alertas del reporte.

Alertas principales:

- Missing Anti-clickjacking Header
- Information Disclosure - Suspicious Comments
- Modern Web Application
- User Agent Fuzzer
- X-Content-Type-Options Header Missing
- Content Security Policy (CSP) Header Not Set
- Cross-Domain Misconfiguration
- Server Leaks Information via `X-Powered-By`

No se encontraron vulnerabilidades de riesgo alto. Las recomendaciones principales son añadir cabeceras de seguridad (`CSP`, `X-Content-Type-Options`, `X-Frame-Options`) y ocultar `X-Powered-By` en Express.

Además del spider sobre la raíz, el script registra tráfico real del formulario a través del proxy de ZAP (login válido e inválido), de modo que `POST /api/v1/auth/login` queda incluido en el análisis; `resumen.json` marca `endpointLoginProbado: true`.

---

## 3. Microsoft Clarity — Usabilidad / practicidad

### Estado

**Integración completada y verificada.** Project ID: `zkk57nzpdj`. El proyecto `Burrito FlowOS` ya existe en la cuenta de Clarity y el tag está recolectando eventos. El dashboard visual todavía muestra “¡Casi terminamos!” porque el propio Clarity indica: **“Pueden pasar hasta 2 horas hasta que se empiecen a ver los datos”**. Ver detalle más abajo.

### Cómo se creó el proyecto

1. Entrar a https://clarity.microsoft.com/
2. Iniciar sesión con una cuenta Microsoft.
3. **Add new project** → nombre `Burrito FlowOS`.
4. Website URL (túnel público levantado):

```text
https://jacob-editor-could-travels.trycloudflare.com
```

5. Se copió el Project ID `zkk57nzpdj` y se integró en `frontend-react/index.html`.

### Túnel usado

```powershell
cloudflared tunnel --url http://localhost:3000
```

**URL final del túnel (verificada con `200 OK`):**

```text
https://jacob-editor-could-travels.trycloudflare.com/#/login
```

Esta es la URL que se comparte con el grupo para generar sesiones reales desde PC y celular. Las sesiones del script automático pueden ser descartadas por Clarity como bot, por eso es importante que varias personas interactúen manualmente.

### Integración

El snippet está en `tests/clarity/SNIPPET.md`. Se reemplaza `__CLARITY_PROJECT_ID__` por el ID real y se pega antes de `</head>` en `frontend-react/index.html`.

Luego:

```powershell
npm --prefix frontend-react run build
```

### Evidencia capturada

```text
evidence/entregable-2/clarity/
├── evidencia-red.md                       # peticiones a clarity.ms con estados 200/204
├── clarity-login-pantalla.png             # Login con snippet activo
├── clarity-login-sesion.png               # Dashboard tras el login monitorizado
├── clarity-estado-datos-pendientes.png    # Panel de Clarity: "¡Casi terminamos!"
├── clarity-faq-tiempo-procesamiento.png   # FAQ oficial: "takes a few hours"
├── clarity-codigo-instalado-2-horas.png   # Clarity: "hasta 2 horas" + snippet idéntico
├── evidencia-red-vivo.json                # 8 respuestas clarity.ms en la corrida en vivo
├── clarity-vivo-login.png                 # Login del recorrido en vivo
└── clarity-vivo-dashboard.png             # Dashboard del recorrido en vivo
```

Se verificó en el navegador que Clarity está recolectando sesión:

```text
https://www.clarity.ms/tag/zkk57nzpdj        → 200
https://scripts.clarity.ms/.../clarity.js    → 200
https://r.clarity.ms/collect                 → 204 (múltiples eventos)
```

En la corrida en vivo por `https://jacob-editor-could-travels.trycloudflare.com` se registraron 8 respuestas: 3 con estado 200, 2 redirecciones 302 y 3 envíos 204 a `/collect`, guardadas en `evidencia-red-vivo.json`.

### Sobre el dashboard visual

Después de iniciar sesión en Clarity se entró al proyecto `Burrito FlowOS`, pero el panel continúa en la pantalla de configuración (“¡Casi terminamos!”) al no haber aún datos procesados. Al abrir **Instalar manualmente → Obtener código de seguimiento**, el propio Clarity muestra el mismo snippet que ya tenemos integrado y advierte:

> “¿Ha instalado el código? Pueden pasar hasta 2 horas hasta que se empiecen a ver los datos.”

El FAQ oficial coincide:

> “Once you finish installing the script on your website, Clarity starts collecting the data. It takes a few hours to view data in the dashboard.”

Fuente: https://learn.microsoft.com/en-us/clarity/faq#when-can-i-start-seeing-data-on-the-clarity-dashboard-

Esto, junto con el `204` en `/collect`, demuestra que la integración funciona; solo falta esperar el procesamiento del proveedor (hasta 2 horas).

### Evidencia pendiente de procesamiento por Clarity

Mientras el proveedor procesa los datos, mantener el túnel abierto y compartir la URL final con el grupo. Cada persona debe entrar desde su PC o celular, hacer login y recorrer el dashboard con clics reales.

Una vez que el panel muestre datos (hasta 2 horas), guardar en la misma carpeta:

```text
heatmap-login.png      # mapa de calor del Login
grabacion-login.png    # una grabación de sesión real
metricas-proyecto.png  # dashboard: clics muertos, clics de rabia, tiempo en la página
```

Con esas tres imágenes se completa el análisis corto de usabilidad: zonas más clicadas del formulario, puntos de frustración y tiempo invertido en el Login.

---

## 4. Estructura de evidencia

```text
evidence/entregable-2/
├── jmeter/
│   ├── results.jtl
│   └── report/index.html
├── zap/
│   ├── report.html
│   ├── report.json
│   └── resumen.json
├── clarity/
│   ├── evidencia-red.md
│   ├── clarity-login-pantalla.png
│   ├── clarity-login-sesion.png
│   ├── clarity-estado-datos-pendientes.png
│   ├── clarity-faq-tiempo-procesamiento.png
│   ├── clarity-codigo-instalado-2-horas.png
│   ├── evidencia-red-vivo.json
│   ├── clarity-vivo-login.png
│   ├── clarity-vivo-dashboard.png
│   └── (heatmap/grabación pendientes de procesamiento)
└── capturas/
    ├── reporte-jmeter.png
    ├── reporte-zap.png
    ├── reporte-playwright.png
    └── reporte-robot.png
```

---

## 5. Scripts npm agregados

```json
"test:jmeter": "powershell -ExecutionPolicy Bypass -File tests/jmeter/run.ps1",
"test:zap": "powershell -ExecutionPolicy Bypass -File tests/zap/scan.ps1"
```

---

## 6. Explicación para el profesor

> “Sobre la pantalla de Login aplicamos tres pruebas especializadas. Con JMeter simulamos 20 usuarios concurrentes contra el endpoint de autenticación y validamos 120 peticiones sin errores, con un promedio de 1.46 s por transacción; el login es la parte más costosa por bcrypt. Con OWASP ZAP ejecutamos spider y active scan sobre la aplicación, sin encontrar riesgos altos y detectando principalmente cabeceras de seguridad ausentes. Para usabilidad integramos Microsoft Clarity mediante un túnel público, de forma que se puedan revisar heatmaps y grabaciones de la sesión de login.”
