import { query, withTransaction } from '../../config/db.js';

export interface CreateCategoryInput {
  nombreCategoria: string;
  precioBase?: number;
  color?: string;
  descripcion?: string;
  opcionIds?: number[];
}

export interface UpdateCategoryInput {
  nombreCategoria?: string;
  precioBase?: number;
  color?: string;
  descripcion?: string;
  opcionIds?: number[];
}

export class CategoryService {
  static async getAll() {
    const sql = `
      SELECT 
        c.id_categoria AS "idCategoria",
        c.nombre_categoria AS "nombreCategoria",
        c.precio_base AS "precioBase",
        c.color,
        c.descripcion,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        json_build_object(
          'productos', (SELECT COUNT(*)::int FROM productos pr WHERE pr.id_categoria = c.id_categoria)
        ) AS "_count",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idCategoria', oc.id_categoria,
                'idOpcionVariacion', oc.id_opcion_variacion,
                'opcionVariacion', json_build_object(
                  'idOpcionVariacion', ov.id_opcion_variacion,
                  'idVariacion', ov.id_variacion,
                  'nombreOpcion', ov.nombre_opcion,
                  'precioExtra', ov.precio_extra,
                  'variacion', json_build_object(
                    'idVariacion', v.id_variacion,
                    'nombreVariacion', v.nombre_variacion
                  )
                )
              )
            )
            FROM opciones_categoria oc
            JOIN opciones_variacion ov ON ov.id_opcion_variacion = oc.id_opcion_variacion
            JOIN variaciones v ON v.id_variacion = ov.id_variacion
            WHERE oc.id_categoria = c.id_categoria
          ),
          '[]'::json
        ) AS "opciones"
      FROM categorias c
      ORDER BY c.nombre_categoria ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async getById(idCategoria: number) {
    const sql = `
      SELECT 
        c.id_categoria AS "idCategoria",
        c.nombre_categoria AS "nombreCategoria",
        c.precio_base AS "precioBase",
        c.color,
        c.descripcion,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idCategoria', oc.id_categoria,
                'idOpcionVariacion', oc.id_opcion_variacion,
                'opcionVariacion', json_build_object(
                  'idOpcionVariacion', ov.id_opcion_variacion,
                  'idVariacion', ov.id_variacion,
                  'nombreOpcion', ov.nombre_opcion,
                  'precioExtra', ov.precio_extra,
                  'variacion', json_build_object(
                    'idVariacion', v.id_variacion,
                    'nombreVariacion', v.nombre_variacion
                  )
                )
              )
            )
            FROM opciones_categoria oc
            JOIN opciones_variacion ov ON ov.id_opcion_variacion = oc.id_opcion_variacion
            JOIN variaciones v ON v.id_variacion = ov.id_variacion
            WHERE oc.id_categoria = c.id_categoria
          ),
          '[]'::json
        ) AS "opciones",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idProducto', pr.id_producto,
                'nombreProducto', pr.nombre_producto,
                'codigoProducto', pr.codigo_producto,
                'precioBase', pr.precio_base,
                'activo', pr.activo,
                'imagenes', (
                  SELECT COALESCE(json_agg(
                    json_build_object(
                      'idImagen', img.id_imagen,
                      'imagenProductoUrl', img.imagen_producto_url,
                      'esPortada', img.es_portada
                    ) ORDER BY img.es_portada DESC, img.posicion ASC
                  ), '[]'::json)
                  FROM imagenes_producto img
                  WHERE img.id_producto = pr.id_producto
                ),
                'variantes', (
                  SELECT COALESCE(json_agg(
                    json_build_object(
                      'idVariante', vr.id_variante,
                      'sku', vr.sku,
                      'stock', vr.stock,
                      'precioFinal', vr.precio_final
                    )
                  ), '[]'::json)
                  FROM variantes vr
                  WHERE vr.id_producto = pr.id_producto AND vr.activo = true
                )
              )
            )
            FROM productos pr
            WHERE pr.id_categoria = c.id_categoria AND pr.activo = true
          ),
          '[]'::json
        ) AS "productos"
      FROM categorias c
      WHERE c.id_categoria = $1;
    `;
    const res = await query(sql, [idCategoria]);
    return res.rows[0] || null;
  }

  static async create(data: CreateCategoryInput) {
    return withTransaction(async (client) => {
      const insertSql = `
        INSERT INTO categorias (nombre_categoria, precio_base, color, descripcion)
        VALUES ($1, $2, $3, $4)
        RETURNING id_categoria AS "idCategoria", nombre_categoria AS "nombreCategoria", precio_base AS "precioBase", color, descripcion;
      `;
      const catRes = await client.query(insertSql, [
        data.nombreCategoria.trim(),
        data.precioBase ?? 0,
        data.color?.trim() || null,
        data.descripcion?.trim() || null,
      ]);
      const created = catRes.rows[0];

      if (data.opcionIds && data.opcionIds.length > 0) {
        for (const idOpcion of data.opcionIds) {
          await client.query(
            `INSERT INTO opciones_categoria (id_categoria, id_opcion_variacion) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [created.idCategoria, idOpcion]
          );
        }
      }

      // Devolver estructura completa
      const fullRes = await client.query(
        `
        SELECT 
          c.id_categoria AS "idCategoria",
          c.nombre_categoria AS "nombreCategoria",
          c.precio_base AS "precioBase",
          c.color,
          c.descripcion,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'idCategoria', oc.id_categoria,
                  'idOpcionVariacion', oc.id_opcion_variacion,
                  'opcionVariacion', json_build_object(
                    'idOpcionVariacion', ov.id_opcion_variacion,
                    'idVariacion', ov.id_variacion,
                    'nombreOpcion', ov.nombre_opcion,
                    'precioExtra', ov.precio_extra
                  )
                )
              )
              FROM opciones_categoria oc
              JOIN opciones_variacion ov ON ov.id_opcion_variacion = oc.id_opcion_variacion
              WHERE oc.id_categoria = c.id_categoria
            ),
            '[]'::json
          ) AS "opciones"
        FROM categorias c
        WHERE c.id_categoria = $1;
      `,
        [created.idCategoria]
      );

      return fullRes.rows[0];
    });
  }

  static async update(idCategoria: number, data: UpdateCategoryInput) {
    return withTransaction(async (client) => {
      if (data.opcionIds !== undefined) {
        await client.query(`DELETE FROM opciones_categoria WHERE id_categoria = $1;`, [idCategoria]);
        if (data.opcionIds.length > 0) {
          for (const idOpcion of data.opcionIds) {
            await client.query(
              `INSERT INTO opciones_categoria (id_categoria, id_opcion_variacion) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [idCategoria, idOpcion]
            );
          }
        }
      }

      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.nombreCategoria !== undefined) {
        sets.push(`nombre_categoria = $${idx++}`);
        values.push(data.nombreCategoria.trim());
      }
      if (data.precioBase !== undefined) {
        sets.push(`precio_base = $${idx++}`);
        values.push(data.precioBase);
      }
      if (data.color !== undefined) {
        sets.push(`color = $${idx++}`);
        values.push(data.color?.trim() || null);
      }
      if (data.descripcion !== undefined) {
        sets.push(`descripcion = $${idx++}`);
        values.push(data.descripcion?.trim() || null);
      }

      if (sets.length > 0) {
        sets.push(`updated_at = NOW()`);
        values.push(idCategoria);
        await client.query(
          `UPDATE categorias SET ${sets.join(', ')} WHERE id_categoria = $${idx};`,
          values
        );
      }

      const fullRes = await client.query(
        `
        SELECT 
          c.id_categoria AS "idCategoria",
          c.nombre_categoria AS "nombreCategoria",
          c.precio_base AS "precioBase",
          c.color,
          c.descripcion,
          c.updated_at AS "updatedAt",
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'idCategoria', oc.id_categoria,
                  'idOpcionVariacion', oc.id_opcion_variacion,
                  'opcionVariacion', json_build_object(
                    'idOpcionVariacion', ov.id_opcion_variacion,
                    'idVariacion', ov.id_variacion,
                    'nombreOpcion', ov.nombre_opcion,
                    'precioExtra', ov.precio_extra
                  )
                )
              )
              FROM opciones_categoria oc
              JOIN opciones_variacion ov ON ov.id_opcion_variacion = oc.id_opcion_variacion
              WHERE oc.id_categoria = c.id_categoria
            ),
            '[]'::json
          ) AS "opciones"
        FROM categorias c
        WHERE c.id_categoria = $1;
      `,
        [idCategoria]
      );

      return fullRes.rows[0];
    });
  }

  static async delete(idCategoria: number) {
    const sql = `DELETE FROM categorias WHERE id_categoria = $1 RETURNING id_categoria AS "idCategoria";`;
    const res = await query(sql, [idCategoria]);
    return res.rows[0];
  }
}
