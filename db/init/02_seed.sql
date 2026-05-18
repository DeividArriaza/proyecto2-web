-- =============================================================================
-- Seed Bubu's Bakery — repostería boutique especializada en brownies.
-- ≥25 registros por tabla (rúbrica I, 5 pts). Orden respeta dependencias FK.
-- Todo envuelto en una transacción: si un INSERT falla nada queda persistido.
-- Impuesto = 12% IVA Guatemala. Precios en quetzales (GTQ).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Categoria (25) — universo de repostería con foco en brownies (5 categorías)
-- -----------------------------------------------------------------------------
INSERT INTO Categoria (nombre, descripcion) VALUES
('Brownies Clásicos',         'Brownies tradicionales recién horneados'),
('Brownies Premium',          'Brownies de receta especial y porciones grandes'),
('Brownies Veganos',          'Brownies sin lácteos ni huevo'),
('Brownies Sin Azúcar',       'Brownies endulzados con stevia o eritritol'),
('Brownies Rellenos',         'Brownies con relleno de cremas, frutas o dulces'),
('Cupcakes',                  'Pastelitos individuales con frosting'),
('Muffins',                   'Panecillos dulces tipo americano'),
('Galletas',                  'Galletas artesanales horneadas en casa'),
('Cookies Rellenas',          'Cookies tipo NY style con relleno'),
('Pasteles',                  'Pasteles enteros para celebraciones'),
('Tartas',                    'Tartas dulces de frutas y cremas'),
('Cheesecakes',               'Pasteles de queso variados'),
('Macarrones',                'Macarrones franceses surtidos'),
('Donas',                     'Donas glaseadas y rellenas'),
('Cinnamon Rolls',            'Rollos de canela con glaseado'),
('Croissants Dulces',         'Croissants con chocolate, almendra y crema'),
('Pan Dulce',                 'Pan dulce tradicional guatemalteco'),
('Trufas',                    'Trufas de chocolate artesanales'),
('Chocolates',                'Bombones y barras de chocolate'),
('Bebidas Calientes',         'Café, chocolate caliente y tés'),
('Bebidas Frías',             'Frappés, smoothies y bebidas heladas'),
('Postres Fríos',             'Helados, mousses y postres refrigerados'),
('Repostería Sin Gluten',     'Productos aptos para celíacos'),
('Productos de Temporada',    'Repostería para fechas especiales'),
('Cajas de Regalo',           'Surtidos empacados para obsequiar');

-- -----------------------------------------------------------------------------
-- Marca (25) — líneas propias de Bubu's + marcas de insumos importados
-- -----------------------------------------------------------------------------
INSERT INTO Marca (nombre, descripcion) VALUES
('Bubu''s Original',          'Línea base de la casa'),
('Bubu''s Premium',           'Línea premium con ingredientes selectos'),
('Bubu''s Vegano',            'Línea 100% vegetal'),
('Bubu''s Sin Azúcar',        'Línea apta para diabéticos'),
('Bubu''s Kids',              'Línea infantil con colores y diseños divertidos'),
('Bubu''s Pro',               'Línea profesional para empresas y eventos'),
('Bubu''s Edición Limitada',  'Lanzamientos especiales y de temporada'),
('Bubu''s Fit',               'Bajos en calorías y altos en proteína'),
('Bubu''s Gourmet',           'Recetas de autor con técnica avanzada'),
('Hershey''s',                'Chocolate estadounidense'),
('Cadbury',                   'Chocolate británico'),
('Nestlé',                    'Multinacional de alimentos'),
('Ghirardelli',               'Chocolate premium estadounidense'),
('Lindt',                     'Chocolate suizo de alta gama'),
('Anchor',                    'Lácteos neozelandeses'),
('Sula',                      'Lácteos guatemaltecos'),
('Foremost',                  'Lácteos centroamericanos'),
('Ferrero',                   'Confitería italiana'),
('Toblerone',                 'Chocolate suizo con almendra y miel'),
('Milka',                     'Chocolate alpino con leche'),
('Oreo',                      'Galletas rellenas de crema'),
('Nutella',                   'Crema de avellanas y cacao'),
('Kraft',                     'Quesos y productos de repostería'),
('Domino',                    'Azúcares refinados y morenos'),
('Genérico',                  'Marca sin especificar para insumos varios');

-- -----------------------------------------------------------------------------
-- Rol (25) — adaptados al rubro de repostería
-- -----------------------------------------------------------------------------
INSERT INTO Rol (nombre, descripcion) VALUES
('Administrador',           'Control total del sistema'),
('Gerente General',         'Gestión global de la cadena'),
('Gerente Sucursal',        'Gestión de un local'),
('Supervisor Producción',   'Supervisión de turnos en cocina'),
('Pastelero Jefe',          'Líder del equipo de pastelería'),
('Pastelero',               'Elaboración de pasteles y postres'),
('Repostero',               'Especialista en repostería fina'),
('Decorador',               'Decoración de pasteles y brownies'),
('Hornero',                 'Operación de hornos y tiempos de cocción'),
('Asistente Cocina',        'Preparación de mise en place y limpieza'),
('Cajero',                  'Operación de caja y cobros'),
('Barista',                 'Preparación de bebidas calientes y frías'),
('Vendedor Mostrador',      'Atención al cliente en mostrador'),
('Repartidor',              'Entregas a domicilio y delivery'),
('Encargado Bodega',        'Control de inventario de insumos'),
('Encargado Compras',       'Gestión de proveedores y pedidos'),
('Contador',                'Gestión contable y fiscal'),
('Auditor',                 'Revisión y auditoría interna'),
('Marketing Digital',       'Estrategia digital y campañas'),
('Community Manager',       'Manejo de redes sociales'),
('Recepcionista',           'Atención al público en oficina central'),
('Limpieza',                'Mantenimiento y aseo de locales'),
('Seguridad',               'Vigilancia y prevención de pérdidas'),
('Practicante',             'Estudiante en práctica supervisada'),
('Soporte Técnico',         'Soporte al sistema POS y equipos');

