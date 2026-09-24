# Plan de Descomposición SOA — Burrito FlowOS

> Análisis del monolith actual y propuesta de servicios independientes.
> Asignatura: Programación distribuida y paralela (SOA) | 2026

---

## 1. Estado actual del monolith

- **Stack:** Node.js + Express + Mongoose sobre una única base MongoDB (`burrito_flowos`).
- **Punto de entrada único:** `server.js` monta todas las rutas API, sirve el frontend estático, aplica CORS/JSON y maneja 404/errores de forma global.
- **BD única compartida:** los 4 modelos (`Usuario`, `Insumo`, `Receta`, `Venta`) viven en la misma base.
- **Seguridad centralizada:** `middlewares/verifyToken.js` (JWT) y `middlewares/checkRole.js` (roles) se aplican en todos los endpoints.
- **Frontend:** servido por el mismo proceso (`server.js`) y consume `/api/v1/*` por HTTP.

### 2. Mapa de dependencias por módulo

| Módulo | Controlador | Modelos que usa | Dependencias externas | Extraíble |
|---|---|---|---|---|
| Auth | `AuthController.js` | `Usuario` | Ninguna | Sí, junto a Usuarios |
| Usuarios | `UsuarioController.js` | `Usuario` | Ninguna | Sí, junto a Auth |
| Insumos | `InsumoController.js` | `Insumo` | **Ninguna** | **Sí, inmediato** |
| Recetas | `RecetaController.js` | `Receta`, `Insumo` | Lee Insumos: validar ingredientes (`:43`) y `populate` (`:9`) | Sí (con adaptación) |
| Ventas | `VentaController.js` | `Venta`, `Receta`, `Insumo` | Recetas (precio/ingredientes) + Insumos (stock/descuento) | Condicional (ver §5) |

### 2.1 Acoplamientos críticos

1. **Recetas → Insumos:** valida que cada ingrediente exista en `Insumo` y usa `populate('ingredientes.insumo')` para traer nombre/unidad/cantidad. Es una referencia por `ObjectId` entre dominios.
2. **Ventas → Recetas:** busca la receta por nombre (`$regex` sobre `tipo_burrito`) para obtener precio e ingredientes (`VentaController.js:18-21`).
3. **Ventas → Insumos:** verifica stock suficiente, descuenta insumos al registrar y los revierte al anular (`VentaController.js:29-87, 182-193`).
4. **Ventas → Usuario:** guarda `usuario` (ObjectId) y hace `populate('usuario')` para mostrar nombre/email.

> Nota: el modelo `Venta` ya está denormalizado (`tipo_burrito` string, `insumos_descontados` con nombre/cantidad), lo que facilita la separación.

---

## 3. Servicios propuestos

| Servicio | Alcance (rutas actuales) | Dominio | Estado |
|---|---|---|---|
| **auth-service** (Identidad) | `/auth/*`, `/usuarios/*` | Usuarios, login, JWT | Listo para extraer |
| **inventory-service** (Insumos) | `/insumos/*` | Inventario, stock, alertas | **Extracción inmediata** |
| **catalog-service** (Recetas) | `/recetas/*` | Menú, ingredientes | Necesita adaptación |
| **sales-service** (Ventas) | `/ventas/*` | Ventas, anulaciones, estadísticas | Requiere saga |

### 3.1 API Gateway

Un **API Gateway** (`gateway`) centralizará la entrada a `/api/v1/*`:

- Enrutamiento HTTP por prefijo a cada servicio.
- CORS, body parsing y formato de error unificado.
- Verificación de JWT (delegada) y propagación de la identidad al servicio vía headers internos (`X-User-Id`, `X-User-Rol`).
- Servicio de archivos estáticos del `frontend-react/dist/` (frontend React + TypeScript).

---

## 4. Orden de extracción (migración incremental)

