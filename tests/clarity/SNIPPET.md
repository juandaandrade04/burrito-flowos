# Integración de Microsoft Clarity

## Cómo obtener el Project ID

1. Entrar a https://clarity.microsoft.com/
2. Iniciar sesión con una cuenta Microsoft.
3. Crear un proyecto nuevo: **Add new project** / **Add website**.
4. Nombre sugerido: `Burrito FlowOS`.
5. URL: usar la URL pública temporal (por ejemplo la de Cloudflare Tunnel).
6. Copiar el **Project ID** que muestra Clarity.

## Cómo integrarlo

El snippet ya está integrado en `frontend-react/index.html` con el Project ID real `zkk57nzpdj`. Si necesitas cambiarlo, reemplaza ese valor en el snippet siguiente y vuelve a compilar.

```html
<script type="text/javascript">
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "__CLARITY_PROJECT_ID__");
</script>
```

Luego recompilar:

```powershell
npm --prefix frontend-react run build
```

Con el gateway corriendo en `localhost:3000`, el snippet ya estará sirviéndose en `frontend-react/dist/index.html`.

## Evidencia a capturar

- Grabación de una sesión de login.
- Heatmap de la pantalla de Login.
- Captura del dashboard de Clarity con el proyecto y las métricas.

Guardarlas en `evidence/entregable-2/clarity/`.