-- -----------------------------------------------------------------------------
-- Sucursal (25) — franquicia Bubu's en expansión por Guatemala
-- -----------------------------------------------------------------------------
INSERT INTO Sucursal (nombre, direccion, telefono) VALUES
('Bubu''s Bakery',           'Sede Central, Paseo Cayalá L-15, Zona 16',        '2332-2001'),
('Bubu''s Oakland Mall',     'Diagonal 6 13-01, Zona 10',                       '2332-2002'),
('Bubu''s Pradera',          'Vista Hermosa I, 20 Calle 24-50, Zona 15',        '2332-2003'),
('Bubu''s Miraflores',       '21 Av 4-32, Zona 11',                             '2432-2004'),
('Bubu''s Tikal Futura',     'Calzada Roosevelt 22-43, Zona 11',                '2432-2005'),
('Bubu''s Plaza Fontabella', '4a Av 12-59, Zona 10',                            '2332-2006'),
('Bubu''s Antigua Centro',   '5a Av Norte 25, Antigua Guatemala',               '7832-2007'),
('Bubu''s Antigua Plaza',    '4a Calle Oriente 12, Antigua Guatemala',          '7832-2008'),
('Bubu''s Xela Pradera',     'Pradera Xela Local 18, Quetzaltenango',           '7732-2009'),
('Bubu''s Huehuetenango',    '5a Av 4-20, Zona 1, Huehue',                      '7732-2010'),
('Bubu''s Cobán',            '1a Calle 2-30, Zona 2, Cobán',                    '7932-2011'),
('Bubu''s Escuintla',        '4a Av 2-50, Escuintla',                           '7832-2012'),
('Bubu''s Mazatenango',      '7a Av 5-12, Zona 1, Maza',                        '7832-2013'),
('Bubu''s Retalhuleu',       '6a Av 3-30, Reu',                                 '7832-2014'),
('Bubu''s Jutiapa',          '2a Av 1-15, Jutiapa',                             '7832-2015'),
('Bubu''s Mixco',            '11 Av 0-30, San Cristóbal, Mixco',                '6632-2016'),
('Bubu''s Villa Nueva',      '4a Calle 2-50, Villa Nueva',                      '6632-2017'),
('Bubu''s San Cristóbal',    'Centro Comercial San Cristóbal Local 22, Mixco',  '6632-2018'),
('Bubu''s Carretera Salvador','Km 13.5 Carr a El Salvador',                     '6632-2019'),
('Bubu''s Aeropuerto',       'Aeropuerto La Aurora, Zona 13',                   '2332-2020'),
('Bubu''s Boutique Reforma', 'Av La Reforma 8-50, Zona 9',                      '2332-2021'),
('Bubu''s Móvil 1 (Truck)',  'Food truck rotativo zona 10/14/16',               '5511-2022'),
('Bubu''s Móvil 2 (Truck)',  'Food truck rotativo zona 4/9/15',                 '5511-2023'),
('Bubu''s Express Online',   'Centro de despacho — solo delivery',              '2332-2024'),
('Bubu''s Kiosko Hospital',  'Hospital Herrera Llerandi, Zona 10',              '2332-2025');

-- -----------------------------------------------------------------------------
-- MetodoPago (25) — incluye opciones digitales relevantes en Guatemala
-- -----------------------------------------------------------------------------
INSERT INTO MetodoPago (nombre) VALUES
('Efectivo'), ('Tarjeta Débito'), ('Tarjeta Crédito Visa'),
('Tarjeta Crédito MasterCard'), ('Tarjeta Crédito AmEx'),
('Transferencia Banrural'), ('Transferencia BI'), ('Transferencia G&T'),
('Transferencia BAC'), ('Transferencia Banco Industrial'),
('Cheque'), ('Visa Cuotas'), ('MasterCard Cuotas'),
('PayPal'), ('Apple Pay'), ('Google Pay'),
('Tigo Money'), ('Claro Pagos'), ('Wallet Bubu''s'),
('Crédito Empresarial'), ('Stripe'), ('MercadoPago'),
('Western Union'), ('Crédito Interno'), ('Vale de Regalo Bubu''s');

