// config/seed.js — Datos iniciales de prueba
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const Usuario = require('../models/Usuario');
const Insumo  = require('../models/Insumo');
const Receta  = require('../models/Receta');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🌱 Iniciando seed...');

  // Limpiar colecciones
  await Usuario.deleteMany({});
  await Insumo.deleteMany({});
  await Receta.deleteMany({});

  // ── Usuarios ──────────────────────────────
  const passwordAdmin = await bcrypt.hash('Admin123!', 10);
  const passwordCajero = await bcrypt.hash('Cajero123!', 10);

  const admin = await Usuario.create({
    nombre:        'Karen Botero',
    email:         'admin@burritoflowos.com',
    password_hash: passwordAdmin,
    rol:           'administrador'
  });

  await Usuario.create({
    nombre:        'Juan Andrade',
    email:         'cajero@burritoflowos.com',
    password_hash: passwordCajero,
    rol:           'cajero'
  });

  console.log('✅ Usuarios creados');

  // ── Insumos ───────────────────────────────
  const insumos = await Insumo.insertMany([
    { nombre: 'Pierna de cerdo',            cantidad_actual: 5000, unidad_medida: 'gr',  stock_minimo: 500  },
    { nombre: 'Tortilla de trigo grande',   cantidad_actual: 200,  unidad_medida: 'un',  stock_minimo: 20   },
    { nombre: 'Queso rallado',              cantidad_actual: 2000, unidad_medida: 'gr',  stock_minimo: 200  },
    { nombre: 'Frijoles negros',            cantidad_actual: 3000, unidad_medida: 'gr',  stock_minimo: 300  },
    { nombre: 'Aguacate',                   cantidad_actual: 30,   unidad_medida: 'un',  stock_minimo: 5    },
    { nombre: 'Crema de leche',             cantidad_actual: 1500, unidad_medida: 'ml',  stock_minimo: 200  },
    { nombre: 'Tomate',                     cantidad_actual: 20,   unidad_medida: 'un',  stock_minimo: 5    },
    { nombre: 'Cebolla morada',             cantidad_actual: 15,   unidad_medida: 'un',  stock_minimo: 3    },
    { nombre: 'Cilantro',                   cantidad_actual: 500,  unidad_medida: 'gr',  stock_minimo: 50   },
    { nombre: 'Limón',                      cantidad_actual: 40,   unidad_medida: 'un',  stock_minimo: 10   },
    { nombre: 'Palitos de maíz con queso',  cantidad_actual: 100,  unidad_medida: 'un',  stock_minimo: 20   },
    { nombre: 'Gaseosa 350ml',              cantidad_actual: 60,   unidad_medida: 'un',  stock_minimo: 12   }
  ]);

  console.log('✅ Insumos creados:', insumos.length);

  // ── Recetas ───────────────────────────────
  const map = {};
  insumos.forEach(i => { map[i.nombre] = i._id; });

  await Receta.insertMany([
    {
      nombre:      'Burrito Sabanero',
      precio:      12000,
      descripcion: 'Clásico burrito con pierna de cerdo, frijoles, queso y crema.',
      ingredientes: [
        { insumo: map['Pierna de cerdo'],          cantidad: 200, unidad: 'gr' },
        { insumo: map['Tortilla de trigo grande'], cantidad: 1,   unidad: 'un' },
        { insumo: map['Frijoles negros'],          cantidad: 100, unidad: 'gr' },
        { insumo: map['Queso rallado'],            cantidad: 50,  unidad: 'gr' },
        { insumo: map['Crema de leche'],           cantidad: 30,  unidad: 'ml' }
      ]
    },
    {
      nombre:      'Burrito Veggie',
      precio:      10000,
      descripcion: 'Burrito vegetariano con aguacate, tomate, frijoles y queso.',
      ingredientes: [
        { insumo: map['Tortilla de trigo grande'], cantidad: 1,   unidad: 'un' },
        { insumo: map['Aguacate'],                cantidad: 1,   unidad: 'un' },
        { insumo: map['Tomate'],                  cantidad: 1,   unidad: 'un' },
        { insumo: map['Frijoles negros'],         cantidad: 120, unidad: 'gr' },
        { insumo: map['Queso rallado'],           cantidad: 50,  unidad: 'gr' },
        { insumo: map['Cilantro'],                cantidad: 10,  unidad: 'gr' }
      ]
    },
    {
      nombre:      'Burrito Maicero',
      precio:      9000,
      descripcion: 'Burrito con palitos de maíz con queso, cerdo y limón.',
      ingredientes: [
        { insumo: map['Tortilla de trigo grande'],   cantidad: 1,   unidad: 'un' },
        { insumo: map['Pierna de cerdo'],            cantidad: 150, unidad: 'gr' },
        { insumo: map['Palitos de maíz con queso'], cantidad: 1,   unidad: 'un' },
        { insumo: map['Limón'],                     cantidad: 1,   unidad: 'un' },
        { insumo: map['Crema de leche'],            cantidad: 20,  unidad: 'ml' }
      ]
    }
  ]);

  console.log('✅ Recetas creadas');
  console.log('\n══════════════════════════════════════');
  console.log('  🌯  Seed completado exitosamente');
  console.log('  Admin:  admin@burritoflowos.com / Admin123!');
  console.log('  Cajero: cajero@burritoflowos.com / Cajero123!');
  console.log('══════════════════════════════════════\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
