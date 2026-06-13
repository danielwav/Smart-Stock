const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config();

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || '3306', 10),
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 2,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando la siembra de datos (seeding)...');

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.store.deleteMany({});

  console.log('Base de datos limpiada.');

  const stores = [
    {
      name: 'Tambo - Los Olivos',
      category: 'Snacks, Bebidas y más',
      rating: 4.9,
      deliveryTimeMin: 15,
      deliveryTimeMax: 20,
      distanceKm: 0.9,
      lat: -11.9902,
      lng: -77.0812,
      address: 'Av. Las Palmeras 3822, Los Olivos'
    },
    {
      name: 'Tambo - Huandoy',
      category: 'Snacks, Bebidas y más',
      rating: 4.5,
      deliveryTimeMin: 25,
      deliveryTimeMax: 30,
      distanceKm: 1.5,
      lat: -11.9792,
      lng: -77.0955,
      address: 'Av. Huandoy 2110, Los Olivos'
    },
    {
      name: 'Tambo - Antares',
      category: 'Snacks, Bebidas y más',
      rating: 4.7,
      deliveryTimeMin: 10,
      deliveryTimeMax: 15,
      distanceKm: 2.1,
      lat: -11.9950,
      lng: -77.0700,
      address: 'Av. Antares 120, Los Olivos'
    },
    {
      name: 'Tambo - Naranjal',
      category: 'Snacks, Bebidas y más',
      rating: 4.6,
      deliveryTimeMin: 18,
      deliveryTimeMax: 22,
      distanceKm: 3.5,
      lat: -11.9850,
      lng: -77.1100,
      address: 'Av. Naranjal 542, Los Olivos'
    }
  ];

  for (const store of stores) {
    await prisma.store.create({ data: store });
  }
  console.log(`${stores.length} tiendas creadas.`);

  const products = [
    // === BEBIDAS ===
    { name: 'Inca Kola 1.5L', category: 'Bebidas', subCategory: 'Gaseosa', stock: 20, price: 6.50, unit: '1.5L', description: 'La bebida de sabor nacional que combina con todo.', isRecommended: true, isBestSeller: true, imageKey: 'inca_kola_1_5l' },
    { name: 'San Mateo 600ml', category: 'Bebidas', subCategory: 'Agua', stock: 4, price: 1.80, unit: '600ml', description: 'Agua mineral de manantial sin gas.', isRecommended: false, isBestSeller: false, imageKey: 'san_mateo_600ml' },
    { name: 'Inca Kola 2.5L', category: 'Bebidas', subCategory: 'Gaseosa', stock: 20, price: 10.20, unit: '2.5L', description: 'La bebida del sabor nacional en tamaño familiar.', isRecommended: false, isBestSeller: false, imageKey: 'inca_kola_2_5l' },
    { name: 'Agua San Mateo Personal', category: 'Bebidas', subCategory: 'Agua', stock: 20, price: 1.80, unit: 'Personal', description: 'Agua de manantial San Mateo, ideal para llevar.', isRecommended: false, isBestSeller: false, imageKey: 'san_mateo_personal' },
    { name: 'Coca-Cola 1.5L', category: 'Bebidas', subCategory: 'Gaseosa', stock: 5, price: 7.00, unit: '1.5L', description: 'Coca-Cola original 1.5L bien helada.', isRecommended: false, isBestSeller: false, imageKey: 'coca_cola_1_5l' },
    { name: 'Sprite 1.5L', category: 'Bebidas', subCategory: 'Gaseosa', stock: 20, price: 6.50, unit: '1.5L', description: 'Sprite sabor limón 1.5L.', isRecommended: false, isBestSeller: false, imageKey: 'sprite_1_5l' },
    { name: 'Fanta Naranja 1.5L', category: 'Bebidas', subCategory: 'Gaseosa', stock: 20, price: 6.50, unit: '1.5L', description: 'Fanta sabor naranja 1.5L.', isRecommended: false, isBestSeller: false, imageKey: 'fanta_naranja_1_5l' },
    { name: 'Cusqueña Trigo 620ml', category: 'Bebidas', subCategory: 'Cerveza', stock: 20, price: 8.50, unit: '620ml', description: 'Cerveza Cusqueña de trigo, 620ml.', isRecommended: false, isBestSeller: true, imageKey: 'cusquena_trigo_620ml' },
    { name: 'Pilsen Callao 355ml', category: 'Bebidas', subCategory: 'Cerveza', stock: 20, price: 4.00, unit: '355ml', description: 'Cerveza Pilsen Callao lata 355ml.', isRecommended: false, isBestSeller: false, imageKey: 'pilsen_callao_355ml' },
    { name: 'Pulp Naranja 1L', category: 'Bebidas', subCategory: 'Jugo', stock: 2, price: 7.50, unit: '1L', description: 'Jugo Pulp naranja con pulpa 1L.', isRecommended: false, isBestSeller: false, imageKey: 'pulp_naranja_1l' },
    { name: 'Gloria Natural Naranja 1L', category: 'Bebidas', subCategory: 'Jugo', stock: 20, price: 5.50, unit: '1L', description: 'Jugo Gloria natural sabor naranja 1L.', isRecommended: false, isBestSeller: false, imageKey: 'gloria_natural_naranja_1l' },
    { name: 'Cielo 2L', category: 'Bebidas', subCategory: 'Agua', stock: 20, price: 4.00, unit: '2L', description: 'Agua Cielo purificada 2L.', isRecommended: false, isBestSeller: false, imageKey: 'cielo_2l' },

    // === COMBOS ===
    { name: 'Combo Futbolero', category: 'Combo', stock: 20, price: 25.00, unit: 'Pack', description: '6 latas Pilsen Callao + Papas Lays + Canchita Serranita. ¡Perfecto para el partido!', isRecommended: true, isBestSeller: true, imageKey: 'combo_futbolero' },
    { name: 'Combo Relax', category: 'Combo', stock: 20, price: 18.50, unit: 'Pack', description: '2 Inca Kola 1.5L + San Mateo 600ml + Snack Cuisine. Ideal para relajarse.', isRecommended: true, isBestSeller: false, imageKey: 'combo_relax' },
    { name: 'Combo Fiesta', category: 'Combo', stock: 20, price: 35.00, unit: 'Pack', description: '2 Four Loko Purple + Piqueos Cuisine + Papas Inka Chips. La fiesta asegurada.', isRecommended: false, isBestSeller: true, imageKey: 'combo_fiesta' },
    { name: 'Combo Dulce', category: 'Combo', stock: 20, price: 15.00, unit: 'Pack', description: 'Sublime Tabletón + Galletas Casino Pack + Yogurt Gloria Frutado. Para los amantes del dulce.', isRecommended: false, isBestSeller: false, imageKey: 'combo_dulce' },
    { name: 'Combo Refrescante', category: 'Combo', stock: 20, price: 12.00, unit: 'Pack', description: '2 Gaseosas 1.5L a elección + Agua Cielo 2L. Refrescante y económico.', isRecommended: false, isBestSeller: false, imageKey: 'combo_refrescante' },

    // === SNACKS ===
    { name: 'Galleta Casino Menta Black', category: 'Snacks', stock: 20, price: 3.20, unit: 'Menta Black', description: 'Galleta Casino sabor menta bañada en chocolate negro.', isRecommended: true, isBestSeller: false, imageKey: 'galleta_casino_menta_black' },
    { name: 'Sublime Sonrisa', category: 'Snacks', stock: 20, price: 2.50, unit: 'Barra de 40g', description: 'Barra de chocolate Sublime con maní crujiente.', isRecommended: true, isBestSeller: false, imageKey: 'sublime_sonrisa' },
    { name: 'Lays Clásicas 70g', category: 'Snacks', stock: 3, price: 2.00, unit: '70g', description: 'Papas fritas seleccionadas y crujientes con sal.', isRecommended: false, isBestSeller: false, imageKey: 'lays_clasicas_70g' },
    { name: 'Snack Cuisine', category: 'Snacks', stock: 20, price: 5.00, unit: '180g', description: 'Mix crujiente de papas, camotes y chifles.', isRecommended: false, isBestSeller: false, imageKey: 'snack_cuisine' },
    { name: 'Galletas Casino Menta Pack', category: 'Snacks', stock: 20, price: 4.50, unit: 'Pack de 6 unidades', description: 'Pack familiar de galletas Casino sabor menta.', isRecommended: false, isBestSeller: false, imageKey: 'galleta_casino_menta_pack' },
    { name: 'Papas Inka Chips con Sal de Mar', category: 'Snacks', stock: 20, price: 6.50, unit: 'Bolsa grande', description: 'Papas nativas fritas en aceite de girasol con sal de mar.', isRecommended: false, isBestSeller: true, imageKey: 'inka_chips_sal' },
    { name: 'Piqueos Cuisine', category: 'Snacks', stock: 20, price: 5.00, unit: 'Cuisine', description: 'Piqueo mix salado y crujiente de la línea Cuisine.', isRecommended: false, isBestSeller: false, imageKey: 'piqueos_cuisine' },

    // === OTRAS CATEGORÍAS ===
    { name: 'Yogurt Gloria Fresa', category: 'Lácteos', stock: 20, price: 3.50, unit: 'Envase personal', description: 'Yogurt batido Gloria sabor a fresa natural.', isRecommended: false, isBestSeller: false, imageKey: 'yogurt_gloria_fresa' },
    { name: 'Yogurt Gloria Frutado', category: 'Lácteos', stock: 20, price: 3.50, unit: 'Frutado', description: 'Yogurt batido con trozos de fruta Gloria.', isRecommended: false, isBestSeller: false, imageKey: 'yogurt_gloria_frutado' },
    { name: 'Donofrio Sandwich', category: 'Helados', stock: 20, price: 4.00, unit: 'Sandwich', description: 'Helado sandwich con galleta de chocolate y crema de vainilla.', isRecommended: false, isBestSeller: false, imageKey: 'donofrio_sandwich' },
    { name: 'Four Loko Purple', category: 'Tragos', stock: 20, price: 12.90, unit: 'Lata 473ml', description: 'Bebida premium con sabor refrescante a uva.', isRecommended: false, isBestSeller: false, imageKey: 'four_loko_purple' },
    { name: 'Chocolate Sublime Tabletón', category: 'Golosinas', stock: 20, price: 4.80, unit: 'Sublime Tabletón', description: 'Barra grande de chocolate con leche y maní tostado.', isRecommended: false, isBestSeller: false, imageKey: 'sublime_tableton' },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log(`${products.length} productos creados.`);

  const demoUser = await prisma.user.create({
    data: {
      name: 'Alex',
      lastname: 'Rivera Méndez',
      dni: '12345678X',
      phone: '+51 600 000 000',
      email: 'alex.rivera@example.com',
      password: process.env.DEMO_USER_PASSWORD || 'demo123',
      purchaseStreak: 80,
      isVerified: true,
      location: 'Av. Las Palmeras 3822, Los Olivos',
      lat: -11.9902,
      lng: -77.0812
    }
  });
  console.log('Usuario de prueba creado:', demoUser.email);

  console.log('Seeding terminado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