-- -----------------------------------------------------------------------------
-- Proveedor (25) — distribuidoras de insumos de repostería
-- -----------------------------------------------------------------------------
INSERT INTO Proveedor (nombre, nit, telefono, email, direccion) VALUES
('Molinos Modernos S.A.',           '1234567-1', '2232-3001', 'ventas@molinosmod.gt',   'Calzada Roosevelt 8-50 Z11'),
('Chocolatera Centroamericana',     '1234568-2', '2232-3002', 'pedidos@chococa.gt',     '6a Av 3-15 Z4'),
('Lácteos La Pradera',              '1234569-3', '2232-3003', 'ventas@lapradera.gt',    'Km 22 Carr al Pacífico'),
('Azucarera Santa Ana',             '1234570-4', '2232-3004', 'info@azsantana.gt',      'Escuintla, Carretera CA-9'),
('Empaques Repostería GT',          '1234571-5', '2232-3005', 'ventas@empgt.gt',        'Anillo Periférico 12-20'),
('Frutas del Pacífico',             '1234572-6', '2332-3006', 'compras@frutaspac.gt',   'Mercado La Terminal Z4'),
('Distribuidora Nestlé GT',         '1234573-7', '2332-3007', 'ventas@nestle.gt',       'Calzada Aguilar Batres 33'),
('Hershey''s Guatemala',            '1234574-8', '2332-3008', 'pedidos@hersheys.gt',    'Av Las Américas 9-05 Z13'),
('Café Antigua Trading',            '1234575-9', '2332-3009', 'ventas@cafeantigua.gt',  '5a Av Norte 30, Antigua'),
('Cremería Guatemalteca',           '1234576-K', '2332-3010', 'info@cremeria.gt',       'Calzada San Juan 40 Z7'),
('Importadora de Especias',         '1234577-1', '2432-3011', 'ventas@espeimport.gt',   '20 Calle 15-30 Z11'),
('Levaduras y Fermentos S.A.',      '1234578-2', '2432-3012', 'pedidos@levaduras.gt',   '6a Av 11-38 Z1'),
('Distribuidora Sula',              '1234579-3', '2432-3013', 'ventas@sula.gt',         '7a Av 14-15 Z4'),
('Productos Anchor GT',             '1234580-4', '2432-3014', 'info@anchor.gt',         'Av Petapa 45-50 Z12'),
('Frutos Secos del Valle',          '1234581-5', '2432-3015', 'contacto@fsvalle.gt',    'Km 17 Carr El Salvador'),
('Esencias y Saborizantes',         '1234582-6', '2632-3016', 'ventas@esencias.gt',     'Anillo Periférico 8-50'),
('Aceites Premium GT',              '1234583-7', '2632-3017', 'pedidos@aceitespre.gt',  'Boulevard Los Próceres 5'),
('Distribuidora Foremost',          '1234584-8', '2632-3018', 'info@foremost.gt',       '12 Calle 1-25 Z10'),
('Mayoreo Repostería Centro',       '1234585-9', '2632-3019', 'ventas@mayrepc.gt',      '9a Av 12-50 Z1'),
('Importadora Lindt',               '1234586-K', '2732-3020', 'contacto@lindt.gt',      'Av Reforma 15-45 Z9'),
('Granos y Cereales GT',            '1234587-1', '2732-3021', 'info@granosgt.gt',       'Calle Mariscal 3-22 Z11'),
('Decoraciones Comestibles',        '1234588-2', '2732-3022', 'ventas@decocom.gt',      '7a Av 20-15 Z14'),
('Empaques Eco GT',                 '1234589-3', '2732-3023', 'pedidos@empecogt.gt',    'Calzada San Juan 35'),
('Bebidas Embotelladas GT',         '1234590-4', '2732-3024', 'contacto@bebgt.gt',      '6a Av 8-50 Z1'),
('Distribuidora Ferrero CA',        '1234591-5', '2732-3025', 'ventas@ferrero.gt',      'Diagonal 12 3-20 Z10');

