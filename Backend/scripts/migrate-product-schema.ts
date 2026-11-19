import { pool } from '../src/config/db.js';

async function migrate() {
  console.log('[Supabase Migration]: Modificando columnas de la tabla productos...');

  // 1. Quitar NOT NULL a precio_costo para que sea opcional en la BD
  await pool.query(`ALTER TABLE productos ALTER COLUMN precio_costo DROP NOT NULL;`);
  console.log('✓ precio_costo ahora permite NULL');

  // 2. Quitar NOT NULL a codigo_producto y asignar default si no viene
  await pool.query(`ALTER TABLE productos ALTER COLUMN codigo_producto DROP NOT NULL;`);
  console.log('✓ codigo_producto ahora permite NULL');

  // 3. Quitar NOT NULL a descripcion y asignar default vacio
  await pool.query(`ALTER TABLE productos ALTER COLUMN descripcion DROP NOT NULL;`);
  await pool.query(`ALTER TABLE productos ALTER COLUMN descripcion SET DEFAULT '';`);
  console.log('✓ descripcion ahora permite NULL con default vacio');

  // 4. Crear trigger para autogenerar codigo_producto si viene vacio o null
  await pool.query(`
    CREATE OR REPLACE FUNCTION fn_autogenerar_codigo_producto()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.codigo_producto IS NULL OR trim(NEW.codigo_producto) = '' THEN
        NEW.codigo_producto := 'BTC-' || LPAD(NEW.id_producto::text, 6, '0');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_autogenerar_codigo_producto ON productos;
    CREATE TRIGGER trg_autogenerar_codigo_producto
    BEFORE INSERT ON productos
    FOR EACH ROW
    EXECUTE FUNCTION fn_autogenerar_codigo_producto();
  `);
  console.log('✓ Trigger fn_autogenerar_codigo_producto creado en Supabase');

  // 5. Verificar estado final de columnas
  const res = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'productos'
    ORDER BY ordinal_position;
  `);
  console.log('[Supabase]: Estado actualizado de columnas en "productos":');
  console.table(res.rows);

  await pool.end();
  console.log('[Supabase Migration]: Migracion completada exitosamente.');
}

migrate().catch((err) => {
  console.error('[Supabase Migration Error]:', err);
  process.exit(1);
});
