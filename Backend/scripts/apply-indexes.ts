import { pool } from '../src/config/db.js';

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON productos (id_categoria);',
  'CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);',
  'CREATE INDEX IF NOT EXISTS idx_productos_canal_de_venta ON productos (canal_de_venta);',
  'CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos (created_at DESC);',

  'CREATE INDEX IF NOT EXISTS idx_variantes_id_producto ON variantes (id_producto);',
  'CREATE INDEX IF NOT EXISTS idx_variantes_activo ON variantes (activo);',
  'CREATE INDEX IF NOT EXISTS idx_variantes_sku ON variantes (sku);',

  'CREATE INDEX IF NOT EXISTS idx_opciones_variante_id_variante ON opciones_variante (id_variante);',
  'CREATE INDEX IF NOT EXISTS idx_opciones_variante_id_opcion ON opciones_variante (id_opcion_variacion);',

  'CREATE INDEX IF NOT EXISTS idx_imagenes_producto_id_producto ON imagenes_producto (id_producto);',

  'CREATE INDEX IF NOT EXISTS idx_producto_estilos_id_producto ON producto_estilos (id_producto);',
  'CREATE INDEX IF NOT EXISTS idx_producto_estilos_id_estilo ON producto_estilos (id_estilo);',

  'CREATE INDEX IF NOT EXISTS idx_producto_etiquetas_id_producto ON producto_etiquetas (id_producto);',
  'CREATE INDEX IF NOT EXISTS idx_producto_etiquetas_id_etiqueta ON producto_etiquetas (id_etiqueta);',

  'CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id_cliente ON pedidos_cliente (id_cliente);',
  'CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_estado ON pedidos_cliente (estado);',
  'CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_fecha_emision ON pedidos_cliente (fecha_emision DESC);',

  'CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id_pedido ON detalles_pedido (id_pedido);',
  'CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id_variante ON detalles_pedido (id_variante);',

  'CREATE INDEX IF NOT EXISTS idx_gastos_id_proveedor ON gastos (id_proveedor);',
  'CREATE INDEX IF NOT EXISTS idx_gastos_id_categoria_gasto ON gastos (id_categoria_gasto);',
  'CREATE INDEX IF NOT EXISTS idx_gastos_fecha_gasto ON gastos (fecha_gasto DESC);',

  'CREATE INDEX IF NOT EXISTS idx_premios_cliente_id_cliente ON premios_cliente (id_cliente);',
  'CREATE INDEX IF NOT EXISTS idx_domicilios_id_cliente ON domicilios (id_cliente);',
  'CREATE INDEX IF NOT EXISTS idx_resenas_producto_id_producto ON resenas_producto (id_producto);',
  'CREATE INDEX IF NOT EXISTS idx_resenas_producto_id_cliente ON resenas_producto (id_cliente);',
];

async function run() {
  console.log('[Indexes]: Creando indices de optimizacion en PostgreSQL...');
  for (const idxSql of indexes) {
    try {
      await pool.query(idxSql);
      const name = idxSql.split(' ')[5];
      console.log(`[Indexes]: Indice ${name} verificado/creado ✓`);
    } catch (err: any) {
      console.warn(`[Indexes]: Error al crear indice: ${err.message}`);
    }
  }
  console.log('[Indexes]: Todos los indices fueron procesados.');
  await pool.end();
}

run();