-- -----------------------------------------------------------------------------
-- Cliente (25) — mezcla con y sin NIT (CF)
-- -----------------------------------------------------------------------------
INSERT INTO Cliente (nombres, apellidos, nit, telefono, email, direccion) VALUES
('María',      'González López',        '987654-1', '5512-0001', 'maria.gonzalez@mail.gt',   '1a Av 2-30 Z1'),
('Juan',       'Pérez Hernández',       '987655-2', '5512-0002', 'juan.perez@mail.gt',       '2a Av 3-45 Z4'),
('Ana',        'Ramírez Soto',          '987656-3', '5512-0003', 'ana.ramirez@mail.gt',      '3a Av 5-10 Z10'),
('Luis',       'Morales Chávez',        NULL,       '5512-0004', 'luis.morales@mail.gt',     '4a Av 8-22 Z11'),
('Sofía',      'Castro Mendoza',        '987658-5', '5512-0005', 'sofia.castro@mail.gt',     '5a Av 10-15 Z13'),
('Pedro',      'Jiménez Pineda',        '987659-6', '5512-0006', 'pedro.jimenez@mail.gt',    '6a Av 12-30 Z14'),
('Lucía',      'Vásquez Ortiz',         NULL,       '5512-0007', 'lucia.vasquez@mail.gt',    '7a Av 15-40 Z15'),
('Carlos',     'Gómez Ruiz',            '987661-8', '5512-0008', 'carlos.gomez@mail.gt',     '8a Av 20-10 Z16'),
('Elena',      'Díaz Martínez',         '987662-9', '5512-0009', 'elena.diaz@mail.gt',       '9a Av 5-25 Z17'),
('Miguel',     'Reyes Aguilar',         NULL,       '5512-0010', 'miguel.reyes@mail.gt',     '10a Av 18-32 Z18'),
('Isabel',     'Flores Fuentes',        '987664-1', '5512-0011', 'isabel.flores@mail.gt',    '11a Av 3-48 Z1'),
('Diego',      'Herrera Cabrera',       '987665-2', '5512-0012', 'diego.herrera@mail.gt',    '12a Av 7-12 Z4'),
('Camila',     'Paredes Rivas',         '987666-3', '5512-0013', 'camila.paredes@mail.gt',   '13a Av 9-33 Z10'),
('Andrés',     'Ortega Bonilla',        NULL,       '5512-0014', 'andres.ortega@mail.gt',    '14a Av 11-18 Z11'),
('Valentina',  'Navarro Mejía',         '987668-5', '5512-0015', 'valentina.navarro@mail.gt','15a Av 13-29 Z13'),
('Sebastián',  'Ríos Escobar',          '987669-6', '5512-0016', 'sebastian.rios@mail.gt',   '16a Av 15-14 Z14'),
('Daniela',    'Contreras Molina',      '987670-7', '5512-0017', 'daniela.contreras@mail.gt','17a Av 17-25 Z15'),
('Mateo',      'Salazar Barrientos',    NULL,       '5512-0018', 'mateo.salazar@mail.gt',    '18a Av 19-37 Z16'),
('Paula',      'Vega Alfaro',           '987672-9', '5512-0019', 'paula.vega@mail.gt',       '19a Av 21-40 Z17'),
('Tomás',      'Espinoza Juárez',       '987673-K', '5512-0020', 'tomas.espinoza@mail.gt',   '20a Av 23-51 Z18'),
('Gabriela',   'Acosta Leiva',          '987674-1', '5512-0021', 'gabriela.acosta@mail.gt',  '21a Av 2-14 Z1'),
('Rodrigo',    'Cifuentes Gómez',       '987675-2', '5512-0022', 'rodrigo.cifuentes@mail.gt','22a Av 4-25 Z4'),
('Natalia',    'Quiñónez Arévalo',      '987676-3', '5512-0023', 'natalia.quinonez@mail.gt', '23a Av 6-37 Z10'),
('Javier',     'Solís Godoy',           NULL,       '5512-0024', 'javier.solis@mail.gt',     '24a Av 8-48 Z11'),
('Alejandra',  'Monterroso Batres',     '987678-5', '5512-0025', 'alejandra.monter@mail.gt', '25a Av 10-19 Z13');

-- -----------------------------------------------------------------------------
-- Producto (25) — 10 brownies estrella + 15 productos complementarios
-- Precios en GTQ realistas. Stock alto (200) para soportar ventas del seed.
-- -----------------------------------------------------------------------------
INSERT INTO Producto (sku, nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_marca) VALUES
('BRW-0001', 'Brownie Clásico',                'Brownie de chocolate tradicional, receta original',         30.00, 200, 50,  1,  1),
('BRW-0002', 'Brownie Triple Chocolate',       'Brownie con chocolate negro, leche y blanco',               45.00, 200, 30,  2,  2),
('BRW-0003', 'Brownie de Nuez',                'Brownie clásico con nuez de Castilla',                      35.00, 200, 40,  1,  1),
('BRW-0004', 'Brownie Cheesecake',             'Brownie con corazón de queso crema',                        50.00, 200, 25,  5,  9),
('BRW-0005', 'Brownie Vegano',                 'Brownie sin lácteos ni huevo, con cacao orgánico',          40.00, 200, 25,  3,  3),
('BRW-0006', 'Brownie Sin Azúcar',             'Brownie endulzado con eritritol, apto diabéticos',          40.00, 200, 25,  4,  4),
('BRW-0007', 'Brownie Oreo',                   'Brownie relleno y decorado con galletas Oreo',              45.00, 200, 30,  5, 21),
('BRW-0008', 'Brownie Caramelo Salado',        'Brownie premium con caramelo salado y flor de sal',         45.00, 200, 25,  2,  9),
('BRW-0009', 'Brownie Frambuesa',              'Brownie premium con coulis de frambuesa',                   45.00, 200, 25,  2,  2),
('BRW-0010', 'Brownie Nutella',                'Brownie relleno de Nutella derretida',                      50.00, 200, 30,  5, 22),
('CUP-0011', 'Cupcake Vainilla',               'Cupcake de vainilla con buttercream',                       18.00, 200, 60,  6,  1),
('CUP-0012', 'Cupcake Red Velvet',             'Cupcake red velvet con cream cheese frosting',              25.00, 200, 50,  6,  2),
('GAL-0013', 'Galleta Chispas Chocolate',      'Galleta artesanal con chispas de chocolate',                12.00, 200, 100, 8,  1),
('COK-0014', 'Cookie Rellena Nutella',         'Cookie NY style rellena de Nutella',                        22.00, 200, 50,  9, 22),
('CHK-0015', 'Cheesecake New York (porción)',  'Porción individual de cheesecake estilo NY',                75.00, 200, 30, 12,  9),
('TAR-0016', 'Tarta de Manzana',               'Tarta entera 8 porciones, manzana caramelizada',           250.00, 200,  8, 11,  1),
('MAC-0017', 'Macarrones Surtidos (caja 6)',   'Caja con 6 macarrones franceses surtidos',                 120.00, 200, 20, 13,  2),
('DON-0018', 'Dona Glaseada',                  'Dona clásica glaseada azucarada',                           15.00, 200, 80, 14,  1),
('CIN-0019', 'Cinnamon Roll',                  'Rollo de canela con glaseado de queso crema',               25.00, 200, 60, 15,  1),
('TRU-0020', 'Trufa de Chocolate',             'Trufa artesanal hecha con chocolate Lindt',                  8.00, 200, 150,18, 14),
('CAF-0021', 'Café Americano',                 'Café de altura, taza 12 oz',                                18.00, 200, 200,20, 25),
('FRP-0022', 'Frappé de Brownie',              'Frappé con trozos de brownie y crema',                      35.00, 200, 80, 21,  1),
('BSG-0023', 'Brownie Sin Gluten',             'Brownie sin gluten con harina de almendra',                 50.00, 200, 25, 23,  4),
('CAJ-0024', 'Caja Regalo San Valentín',       'Caja con 6 brownies premium, edición limitada',            220.00, 200, 15, 25,  7),
('CUP-0025', 'Cupcake Kids Arcoiris',          'Cupcake de vainilla con frosting multicolor',               25.00, 200, 50,  6,  5);

