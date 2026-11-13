import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/buttoncat_db?schema=public';
const isRemote = connectionString.includes('supabase.com') || connectionString.includes('sslmode=require');
const pool = new pg.Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  console.log('[Seed] Iniciando carga de datos reales iniciales...');

  // 1. Provincias y Localidades de Argentina
  const provinciasData = [
    {
      provincia: 'Ciudad Autonoma de Buenos Aires',
      localidades: ['Palermo', 'Recoleta', 'Caballito', 'Belgrano', 'San Telmo', 'Almagro', 'Villa Crespo'],
    },
    {
      provincia: 'Buenos Aires',
      localidades: ['La Plata', 'Quilmes', 'Moron', 'San Isidro', 'Vicente Lopez', 'Mar del Plata', 'Bahia Blanca'],
    },
    {
      provincia: 'Cordoba',
      localidades: ['Cordoba Capital', 'Villa Carlos Paz', 'Rio Cuarto', 'Alta Gracia', 'Villa Maria'],
    },
    {
      provincia: 'Santa Fe',
      localidades: ['Rosario', 'Santa Fe Capital', 'Rafaela', 'Venado Tuerto'],
    },
    {
      provincia: 'Mendoza',
      localidades: ['Mendoza Capital', 'Godoy Cruz', 'San Rafael', 'Lujan de Cuyo'],
    },
  ];

  for (const prov of provinciasData) {
    let provRes = await pool.query(
      `SELECT id_provincia FROM provincias WHERE provincia = $1 LIMIT 1`,
      [prov.provincia]
    );

    let idProvincia: number;
    if (provRes.rows.length === 0) {
      const inserted = await pool.query(
        `INSERT INTO provincias (provincia) VALUES ($1) RETURNING id_provincia`,
        [prov.provincia]
      );
      idProvincia = inserted.rows[0].id_provincia;
    } else {
      idProvincia = provRes.rows[0].id_provincia;
    }

    for (const locName of prov.localidades) {
      const locRes = await pool.query(
        `SELECT id_localidad FROM localidades WHERE id_provincia = $1 AND localidad = $2 LIMIT 1`,
        [idProvincia, locName]
      );
      if (locRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO localidades (id_provincia, localidad) VALUES ($1, $2)`,
          [idProvincia, locName]
        );
      }
    }
  }
  console.log('[Seed] Provincias y localidades cargadas.');

  // 2. Metodos de Pago
  const metodosPago = [
    {
      nombreMetodoPago: 'Mercado Pago (Dinero en Cuenta / Tarjetas)',
      porcentajeDescuento: 0,
      activo: true,
      datosBancarios: 'CVU: 0000003100012345678901 - Alias: BUTTONCAT.MP',
    },
    {
      nombreMetodoPago: 'Transferencia Bancaria (10% OFF)',
      porcentajeDescuento: 10,
      activo: true,
      datosBancarios: 'Banco Santander - CBU: 0720123488000034567890 - Alias: BUTTONCAT.OFICIAL',
    },
    {
      nombreMetodoPago: 'Efectivo en Punto de Retiro (Palermo)',
      porcentajeDescuento: 5,
      activo: true,
      datosBancarios: 'Abono directo al retirar en showroom Buttoncat (Gorriti 4800, Palermo).',
    },
  ];

  for (const mp of metodosPago) {
    const existing = await pool.query(
      `SELECT id_metodo_pago FROM metodos_pago WHERE nombre_metodo_pago = $1 LIMIT 1`,
      [mp.nombreMetodoPago]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO metodos_pago (nombre_metodo_pago, porcentaje_descuento, activo, datos_bancarios)
         VALUES ($1, $2, $3, $4)`,
        [mp.nombreMetodoPago, mp.porcentajeDescuento, mp.activo, mp.datosBancarios]
      );
    }
  }
  console.log('[Seed] Metodos de pago cargados.');

  // 3. Categorias de Producto
  const categorias = [
    { nombreCategoria: 'LLAVEROS / PELUCHES', precioBase: 15.0, color: 'bg-brand-pink text-white', descripcion: 'Llaveros y peluches goticos artesanales confeccionados a mano.' },
    { nombreCategoria: 'STICKERS', precioBase: 12.0, color: 'bg-brand-orange text-white', descripcion: 'Stickers de vinilo mate y holograficos impermeables.' },
    { nombreCategoria: 'POSTERS', precioBase: 18.0, color: 'bg-brand-yellow text-black', descripcion: 'Posters e ilustraciones de alta resolucion en papel brutalist.' },
    { nombreCategoria: 'PINES', precioBase: 10.5, color: 'bg-brand-cyan text-black', descripcion: 'Pines metalicos y prendedores oscurecidos con doble cierre.' },
    { nombreCategoria: 'ARITOS', precioBase: 14.0, color: 'bg-brand-purple text-white', descripcion: 'Aros y argollas de acero quirurgico e inoxidable hipoalergenico.' },
    { nombreCategoria: 'COLLARES', precioBase: 25.0, color: 'bg-brand-pink text-white', descripcion: 'Gargantillas y cadenas de capas multiples con dijes alternativos.' },
    { nombreCategoria: 'REMERAS', precioBase: 32.0, color: 'bg-brand-yellow text-black', descripcion: 'Remeras 100% algodon peinado estampadas con serigrafia.' },
    { nombreCategoria: 'PINTURAS', precioBase: 45.0, color: 'bg-brand-orange text-white', descripcion: 'Obras y pinturas en lienzo originales hechas a mano.' },
  ];

  for (const cat of categorias) {
    await pool.query(
      `INSERT INTO categorias (nombre_categoria, precio_base, color, descripcion)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (nombre_categoria)
       DO UPDATE SET precio_base = EXCLUDED.precio_base, color = EXCLUDED.color, descripcion = EXCLUDED.descripcion`,
      [cat.nombreCategoria, cat.precioBase, cat.color, cat.descripcion]
    );
  }
  console.log('[Seed] Categorias de producto cargadas.');

  // 4. Estilos
  const estilos = [
    { estilo: 'GOTH', color: 'bg-black text-white' },
    { estilo: 'Y2K', color: 'bg-brand-pink text-white' },
    { estilo: 'KAWAII', color: 'bg-brand-yellow text-black' },
    { estilo: 'PUNK', color: 'bg-brand-orange text-white' },
    { estilo: 'ROCK', color: 'bg-brand-purple text-white' },
    { estilo: 'NEON', color: 'bg-brand-cyan text-black' },
  ];

  for (const est of estilos) {
    await pool.query(
      `INSERT INTO estilos (estilo, color)
       VALUES ($1, $2)
       ON CONFLICT (estilo)
       DO UPDATE SET color = EXCLUDED.color`,
      [est.estilo, est.color]
    );
  }
  console.log('[Seed] Estilos cargados.');

  // 5. Etiquetas
  const etiquetas = [
    { nombreEtiqueta: 'NUEVO', color: 'bg-brand-orange text-white' },
    { nombreEtiqueta: 'TOP SALES', color: 'bg-brand-yellow text-black' },
    { nombreEtiqueta: 'OFERTA', color: 'bg-brand-pink text-white' },
    { nombreEtiqueta: 'EDICION LIMITADA', color: 'bg-brand-purple text-white' },
    { nombreEtiqueta: 'ARTESANAL', color: 'bg-brand-cyan text-black' },
    { nombreEtiqueta: 'BESTSELLER', color: 'bg-brand-pink text-white' },
  ];

  for (const et of etiquetas) {
    await pool.query(
      `INSERT INTO etiquetas (nombre_etiqueta, color)
       VALUES ($1, $2)
       ON CONFLICT (nombre_etiqueta)
       DO UPDATE SET color = EXCLUDED.color`,
      [et.nombreEtiqueta, et.color]
    );
  }
  console.log('[Seed] Etiquetas cargadas.');

  // 6. Categorias de Gasto
  const categoriasGasto = [
    { nombreCategoria: 'INSUMOS Y MATERIA PRIMA', descripcion: 'Telas, cadenas, tintas, resinas y vinilos' },
    { nombreCategoria: 'PACKAGING Y EMBALAJE', descripcion: 'Bolsas, cajas, stickers de seguridad y papel seda' },
    { nombreCategoria: 'LOGISTICA Y ENVIOS', descripcion: 'Servicios de Andreani, Correo Argentino y cadeteria' },
    { nombreCategoria: 'MARKETING Y PUBLICIDAD', descripcion: 'Campanas en Meta Ads, Google Ads y colaboraciones' },
    { nombreCategoria: 'SERVICIOS GENERALES', descripcion: 'Hosting, alquiler de taller, luz e internet' },
  ];

  for (const cg of categoriasGasto) {
    const existing = await pool.query(
      `SELECT id_categoria_gasto FROM categorias_gasto WHERE nombre_categoria = $1 LIMIT 1`,
      [cg.nombreCategoria]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO categorias_gasto (nombre_categoria, descripcion) VALUES ($1, $2)`,
        [cg.nombreCategoria, cg.descripcion]
      );
    }
  }
  console.log('[Seed] Categorias de gasto cargadas.');

  // 7. Proveedores Base
  const proveedores = [
    { razonSocial: 'Distribuidora Textil Quilmes S.A.', cuit: '30-71234567-8', telefono: '011-4253-8899', correo: 'ventas@textilquilmes.com' },
    { razonSocial: 'Grafica Sur Insumos Graficos', cuit: '30-68912345-2', telefono: '011-4822-1144', correo: 'pedidos@grafisur.com.ar' },
    { razonSocial: 'Herrajes & Cadenas Industriales', cuit: '30-55123987-1', telefono: '011-4952-3321', correo: 'contacto@herrajescadenas.com' },
  ];

  for (const prov of proveedores) {
    const existing = await pool.query(
      `SELECT id_proveedor FROM proveedores WHERE razon_social = $1 LIMIT 1`,
      [prov.razonSocial]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO proveedores (razon_social, cuit, telefono, correo) VALUES ($1, $2, $3, $4)`,
        [prov.razonSocial, prov.cuit, prov.telefono, prov.correo]
      );
    }
  }
  console.log('[Seed] Proveedores cargados.');

  // 8. Categorias de Premio
  const categoriasPremio = [
    'DESCUENTOS EXCLUSIVOS',
    'PRODUCTOS DE EDICION LIMITADA',
    'ENVIO BONIFICADO',
    'MERCHANDISING Y REGALOS',
  ];

  for (const cp of categoriasPremio) {
    const existing = await pool.query(
      `SELECT id_categoria_premio FROM categorias_premio WHERE categoria = $1 LIMIT 1`,
      [cp]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO categorias_premio (categoria) VALUES ($1)`,
        [cp]
      );
    }
  }
  console.log('[Seed] Categorias de premio cargadas.');

  console.log('[Seed] Carga de datos reales completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
