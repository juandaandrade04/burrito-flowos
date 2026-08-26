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

### 5. Iniciar el servidor

```bash
npm start          # producción
npm run dev        # desarrollo con auto-reload (nodemon)
```

### 6. Abrir la aplicación

| Interfaz | URL |
|---|---|
| Frontend (login) | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard.html |
| API base | http://localhost:3000/api/v1/ |

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
│   ├── InsumoController.js
│   ├── RecetaController.js
│   ├── VentaController.js
│   └── UsuarioController.js
│
├── routes/
│   ├── auth.routes.js
│   ├── insumos.routes.js
│   ├── recetas.routes.js
│   ├── ventas.routes.js
│   └── usuarios.routes.js
│
├── middlewares/
│   ├── verifyToken.js         # Autenticación JWT
│   ├── checkRole.js           # Control de roles
│   └── errorHandler.js        # Manejo centralizado de errores
│
├── frontend/
│   ├── index.html             # Login
│   └── dashboard.html         # Aplicación principal
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

### Insumos
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/insumos` | Admin/Cajero | Listar insumos (soporta `?nombre=` y `?alerta=true`) |
| GET | `/insumos/:id` | Admin/Cajero | Obtener insumo |
| POST | `/insumos` | Admin | Crear insumo |
| PUT | `/insumos/:id` | Admin | Actualizar insumo |
| DELETE | `/insumos/:id` | Admin | Eliminar insumo (soft delete) |

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
| Karen Botero Sánchez | Desarrollo |
| Mariana Amaya | Desarrollo |
| Juan Andrade | Desarrollo |

**Docente:** Andrés Felipe González Orozco  
**Asignatura:** Computación Orientada a Servicios