-- -----------------------------------------------------------------------------
-- Empleado (25) — password_hash es bcrypt de 'demo123' para todos los seeds.
-- id_rol e id_sucursal rotan 1..25 (empleado i → rol i, sucursal i).
-- -----------------------------------------------------------------------------
INSERT INTO Empleado (nombres, apellidos, email, telefono, username, password_hash, fecha_ingreso, id_rol, id_sucursal) VALUES
('Ericka',     'Sandoval',              'ericka@bubus.gt',              '5511-0001', 'ericka',      '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-01-15',  1,  1),
('Carmen',     'Barrios Escobar',       'carmen.barrios@bubus.gt',      '5511-0002', 'cbarrios',    '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-02-01',  2,  2),
('Fernando',   'Coronado Solís',        'fernando.coronado@bubus.gt',   '5511-0003', 'fcoronado',   '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-02-15',  3,  3),
('Silvia',     'Delgado Ramos',         'silvia.delgado@bubus.gt',      '5511-0004', 'sdelgado',    '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-03-01',  4,  4),
('Marco',      'Estrada López',         'marco.estrada@bubus.gt',       '5511-0005', 'mestrada',    '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-03-15',  5,  5),
('Patricia',   'Figueroa Cano',         'patricia.figueroa@bubus.gt',   '5511-0006', 'pfigueroa',   '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-04-01',  6,  6),
('Ricardo',    'Guerrero Pinto',        'ricardo.guerrero@bubus.gt',    '5511-0007', 'rguerrero',   '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-04-15',  7,  7),
('Lorena',     'Hurtado Méndez',        'lorena.hurtado@bubus.gt',      '5511-0008', 'lhurtado',    '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-05-01',  8,  8),
('Andrés',     'Iglesias Soto',         'andres.iglesias@bubus.gt',     '5511-0009', 'aiglesias',   '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-05-15',  9,  9),
('Beatriz',    'Juárez Cortez',         'beatriz.juarez@bubus.gt',      '5511-0010', 'bjuarez',     '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-06-01',  10, 10),
('Óscar',      'Kuc Xol',               'oscar.kuc@bubus.gt',           '5511-0011', 'okuc',        '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-06-15',  11, 11),
('Rosa',       'López Marroquín',       'rosa.lopez@bubus.gt',          '5511-0012', 'rlopez',      '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-07-01',  12, 12),
('Jorge',      'Monzón Paniagua',       'jorge.monzon@bubus.gt',        '5511-0013', 'jmonzon',     '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-07-15',  13, 13),
('Verónica',   'Núñez Aldana',          'veronica.nunez@bubus.gt',      '5511-0014', 'vnunez',      '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-08-01',  14, 14),
('Edgar',      'Ochoa Valle',           'edgar.ochoa@bubus.gt',         '5511-0015', 'eochoa',      '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-08-15',  15, 15),
('Mónica',     'Pacheco Lemus',         'monica.pacheco@bubus.gt',      '5511-0016', 'mpacheco',    '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-09-01',  16, 16),
('Humberto',   'Quevedo Rayo',          'humberto.quevedo@bubus.gt',    '5511-0017', 'hquevedo',    '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-09-15',  17, 17),
('Gloria',     'Rodríguez Tello',       'gloria.rodriguez@bubus.gt',    '5511-0018', 'grodriguez',  '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-10-01',  18, 18),
('Alberto',    'Sandoval Urrutia',      'alberto.sandoval@bubus.gt',    '5511-0019', 'asandoval',   '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-10-15',  19, 19),
('Claudia',    'Toledo Véliz',          'claudia.toledo@bubus.gt',      '5511-0020', 'ctoledo',     '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-11-01',  20, 20),
('Mauricio',   'Urrea Zamora',          'mauricio.urrea@bubus.gt',      '5511-0021', 'murrea',      '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-11-15',  21, 21),
('Nancy',      'Vivar Argueta',         'nancy.vivar@bubus.gt',         '5511-0022', 'nvivar',      '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-12-01',  22, 22),
('Francisco',  'Wong Chang',            'francisco.wong@bubus.gt',      '5511-0023', 'fwong',       '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2024-12-15',  23, 23),
('Alicia',     'Yax Coc',               'alicia.yax@bubus.gt',          '5511-0024', 'ayax',        '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2025-01-01',  24, 24),
('David',      'Zepeda Ramírez',        'david.zepeda@bubus.gt',        '5511-0025', 'dzepeda',     '$2b$10$ZoBfOfpBNnBLgYRUr4IBcOKV.eYP4MJdyItAeOukioSS3kiN4Yv6i', '2025-01-15',  25, 25);

