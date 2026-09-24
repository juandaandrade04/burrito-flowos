# 🌯 Burrito FlowOS
### Sistema de Gestión de Ventas e Insumos
> Proyecto final — Computación Orientada a Servicios (SOA) | 2026

---

## 🚀 Instalación y puesta en marcha

### Requisitos previos
- [Node.js v18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) corriendo en localhost:27017
  - O una cadena de conexión Atlas gratuita

---

### 1. Clonar / descomprimir el proyecto

```bash
cd burrito-flowos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` si usas MongoDB Atlas:

```env
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/burrito_flowos
JWT_SECRET=cualquier_clave_secreta_larga
```

### 4. Cargar datos iniciales (seed)

```bash
npm run seed
```

Esto crea:
- **Administrador:** `admin@burritoflowos.com` / `Admin123!`
- **Cajero:** `cajero@burritoflowos.com` / `Cajero123!`
- 12 insumos del inventario
- 3 recetas (Sabanero, Veggie, Maicero)

### 5. Construir el frontend React

```bash
cd frontend-react
npm install
npm run build
cd ..
```

El build queda en `frontend-react/dist/` y es lo que sirve Express en producción.

### 6. Iniciar el servidor

```bash
npm start          # producción (sirve frontend-react/dist + API)
npm run dev        # desarrollo con auto-reload (nodemon)
```

### 7. Abrir la aplicación

| Interfaz | URL |
|---|---|
| Frontend (React + TypeScript) | http://localhost:3000 |
| API base | http://localhost:3000/api/v1/ |

> **En desarrollo con Vite**: `npm --prefix frontend-react run dev` levanta el frontend en http://localhost:5173 con proxy automático hacia la API. El monolito (`npm start`) debe estar corriendo en :3000.

---

## ⚛️ Frontend (React + TypeScript)

El frontend fue migrado de HTML vanilla a **React + TypeScript** y vive en `frontend-react/`.

- **Stack:** Vite 8, React 19, TypeScript 6, React Router (HashRouter), oxlint.
- **Comunicación:** cliente `fetch` propio en `src/lib/api.ts` con tokens JWT desde localStorage y manejo de errores centralizado (`ApiRequestError`).
- **Rutas protegidas:** `RequireAuth`/`RequireAdmin` (redirect a `/login` si no hay sesión; cajero sin acceso a módulos de administrador).
- **Páginas:** Login · Dashboard (estadísticas + alertas de stock + últimas ventas) · Ventas (registro con preview de combo + historial + anular) · Insumos (CRUD) · Recetas (CRUD) · Usuarios (CRUD + roles).

```
frontend-react/
├── index.html
├── vite.config.ts         # Alias @, proxy /api → :3000
├── package.json
├── tsconfig.app.json      # paths: @/* → ./src/*
├── dist/                  # Build de producción (servido por Express)
└── src/
    ├── main.tsx           # Bootstrap (ReactDOM + AuthProvider + Router)
    ├── App.tsx            # Definición de rutas
    ├── index.css          # Estilos globales
    ├── types/api.ts       # Tipos: Usuario, Insumo, Receta, Venta, respuestas API
    ├── lib/
    │   ├── api.ts         # Cliente HTTP + manejo de errores
    │   └── format.ts      # Moneda COP, fechas, iniciales
    ├── context/
    │   ├── AuthContext.tsx # Sesión, login/logout, esAdmin
    │   └── ToastContext.tsx
    ├── components/
    │   ├── Layout.tsx     # Sidebar + topbar
    │   ├── Modal.tsx
    │   ├── RequireAuth.tsx # Guards de ruta por rol
    │   └── ui.tsx         # Botones, inputs, badges, spinners
    └── pages/
        ├── LoginPage.tsx
        ├── DashboardPage.tsx
        ├── VentasPage.tsx
        ├── InsumosPage.tsx
        ├── RecetasPage.tsx
        └── UsuariosPage.tsx
```

---

## 📁 Estructura del proyecto

