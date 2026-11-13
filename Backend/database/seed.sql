-- ======================================================
-- BUTTONCAT - SEED DATA INICIAL PARA SUPABASE POSTGRESQL
-- ======================================================

-- 1. Provincias
INSERT INTO "provincias" ("provincia") VALUES
('Ciudad Autónoma de Buenos Aires'),
('Buenos Aires'),
('Córdoba'),
('Santa Fe'),
('Mendoza')
ON CONFLICT DO NOTHING;

-- 2. Localidades
INSERT INTO "localidades" ("id_provincia", "localidad") VALUES
(1, 'Palermo'), (1, 'Recoleta'), (1, 'Caballito'), (1, 'Belgrano'), (1, 'San Telmo'), (1, 'Almagro'), (1, 'Villa Crespo'),
(2, 'La Plata'), (2, 'Quilmes'), (2, 'Morón'), (2, 'San Isidro'), (2, 'Vicente López'), (2, 'Mar del Plata'), (2, 'Bahía Blanca'),
(3, 'Córdoba Capital'), (3, 'Villa Carlos Paz'), (3, 'Río Cuarto'), (3, 'Alta Gracia'), (3, 'Villa María'),
(4, 'Rosario'), (4, 'Santa Fe Capital'), (4, 'Rafaela'), (4, 'Venado Tuerto'),
(5, 'Mendoza Capital'), (5, 'Godoy Cruz'), (5, 'San Rafael'), (5, 'Luján de Cuyo')
ON CONFLICT DO NOTHING;

-- 3. Métodos de Pago
INSERT INTO "metodos_pago" ("nombre_metodo_pago", "porcentaje_descuento", "activo", "datos_bancarios") VALUES
('Mercado Pago (Dinero en Cuenta / Tarjetas)', 0, true, 'CVU: 0000003100012345678901 - Alias: BUTTONCAT.MP'),
('Transferencia Bancaria (10% OFF)', 10, true, 'Banco Santander - CBU: 0720123488000034567890 - Alias: BUTTONCAT.OFICIAL'),
('Efectivo en Punto de Retiro (Palermo)', 5, true, 'Abono directo al retirar en showroom Buttoncat (Gorriti 4800, Palermo).')
ON CONFLICT DO NOTHING;

-- 4. Categorías de Producto
INSERT INTO "categorias" ("nombre_categoria", "precio_base", "color", "descripcion") VALUES
('LLAVEROS / PELUCHES', 15.00, 'bg-brand-pink text-white', 'Llaveros y peluches góticos artesanales confeccionados a mano.'),
('STICKERS', 12.00, 'bg-brand-orange text-white', 'Stickers de vinilo mate y holográficos impermeables.'),
('POSTERS', 18.00, 'bg-brand-yellow text-black', 'Posters e ilustraciones de alta resolución en papel brutalist.'),
('PINES', 10.50, 'bg-brand-cyan text-black', 'Pines metálicos y prendedores oscurecidos con doble cierre.'),
('ARITOS', 14.00, 'bg-brand-purple text-white', 'Aros y argollas de acero quirúrgico e inoxidable hipoalergénico.'),
('COLLARES', 25.00, 'bg-brand-pink text-white', 'Gargantillas y cadenas de capas múltiples con dijes alternativos.'),
('REMERAS', 32.00, 'bg-brand-yellow text-black', 'Remeras 100% algodón peinado estampadas con serigrafía.'),
('PINTURAS', 45.00, 'bg-brand-orange text-white', 'Obras y pinturas en lienzo originales hechas a mano.')
ON CONFLICT DO NOTHING;

-- 5. Estilos
INSERT INTO "estilos" ("estilo", "color") VALUES
('GOTH', 'bg-black text-white'),
('Y2K', 'bg-brand-pink text-white'),
('KAWAII', 'bg-brand-yellow text-black'),
('PUNK', 'bg-brand-orange text-white'),
('ROCK', 'bg-brand-purple text-white'),
('NEÓN', 'bg-brand-cyan text-black')
ON CONFLICT DO NOTHING;

-- 6. Etiquetas
INSERT INTO "etiquetas" ("nombre_etiqueta", "color") VALUES
('NUEVO', 'bg-brand-orange text-white'),
('TOP SALES', 'bg-brand-yellow text-black'),
('OFERTA', 'bg-brand-pink text-white'),
('EDICIÓN LIMITADA', 'bg-brand-purple text-white'),
('ARTESANAL', 'bg-brand-cyan text-black'),
('BESTSELLER', 'bg-brand-pink text-white')
ON CONFLICT DO NOTHING;

-- 7. Categorías de Gasto
INSERT INTO "categorias_gasto" ("nombre_categoria", "descripcion", "activo") VALUES
('INSUMOS Y MATERIA PRIMA', 'Telas, cadenas, tintas, resinas y vinilos', true),
('PACKAGING Y EMBALAJE', 'Bolsas, cajas, stickers de seguridad y papel seda', true),
('LOGÍSTICA Y ENVÍOS', 'Servicios de Andreani, Correo Argentino y cadetería', true),
('MARKETING Y PUBLICIDAD', 'Campañas en Meta Ads, Google Ads y colaboraciones', true),
('SERVICIOS GENERALES', 'Hosting, alquiler de taller, luz e internet', true)
ON CONFLICT DO NOTHING;

-- 8. Proveedores Base
INSERT INTO "proveedores" ("razon_social", "cuit", "telefono", "correo", "activo") VALUES
('Distribuidora Textil Quilmes S.A.', '30-71234567-8', '011-4253-8899', 'ventas@textilquilmes.com', true),
('Gráfica Sur Insumos Gráficos', '30-68912345-2', '011-4822-1144', 'pedidos@grafisur.com.ar', true),
('Herrajes & Cadenas Industriales', '30-55123987-1', '011-4952-3321', 'contacto@herrajescadenas.com', true)
ON CONFLICT DO NOTHING;

-- 9. Categorías de Premio
INSERT INTO "categorias_premio" ("categoria") VALUES
('DESCUENTOS EXCLUSIVOS'),
('PRODUCTOS DE EDICIÓN LIMITADA'),
('ENVÍO BONIFICADO'),
('MERCHANDISING Y REGALOS')
ON CONFLICT DO NOTHING;