-- -----------------------------------------------------------------------------
-- CompraProveedor (25) — pedidos de insumos a proveedores
-- Patrón seed: compras 1..5 con 2 detalles (subtotal 2000, IVA 240, total 2240)
--              compras 6..25 con 1 detalle (subtotal 1000, IVA 120, total 1120)
-- -----------------------------------------------------------------------------
INSERT INTO CompraProveedor (fecha, numero_factura, subtotal, impuesto, total, id_proveedor, id_empleado, id_sucursal) VALUES
('2025-01-05 09:00:00', 'FC-0001', 2000.00, 240.00, 2240.00,  1,  1,  1),
('2025-01-06 09:00:00', 'FC-0002', 2000.00, 240.00, 2240.00,  2,  2,  2),
('2025-01-07 09:00:00', 'FC-0003', 2000.00, 240.00, 2240.00,  3,  3,  3),
('2025-01-08 09:00:00', 'FC-0004', 2000.00, 240.00, 2240.00,  4,  4,  4),
('2025-01-09 09:00:00', 'FC-0005', 2000.00, 240.00, 2240.00,  5,  5,  5),
('2025-01-10 09:00:00', 'FC-0006', 1000.00, 120.00, 1120.00,  6,  6,  6),
('2025-01-11 09:00:00', 'FC-0007', 1000.00, 120.00, 1120.00,  7,  7,  7),
('2025-01-12 09:00:00', 'FC-0008', 1000.00, 120.00, 1120.00,  8,  8,  8),
('2025-01-13 09:00:00', 'FC-0009', 1000.00, 120.00, 1120.00,  9,  9,  9),
('2025-01-14 09:00:00', 'FC-0010', 1000.00, 120.00, 1120.00, 10, 10, 10),
('2025-01-15 09:00:00', 'FC-0011', 1000.00, 120.00, 1120.00, 11, 11, 11),
('2025-01-16 09:00:00', 'FC-0012', 1000.00, 120.00, 1120.00, 12, 12, 12),
('2025-01-17 09:00:00', 'FC-0013', 1000.00, 120.00, 1120.00, 13, 13, 13),
('2025-01-18 09:00:00', 'FC-0014', 1000.00, 120.00, 1120.00, 14, 14, 14),
('2025-01-19 09:00:00', 'FC-0015', 1000.00, 120.00, 1120.00, 15, 15, 15),
('2025-01-20 09:00:00', 'FC-0016', 1000.00, 120.00, 1120.00, 16, 16, 16),
('2025-01-21 09:00:00', 'FC-0017', 1000.00, 120.00, 1120.00, 17, 17, 17),
('2025-01-22 09:00:00', 'FC-0018', 1000.00, 120.00, 1120.00, 18, 18, 18),
('2025-01-23 09:00:00', 'FC-0019', 1000.00, 120.00, 1120.00, 19, 19, 19),
('2025-01-24 09:00:00', 'FC-0020', 1000.00, 120.00, 1120.00, 20, 20, 20),
('2025-01-25 09:00:00', 'FC-0021', 1000.00, 120.00, 1120.00, 21, 21, 21),
('2025-01-26 09:00:00', 'FC-0022', 1000.00, 120.00, 1120.00, 22, 22, 22),
('2025-01-27 09:00:00', 'FC-0023', 1000.00, 120.00, 1120.00, 23, 23, 23),
('2025-01-28 09:00:00', 'FC-0024', 1000.00, 120.00, 1120.00, 24, 24, 24),
('2025-01-29 09:00:00', 'FC-0025', 1000.00, 120.00, 1120.00, 25, 25, 25);

-- -----------------------------------------------------------------------------
-- DetalleCompra (30) — 25 principales (1 por compra) + 5 extras en compras 1..5.
-- Costo unitario uniforme 100 para mantener la aritmética del seed limpia.
-- -----------------------------------------------------------------------------
INSERT INTO DetalleCompra (id_compra, id_producto, cantidad, costo_unitario, subtotal) VALUES
( 1,  1, 10, 100.00, 1000.00),
( 2,  2, 10, 100.00, 1000.00),
( 3,  3, 10, 100.00, 1000.00),
( 4,  4, 10, 100.00, 1000.00),
( 5,  5, 10, 100.00, 1000.00),
( 6,  6, 10, 100.00, 1000.00),
( 7,  7, 10, 100.00, 1000.00),
( 8,  8, 10, 100.00, 1000.00),
( 9,  9, 10, 100.00, 1000.00),
(10, 10, 10, 100.00, 1000.00),
(11, 11, 10, 100.00, 1000.00),
(12, 12, 10, 100.00, 1000.00),
(13, 13, 10, 100.00, 1000.00),
(14, 14, 10, 100.00, 1000.00),
(15, 15, 10, 100.00, 1000.00),
(16, 16, 10, 100.00, 1000.00),
(17, 17, 10, 100.00, 1000.00),
(18, 18, 10, 100.00, 1000.00),
(19, 19, 10, 100.00, 1000.00),
(20, 20, 10, 100.00, 1000.00),
(21, 21, 10, 100.00, 1000.00),
(22, 22, 10, 100.00, 1000.00),
(23, 23, 10, 100.00, 1000.00),
(24, 24, 10, 100.00, 1000.00),
(25, 25, 10, 100.00, 1000.00),
-- Extras: segundo detalle en compras 1..5 con producto "espejo" (UNIQUE compra+producto).
( 1, 25, 10, 100.00, 1000.00),
( 2, 24, 10, 100.00, 1000.00),
( 3, 23, 10, 100.00, 1000.00),
( 4, 22, 10, 100.00, 1000.00),
( 5, 21, 10, 100.00, 1000.00);