```
burrito-flowos/
├── server.js                  # Punto de entrada
├── package.json
├── .env.example
│
├── config/
│   ├── database.js            # Conexión MongoDB
│   └── seed.js                # Datos iniciales
│
├── models/
│   ├── Usuario.js
│   ├── Insumo.js
│   ├── Receta.js
│   └── Venta.js
│
├── controllers/
│   ├── AuthController.js
│   ├── RecetaController.js
│   ├── VentaController.js
│   └── UsuarioController.js
│
├── routes/
│   ├── auth.routes.js
│   ├── recetas.routes.js
│   ├── ventas.routes.js
│   └── usuarios.routes.js
│
├── services/inventory-service/   # Microservicio de inventario (insumos vía proxy)
│   ├── controllers/InsumoController.js
│   ├── models/Insumo.js
│   └── ...
│
├── middlewares/
│   ├── verifyToken.js         # Autenticación JWT
│   ├── checkRole.js           # Control de roles
│   └── errorHandler.js        # Manejo centralizado de errores
│
├── frontend-react/          # Frontend en React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/       # Layout, Modal, guards, UI
│   │   ├── context/          # Auth y Toasts
│   │   ├── lib/              # Cliente API y formatos
│   │   ├── pages/            # Login, Dashboard, Ventas, Insumos, Recetas, Usuarios
│   │   └── types/            # Tipos de la API
│   └── dist/                 # Build de producción (servido por Express)
│
└── BurritoFlowOS_Postman.json  # Colección de pruebas
```

---

## 🔐 API Reference `/api/v1/`

### Auth
| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | No | Inicia sesión y devuelve JWT |
| POST | `/auth/logout` | Sí | Cierra sesión |
| GET | `/auth/perfil` | Sí | Perfil del usuario actual |

### Insumos (vía inventory-service, proxy `/api/v1/insumos`)
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/insumos` | Admin/Cajero | Listar insumos (soporta `?nombre=` y `?alerta=true`) |
| GET | `/insumos/:id` | Admin/Cajero | Obtener insumo |
| POST | `/insumos` | Admin | Crear insumo |
| PUT | `/insumos/:id` | Admin | Actualizar insumo |
| DELETE | `/insumos/:id` | Admin | Eliminar insumo (soft delete) |

> El dominio de inventario vive en `services/inventory-service`; el monolito redirige `/api/v1/insumos` a ese servicio mediante `middlewares/insumosProxy.js`.

### Ventas
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | `/ventas` | Admin/Cajero | Registrar venta y descontar insumos automáticamente |
| GET | `/ventas` | Admin | Historial de ventas (soporta `?desde=` `?hasta=` `?tipo_burrito=`) |
| GET | `/ventas/:id` | Admin | Detalle de una venta |
| DELETE | `/ventas/:id` | Admin | Anular venta y revertir insumos |

### Recetas
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/recetas` | Admin/Cajero | Listar recetas del menú |
| GET | `/recetas/:id` | Admin/Cajero | Detalle de receta |
| POST | `/recetas` | Admin | Crear receta |
| PUT | `/recetas/:id` | Admin | Actualizar receta |
| DELETE | `/recetas/:id` | Admin | Eliminar receta |

### Usuarios
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/usuarios` | Admin | Listar usuarios |
| POST | `/usuarios` | Admin | Crear usuario |
| PUT | `/usuarios/:id` | Admin | Actualizar usuario |
| DELETE | `/usuarios/:id` | Admin | Eliminar usuario |

---

## 🧪 Pruebas con Postman

1. Abrir Postman → **Import** → seleccionar `BurritoFlowOS_Postman.json`
2. La colección incluye variables automáticas; el token JWT se guarda al hacer Login
3. Ejecutar en orden:
   - ① Login Administrador
   - ② GET Insumos
   - ③ POST Crear insumo
   - ④ GET Recetas
   - ⑤ POST Registrar venta
   - ⑥ GET Ventas

---

## 👥 Equipo

| Integrante | Rol |
|---|---|
| Julián Pulgarin | Desarrollo |
| Alejandro Zuluaga | Desarrollo |
| Juan Andrade | Desarrollo |
| Julian Arenas | Desarrollo |

**Docente:** Andrés Atehortua   
**Asignatura:** Programación distribuida y paralela
