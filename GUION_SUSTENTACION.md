# Guion de sustentación — Burrito FlowOS

**Duración estimada:** 10–12 minutos.  
**Cómo usarlo:** lee en voz alta lo que está entre comillas. Lo que está entre corchetes `[…]` es lo que debes mostrar o adaptar en el momento.

---

## 0. Apertura (30 s)

> “Buenos días, profesor. Vamos a sustentar las pruebas realizadas sobre una sola pantalla: el **Login** de Burrito FlowOS, en `http://localhost:3000/#/login`.  
> Trabajamos cuatro frentes: automatización funcional con **Playwright** y **Robot Framework**, carga con **JMeter**, usabilidad con **Microsoft Clarity** y seguridad con **OWASP ZAP**.  
> Todo el código, las evidencias y los dos documentos Word están en el repositorio. Si quiere, voy siguiendo el orden del documento mientras lo explico.”

[Muestra `DOCUMENTACION_PRUEBAS_BURRITO_FLOWOS.docx` y `GUIA_PRUEBAS_EN_VIVO.docx`.]

---

## 1. Automatización funcional (2 min 30 s)

> “Empecemos por la automatización. Tomamos tres casos de la pantalla de Login y los ejecutamos con dos herramientas distintas: **Playwright**, mediante código JavaScript sobre Chromium, y **Robot Framework**, mediante palabras clave legibles con **SeleniumLibrary** sobre Google Chrome.  
> Un punto importante: Robot **no** usa la librería `Browser` ni Playwright. Usa SeleniumLibrary, o sea Selenium/WebDriver. Por eso las dos suites son tecnológicamente independientes aunque validen lo mismo.”

> “Los tres casos son: **login correcto**, que redirige al dashboard; **contraseña incorrecta**, que muestra ‘Credenciales incorrectas.’; y **campos vacíos**, que muestra ‘Por favor completa todos los campos.’”

[Muestra el navegador visible o las capturas.]

> “Acá vemos el login correcto con `admin@burritoflowos.com` / `Admin123!`. Si escribo una contraseña mala aparece el mensaje de credenciales incorrectas y me quedo en `#/login`. Y si dejo los campos vacíos aparece el mensaje de validación.”

[Muestra `evidence/entregable-1/playwright-report/index.html`.]

> “El reporte de Playwright dice **3 passed, 0 failed**.”

[Muestra `evidence/entregable-1/robot/report.html`.]

> “El reporte de Robot dice **3 tests, 3 passed, 0 failed**. Las seis capturas quedaron en `evidence/entregable-1/capturas/`, tres por herramienta.  
> Entonces, con dos enfoques distintos —código y palabras clave— llegamos al mismo resultado: la pantalla de Login se comporta como se espera.”

---

## 2. Pruebas de carga con JMeter (2 min)

[Muestra `evidence/entregable-2/jmeter/report/index.html`.]

> “Para desempeño usamos JMeter. Configuramos **20 usuarios concurrentes**, **ramp-up de 5 segundos** y **3 iteraciones por usuario**, lo que da **120 peticiones**. El resultado fue **0 errores**.  
> El promedio general quedó en **1464.4 milisegundos**, el percentil 95 en **4154 ms** y el máximo en **6674 ms**.”

[Muestra la tabla por etiqueta.]

> “Si separamos por endpoint, el `GET /` de la pantalla tarda apenas **13.9 ms**, mientras que el `POST /api/v1/auth/login` tarda **2914.8 ms**.  
> Eso nos dice algo claro: la página carga rápido; el costo está en la autenticación, porque usamos bcrypt para hashear la contraseña. Cada login hace un trabajo criptográfico relativamente caro.”

> “También probamos con 50 usuarios y ahí aparecieron timeouts y respuestas 502 por el mismo motivo. Por eso dejamos la corrida definitiva en 20 usuarios, que es estable, y documentamos la recomendación: **ajustar los parámetros de bcrypt, aplicar rate limiting y escalar el servicio de autenticación** si el sistema fuera a producción.”

---

## 3. Usabilidad con Microsoft Clarity (2 min)

[Muestra `frontend-react/index.html` con el snippet y la pestaña Network con el filtro `clarity.ms`.]

> “Para usabilidad integramos **Microsoft Clarity**. El Project ID es `zkk57nzpdj`, que es público por diseño porque forma parte del snippet del sitio. Lo pegamos antes del `</head>` en `frontend-react/index.html`.  
> Como Clarity necesita una URL accesible, levantamos un túnel público con Cloudflare. La URL final que compartimos con el grupo es:

> `https://quad-scene-ceremony-world.trycloudflare.com/#/login`

> “Al abrir DevTools, pestaña Network y filtrar `clarity.ms`, se ve el tag con estado **200**, el script `clarity.js` con **200** y los envíos a `/collect` con **204**. Eso confirma que los eventos se están mandando: carga del Login, llenado de credenciales, clic en ‘Iniciar sesión’ y llegada al Dashboard.”

### Elige una de estas dos opciones según lo que veas en el panel

**Opción A — si el panel ya muestra datos:**

[Muestra `heatmap-login.png`, `grabacion-login.png` y `metricas-proyecto.png`.]