-- -----------------------------------------------------------------------------
-- Venta (25) — ventas 1..15 con cliente registrado, 16..25 mostrador (CF)
-- -----------------------------------------------------------------------------
INSERT INTO Venta (fecha, numero_factura, subtotal, impuesto, total, id_cliente, id_empleado, id_sucursal, id_metodo_pago) VALUES
('2025-02-05 10:00:00', 'FV-0001', 2000.00, 240.00, 2240.00,  1,  1,  1,  1),
('2025-02-06 10:00:00', 'FV-0002', 2000.00, 240.00, 2240.00,  2,  2,  2,  2),
('2025-02-07 10:00:00', 'FV-0003', 2000.00, 240.00, 2240.00,  3,  3,  3,  3),
('2025-02-08 10:00:00', 'FV-0004', 2000.00, 240.00, 2240.00,  4,  4,  4,  4),
('2025-02-09 10:00:00', 'FV-0005', 2000.00, 240.00, 2240.00,  5,  5,  5,  5),
('2025-02-10 10:00:00', 'FV-0006', 1000.00, 120.00, 1120.00,  6,  6,  6,  6),
('2025-02-11 10:00:00', 'FV-0007', 1000.00, 120.00, 1120.00,  7,  7,  7,  7),
('2025-02-12 10:00:00', 'FV-0008', 1000.00, 120.00, 1120.00,  8,  8,  8,  8),
('2025-02-13 10:00:00', 'FV-0009', 1000.00, 120.00, 1120.00,  9,  9,  9,  9),
('2025-02-14 10:00:00', 'FV-0010', 1000.00, 120.00, 1120.00, 10, 10, 10, 10),
('2025-02-15 10:00:00', 'FV-0011', 1000.00, 120.00, 1120.00, 11, 11, 11, 11),
('2025-02-16 10:00:00', 'FV-0012', 1000.00, 120.00, 1120.00, 12, 12, 12, 12),
('2025-02-17 10:00:00', 'FV-0013', 1000.00, 120.00, 1120.00, 13, 13, 13, 13),
('2025-02-18 10:00:00', 'FV-0014', 1000.00, 120.00, 1120.00, 14, 14, 14, 14),
('2025-02-19 10:00:00', 'FV-0015', 1000.00, 120.00, 1120.00, 15, 15, 15, 15),
-- Mostrador (sin cliente):
('2025-02-20 10:00:00', 'FV-0016', 1000.00, 120.00, 1120.00, NULL, 16, 16, 16),
('2025-02-21 10:00:00', 'FV-0017', 1000.00, 120.00, 1120.00, NULL, 17, 17, 17),
('2025-02-22 10:00:00', 'FV-0018', 1000.00, 120.00, 1120.00, NULL, 18, 18, 18),
('2025-02-23 10:00:00', 'FV-0019', 1000.00, 120.00, 1120.00, NULL, 19, 19, 19),
('2025-02-24 10:00:00', 'FV-0020', 1000.00, 120.00, 1120.00, NULL, 20, 20, 20),
('2025-02-25 10:00:00', 'FV-0021', 1000.00, 120.00, 1120.00, NULL, 21, 21, 21),
('2025-02-26 10:00:00', 'FV-0022', 1000.00, 120.00, 1120.00, NULL, 22, 22, 22),
('2025-02-27 10:00:00', 'FV-0023', 1000.00, 120.00, 1120.00, NULL, 23, 23, 23),
('2025-02-28 10:00:00', 'FV-0024', 1000.00, 120.00, 1120.00, NULL, 24, 24, 24),
('2025-03-01 10:00:00', 'FV-0025', 1000.00, 120.00, 1120.00, NULL, 25, 25, 25);

-- -----------------------------------------------------------------------------
-- DetalleVenta (30) — 25 principales + 5 extras (en ventas 1..5).
-- precio_unitario es snapshot al momento de la venta.
-- -----------------------------------------------------------------------------
INSERT INTO DetalleVenta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
( 1,  1, 10, 100.00, 1000.00),
( 2,  2, 10, 100.00, 1000.00),
( 3,  3, 10, 100.00, 1000.00),
( 4,  4, 10, 100.00, 1000.00),
( 5,  5, 10, 100.00, 1000.00),
( 6,  6, 10, 100.00, 1000.00),
( 7,  7, 10, 100.00, 1000.00),
( 8,  8, 10, 100.00, 1000.00),
( 9,  9, 10, 100.00, 1000.00),
(10, 10, 10, 100.00, 1000.00),
(11, 11, 10, 100.00, 1000.00),
(12, 12, 10, 100.00, 1000.00),
(13, 13, 10, 100.00, 1000.00),
(14, 14, 10, 100.00, 1000.00),
(15, 15, 10, 100.00, 1000.00),
(16, 16, 10, 100.00, 1000.00),
(17, 17, 10, 100.00, 1000.00),
(18, 18, 10, 100.00, 1000.00),
(19, 19, 10, 100.00, 1000.00),
(20, 20, 10, 100.00, 1000.00),
(21, 21, 10, 100.00, 1000.00),
(22, 22, 10, 100.00, 1000.00),
(23, 23, 10, 100.00, 1000.00),
(24, 24, 10, 100.00, 1000.00),
(25, 25, 10, 100.00, 1000.00),
( 1, 25, 10, 100.00, 1000.00),
( 2, 24, 10, 100.00, 1000.00),
( 3, 23, 10, 100.00, 1000.00),
( 4, 22, 10, 100.00, 1000.00),
( 5, 21, 10, 100.00, 1000.00);