1. **inventory-service (Insumos)** — cero dependencias, riesgo mínimo. Liberar el dominio de inventario.
2. **auth-service (Auth + Usuarios)** — segundo más fácil; libera credenciales y token.
3. **catalog-service (Recetas)** — reemplazar `populate` por copia denormalizada del nombre/unidad de insumo o consulta al inventory-service al validar ingredientes.
4. **sales-service (Ventas)** — el último y el más complejo: orquesta a recetas e insumos.
5. **gateway** — capa de entrada común para el frontend existente (sin cambios en el cliente React).

Cada paso conserva las rutas `/api/v1/...` intactas para minimizar cambios en el frontend React.

---

## 5. Retos y decisiones de diseño

### 5.1 Transaccionalidad venta + stock (crítico)

`VentaController.registrar` ejecuta de forma atómica: buscar receta → verificar stock → descontar insumos → guardar venta. Al separar Ventas de Insumos, esa atomicidad se pierde.

**Opción A — Saga (compensación):**
1. Sales-service solicita reserva de stock al inventory-service.
2. Sales-service registra la venta.
3. Si falla la venta, sales-service solicita liberación de stock (inverso).
4. Si falla la reserva, se aborta. Requiere un coordinador de saga o eventos.

**Opción B — Fusionar Inventario + Ventas (dominio "Punto de Venta"):**
Prioriza consistencia sobre granularidad: un único `sales-inventory-service` mantiene stock+ventas en la misma BD. Recetas y Auth quedan como servicios separados.

Recomendación: **Opción A (saga)** si el objetivo del curso es demostrar desacople real entre servicios; **Opción B** si se prioriza simplicidad y consistencia.

### 5.2 JWT compartido

Hoy un solo `JWT_SECRET` firma y verifica. Opciones:
- Compartir `JWT_SECRET` entre servicios (sencillo, acoplamiento de configuración).
- El Gateway verifica el token y los servicios confían en la identidad propagada (recomendado).

### 5.3 Base de datos por servicio

Migrar de una BD única a una BD (o colección independiente) por dominio:

- Usuarios → colección `usuarios`
- Insumos → colección `insumos`
- Recetas → colección `recetas` (+ copia de `insumo: { id, nombre, unidad }`)
- Ventas → colección `ventas` (denormalizada, requiere solo IDs de receta/usuario)

### 5.4 Sincronización Recetas → Insumos

Al separar, catalog-service no puede hacer `populate`. Alternativas:
- Guardar snapshot del insumo (id + nombre + unidad) al crear/actualizar la receta.
- Validar existencia mediante llamada HTTP al inventory-service.

---

## 6. Estructura de carpetas objetivo

```
burrito-flowos/
├── gateway/                  # API Gateway + frontend estático
│   └── server.js
├── services/
│   ├── auth-service/         # /auth, /usuarios
│   ├── inventory-service/    # /insumos
│   ├── catalog-service/      # /recetas
│   └── sales-service/        # /ventas
└── shared/
    └── jwt-verify.js         # (opcional) validación de token compartida
```

Cada servicio es una app Express independiente con su propio `package.json`, `.env` y puerto, exponiendo sus rutas bajo `/api/v1/<dominio>`.

---

## 7. Checklist de extracción del primer servicio (inventory-service)

- [x] Crear `services/inventory-service/` con `server.js`, `models/Insumo.js`, `controllers/InsumoController.js`, `routes/insumos.routes.js`.
- [x] Reutilizar `middlewares/verifyToken.js` y `checkRole.js` (o delegar al Gateway).
- [x] Configurar BD propia (`MONGO_URI=.../burrito_insumos`) y `.env`.
- [x] Mantener la interfaz `/api/v1/insumos` idéntica a la actual.
- [x] Redirigir `/api/v1/insumos/*` en el monolith (o en el Gateway) hacia el nuevo servicio.

> **Progreso (2026-09-13):** inventory-service implementado en `services/inventory-service/`,
> puerto 4001. El monolith redirige `/api/v1/insumos/*` al servicio vía
> `middlewares/insumosProxy.js`. Verificado end-to-end (GET/POST/DELETE por el proxy).
> Comandos: `npm run service:inventory` + `npm run dev`.