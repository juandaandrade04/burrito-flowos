# Evidencia de integración de Microsoft Clarity

**Project ID:** `zkk57nzpdj`  
**URL pública original:** `https://adjustments-amplifier-partner-offerings.trycloudflare.com/#/login`  
**URL pública en vivo actual:** `https://jacob-editor-could-travels.trycloudflare.com/#/login`  
**Fecha:** 28/11/2026

## Verificación del snippet

El HTML servido por el gateway y por el túnel contiene:

```text
(window, document, "clarity", "script", "zkk57nzpdj")
```

## Peticiones observadas en el navegador

| URL | Estado | Significado |
|---|---:|---|
| `https://www.clarity.ms/tag/zkk57nzpdj` | 200 | Tag del proyecto cargado correctamente |
| `https://scripts.clarity.ms/0.8.80-beta/clarity.js` | 200 | Script de Clarity ejecutado |
| `https://c.clarity.ms/c.gif` | 302 | Inicio de sesión de Clarity |
| `https://r.clarity.ms/collect` | 204 | Eventos/sesión enviados a Clarity (múltiples llamadas) |
| `https://c.clarity.ms/c.gif?...` | 200 | Sincronización de identidad |

La respuesta `204` en `r.clarity.ms/collect` confirma que Clarity **está recolectando la sesión real** del recorrido de Login.

## Recorrido grabado

1. Carga de `http://.../#/login` a través del túnel.
2. Llenado de `admin@burritoflowos.com` / `Admin123!`.
3. Click en **Iniciar sesión**.
4. Redirección a `#/dashboard`.

## Capturas

- `clarity-login-pantalla.png` — pantalla de Login con el snippet activo.
- `clarity-login-sesion.png` — dashboard después del login, dentro de la sesión monitorizada.
- `clarity-vivo-login.png` — Login del recorrido en vivo por la URL actual.
- `clarity-vivo-dashboard.png` — Dashboard del recorrido en vivo.
- `evidencia-red-vivo.json` — 8 respuestas de `clarity.ms` (3×200, 2×302, 3×204).

## Estado del dashboard de Clarity

Se inició sesión en https://clarity.microsoft.com/ y se entró al proyecto `Burrito FlowOS` (`zkk57nzpdj`). El panel continúa en la pantalla “¡Casi terminamos!” porque Clarity aún no procesa los datos. El FAQ oficial indica:

> “Once you finish installing the script on your website, Clarity starts collecting the data. It takes a few hours to view data in the dashboard.”

Fuente: https://learn.microsoft.com/en-us/clarity/faq#when-can-i-start-seeing-data-on-the-clarity-dashboard-

Además, al abrir **Instalar manualmente → Obtener código de seguimiento**, Clarity muestra exactamente el mismo snippet que está integrado y advierte: **“¿Ha instalado el código? Pueden pasar hasta 2 horas hasta que se empiecen a ver los datos.”** La captura se guardó como `clarity-codigo-instalado-2-horas.png`.

La captura del estado del panel se guardó como `clarity-estado-datos-pendientes.png` y la del FAQ como `clarity-faq-tiempo-procesamiento.png`.

## Pendiente de procesamiento por Clarity

Una vez que el panel muestre datos (unas horas), guardar en esta misma carpeta:

- `heatmap-login.png`
- `grabacion-login.png`
- `metricas-proyecto.png`