-- -----------------------------------------------------------------------------
-- MovimientoStock (30) — exclusive arc:
--   ENTRADA: id_compra OBLIGATORIO, id_venta NULL, cantidad > 0
--   SALIDA:  id_venta OBLIGATORIO, id_compra NULL, cantidad > 0
--   AJUSTE:  ambos NULL, cantidad <> 0 (puede ser negativo)
-- -----------------------------------------------------------------------------
INSERT INTO MovimientoStock (fecha, tipo, cantidad, stock_resultante, motivo, id_producto, id_empleado, id_sucursal, id_compra, id_venta) VALUES
('2025-01-05 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0001',  1,  1,  1,  1, NULL),
('2025-01-06 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0002',  2,  2,  2,  2, NULL),
('2025-01-07 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0003',  3,  3,  3,  3, NULL),
('2025-01-08 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0004',  4,  4,  4,  4, NULL),
('2025-01-09 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0005',  5,  5,  5,  5, NULL),
('2025-01-10 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0006',  6,  6,  6,  6, NULL),
('2025-01-11 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0007',  7,  7,  7,  7, NULL),
('2025-01-12 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0008',  8,  8,  8,  8, NULL),
('2025-01-13 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0009',  9,  9,  9,  9, NULL),
('2025-01-14 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0010', 10, 10, 10, 10, NULL),
('2025-01-15 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0011', 11, 11, 11, 11, NULL),
('2025-01-16 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0012', 12, 12, 12, 12, NULL),
('2025-01-17 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0013', 13, 13, 13, 13, NULL),
('2025-01-18 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0014', 14, 14, 14, 14, NULL),
('2025-01-19 09:30:00', 'ENTRADA', 10, 210, 'Ingreso por compra FC-0015', 15, 15, 15, 15, NULL),
('2025-02-05 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0001',    1,  1,  1, NULL,  1),
('2025-02-06 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0002',    2,  2,  2, NULL,  2),
('2025-02-07 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0003',    3,  3,  3, NULL,  3),
('2025-02-08 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0004',    4,  4,  4, NULL,  4),
('2025-02-09 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0005',    5,  5,  5, NULL,  5),
('2025-02-10 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0006',    6,  6,  6, NULL,  6),
('2025-02-11 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0007',    7,  7,  7, NULL,  7),
('2025-02-12 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0008',    8,  8,  8, NULL,  8),
('2025-02-13 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0009',    9,  9,  9, NULL,  9),
('2025-02-14 10:30:00', 'SALIDA',  10, 200, 'Salida por venta FV-0010',   10, 10, 10, NULL, 10),
('2025-03-02 11:00:00', 'AJUSTE',  -3, 197, 'Ajuste por conteo físico: faltante',  1,  1,  1, NULL, NULL),
('2025-03-03 11:00:00', 'AJUSTE',   5, 205, 'Ajuste por devolución interna',       2,  2,  2, NULL, NULL),
('2025-03-04 11:00:00', 'AJUSTE',  -2, 198, 'Ajuste por merma (producto dañado)',  3,  3,  3, NULL, NULL),
('2025-03-05 11:00:00', 'AJUSTE',  -1, 199, 'Ajuste por producto vencido',         4,  4,  4, NULL, NULL),
('2025-03-06 11:00:00', 'AJUSTE',   4, 204, 'Ajuste por corrección de conteo',     5,  5,  5, NULL, NULL);

COMMIT;

-- Conteo rápido de verificación (visible en logs al bootear):
SELECT 'Categoria: '       || COUNT(*) AS conteo FROM Categoria
UNION ALL SELECT 'Marca: '           || COUNT(*) FROM Marca
UNION ALL SELECT 'Rol: '             || COUNT(*) FROM Rol
UNION ALL SELECT 'Sucursal: '        || COUNT(*) FROM Sucursal
UNION ALL SELECT 'MetodoPago: '      || COUNT(*) FROM MetodoPago
UNION ALL SELECT 'Proveedor: '       || COUNT(*) FROM Proveedor
UNION ALL SELECT 'Cliente: '         || COUNT(*) FROM Cliente
UNION ALL SELECT 'Producto: '        || COUNT(*) FROM Producto
UNION ALL SELECT 'Empleado: '        || COUNT(*) FROM Empleado
UNION ALL SELECT 'CompraProveedor: ' || COUNT(*) FROM CompraProveedor
UNION ALL SELECT 'DetalleCompra: '   || COUNT(*) FROM DetalleCompra
UNION ALL SELECT 'Venta: '           || COUNT(*) FROM Venta
UNION ALL SELECT 'DetalleVenta: '    || COUNT(*) FROM DetalleVenta
UNION ALL SELECT 'MovimientoStock: ' || COUNT(*) FROM MovimientoStock;