> “Acá ya tengo el mapa de calor, una grabación real y el dashboard con clics muertos, clics de rabia y tiempo en página.  
> `[Completa con tu observación real: zona más clicada, si hay clics de rabia y cuánto tiempo permanece el usuario en el Login.]`

> “ como mejora de usabilidad, `[escribe la recomendación concreta, por ejemplo: resaltar más el botón de ingreso o validar el correo antes de enviar]`.”

**Opción B — si sigue en ‘¡Casi terminamos!’:**

[Muestra `clarity-estado-datos-pendientes.png` y `evidencia-red-vivo.json`.]

> “Clarity todavía está procesando y avisa que puede tardar hasta **2 horas**. Mantuvimos el túnel abierto y compartimos la URL para que varias personas entraran desde PC y celular e hicieran clics reales, porque las sesiones generadas por el script automático pueden ser descartadas como bot.  
> La evidencia técnica que tenemos hoy son los estados **200/204** en Network, guardados en `evidencia-red-vivo.json`. Las capturas de heatmap, grabación y métricas quedan documentadas como pendientes y se agregarán cuando el proveedor procese los datos; no quiero inventar resultados que todavía no veo en el panel.”

---

## 4. Seguridad con OWASP ZAP (2 min)

[Muestra `evidence/entregable-2/zap/report.html` y `resumen.json`.]

> “Para seguridad usamos OWASP ZAP. Levantamos el daemon, corrimos un **spider** sobre la raíz de la aplicación y, además, registramos tráfico real del formulario pasando por el proxy de ZAP: un login válido y otro inválido. Así el endpoint `POST /api/v1/auth/login` quedó incluido en el análisis. Después aplicamos el **active scan**.”

> “El reporte actual muestra **0 riesgos altos**, **3 medios**, **2 bajos** y **3 informativos**.  
> Hubo una confusión con un resumen anterior que decía 7/8/38: eso contabilizaba **instancias acumuladas** por la API `alertsSummary`, no alertas. Ahora distinguimos los dos conceptos: **alertas** son tipos únicos —0/3/2/3— e **instancias** son ocurrencias —0/6/10/7—. Está aclarado en `resumen.json` y en el Word.”

> “Los hallazgos principales son **Missing Anti-clickjacking Header**, **Content Security Policy** ausente, **X-Content-Type-Options** ausente y exposición de **X-Powered-By**. La recomendación es agregar esas cabeceras en Express, ocultar `X-Powered-By` y revisar CORS. Son recomendaciones de endurecimiento, no bloqueantes.  
> El active scan directo al endpoint devolvió 400, por eso lo cubrimos con el tráfico del proxy; eso también quedó documentado.”

---

## 5. Cierre (1 min)

> “Para resumir: sobre la pantalla de Login validamos **funcionalidad** con dos suites independientes que pasan los tres casos; **desempeño** con 120 peticiones sin errores, identificando el login por bcrypt como el punto más costoso; **seguridad** sin riesgos altos, con hallazgos de cabeceras faltantes; y **usabilidad** con el tag de Clarity confirmado por red y el túnel compartido para sesiones reales.”

> “Como próximos pasos recomendaría: endurecer las cabeceras de seguridad, ajustar bcrypt y el rate limiting, y esperar a que Clarity procese para completar el análisis visual de clics y grabaciones.”

> “No subimos el archivo `.env` ni secretos al repositorio; solo las credenciales de demostración que están documentadas. Eso es todo, profesor. Quedo atento a sus preguntas.”

---

## Preguntas probables y respuestas cortas

| Pregunta | Respuesta sugerida |
|---|---|
| ¿Por qué dos herramientas de automatización? | “Para comparar dos enfoques: código con Playwright y palabras clave con Robot. Además, son tecnologías independientes: Chromium contra Selenium/Chrome.” |
| ¿Robot usa Browser o Playwright? | “No. Usa `SeleniumLibrary`, que se apoya en Selenium/WebDriver. Lo dejamos explícito en el README y en el Word.” |
| ¿Por qué 20 usuarios y no 50? | “Con 20 hay 120 peticiones y 0 errores. Con 50 aparecieron timeouts y 502 por bcrypt; documentamos el hallazgo y la recomendación.” |
| ¿Clarity no muestra datos? ¿Entonces cómo saben que funciona? | “Por la red: tag 200, script 200 y `/collect` 204. Eso confirma recolecta. El panel puede tardar hasta 2 horas y las sesiones bot pueden descartarse, por eso compartimos el túnel con el grupo.” |
| ¿El túnel cambió? | “Sí, al suspender la PC el túnel rápido cambió de URL. Lo reinicié, verifiqué 200 y actualicé documentos y README con la URL nueva.” |
| ¿Los números del ZAP son 7/8/38 o 0/3/2/3? | “0/3/2/3 son alertas únicas; 7/8/38 eran instancias del resumen anterior. Ahora el reporte separa alertas de instancias: 0/6/10/7.” |
| ¿Probó el endpoint de login en ZAP? | “Sí, pero no con active scan directo porque devolvió 400. Lo cubrimos registrando el formulario a través del proxy de ZAP.” |
| ¿Subieron secretos? | “No. `.env` está en `.gitignore`; solo están las credenciales demo documentadas.” |
