import { query, withTransaction } from '../../config/db.js';
import type { CanalDeVenta } from '../../types/database.types.js';

export interface VariantOptionNameInput {
  nombreVariacion: string;
  nombreOpcion: string;
  precioExtra?: number;
}

export interface CreateVariantInput {
  sku: string;
  stock: number;
  precioFinal: number;
  imagenVarianteUrl?: string;
  opcionIds?: number[];
  opcionesNombres?: VariantOptionNameInput[];
}

export interface CreateImageInput {
  imagenProductoUrl: string;
  esPortada?: boolean;
  posicion?: number;
}

export interface CreateProductInput {
  idCategoria: number;
  nombreProducto: string;
  codigoProducto?: string;
  descripcion?: string;
  precioCosto?: number;
  precioBase: number;
  precioAnterior?: number;
  activo?: boolean;
  canalDeVenta?: CanalDeVenta;
  estiloIds?: number[];
  etiquetaIds?: { idEtiqueta: number; esPredeterminado?: boolean }[];
  imagenes?: CreateImageInput[];
  variantes?: CreateVariantInput[];
}

export interface UpdateProductInput {
  idCategoria?: number;
  nombreProducto?: string;
  codigoProducto?: string;
  descripcion?: string;
  precioCosto?: number;
  precioBase?: number;
  precioAnterior?: number;
  activo?: boolean;
  canalDeVenta?: CanalDeVenta;
  estiloIds?: number[];
  etiquetaIds?: { idEtiqueta: number; esPredeterminado?: boolean }[];
  imagenes?: CreateImageInput[];
  variantes?: CreateVariantInput[];
}

export interface ProductFilters {
  idCategoria?: number;
  idEstilo?: number;
  idEtiqueta?: number;
  activo?: boolean;
  canalDeVenta?: CanalDeVenta;
  search?: string;
  page?: number;
  limit?: number;
}

export class ProductService {
  private static baseSelectQuery(): string {
    return `
      SELECT 
        p.id_producto AS "idProducto",
        p.id_categoria AS "idCategoria",
        p.nombre_producto AS "nombreProducto",
        p.codigo_producto AS "codigoProducto",
        p.descripcion,
        p.precio_costo AS "precioCosto",
        p.precio_base AS "precioBase",
        p.precio_anterior AS "precioAnterior",
        p.activo,
        p.canal_de_venta AS "canalDeVenta",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        json_build_object(
          'idCategoria', cat.id_categoria,
          'nombreCategoria', cat.nombre_categoria,
          'precioBase', cat.precio_base,
          'color', cat.color,
          'descripcion', cat.descripcion
        ) AS "categoria",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idImagen', img.id_imagen,
                'idProducto', img.id_producto,
                'esPortada', img.es_portada,
                'imagenProductoUrl', img.imagen_producto_url,
                'posicion', img.posicion
              ) ORDER BY img.es_portada DESC, img.posicion ASC
            )
            FROM imagenes_producto img
            WHERE img.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "imagenes",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idVariante', v.id_variante,
                'idProducto', v.id_producto,
                'sku', v.sku,
                'stock', v.stock,
                'precioFinal', v.precio_final,
                'imagenVarianteUrl', v.imagen_variante_url,
                'activo', v.activo,
                'opciones', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'opcionVariacion', json_build_object(
                          'idOpcionVariacion', ov.id_opcion_variacion,
                          'idVariacion', ov.id_variacion,
                          'nombreOpcion', ov.nombre_opcion,
                          'precioExtra', ov.precio_extra,
                          'variacion', json_build_object(
                            'idVariacion', var.id_variacion,
                            'nombreVariacion', var.nombre_variacion
                          )
                        )
                      )
                    )
                    FROM opciones_variante opt_v
                    JOIN opciones_variacion ov ON ov.id_opcion_variacion = opt_v.id_opcion_variacion
                    JOIN variaciones var ON var.id_variacion = ov.id_variacion
                    WHERE opt_v.id_variante = v.id_variante
                  ),
                  '[]'::json
                )
              )
            )
            FROM variantes v
            WHERE v.id_producto = p.id_producto AND v.activo = true
          ),
          '[]'::json
        ) AS "variantes",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idProducto', pe.id_producto,
                'idEstilo', pe.id_estilo,
                'estilo', json_build_object(
                  'idEstilo', e.id_estilo,
                  'estilo', e.estilo,
                  'color', e.color
                )
              )
            )
            FROM producto_estilos pe
            JOIN estilos e ON e.id_estilo = pe.id_estilo
            WHERE pe.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "estilos",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idProducto', pet.id_producto,
                'idEtiqueta', pet.id_etiqueta,
                'esPredeterminado', pet.es_predeterminado,
                'etiqueta', json_build_object(
                  'idEtiqueta', et.id_etiqueta,
                  'nombreEtiqueta', et.nombre_etiqueta,
                  'color', et.color
                )
              )
            )
            FROM producto_etiquetas pet
            JOIN etiquetas et ON et.id_etiqueta = pet.id_etiqueta
            WHERE pet.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "etiquetas",
        json_build_object(
          'resenas', (SELECT COUNT(*)::int FROM resenas_producto rp WHERE rp.id_producto = p.id_producto),
          'favoritos', (SELECT COUNT(*)::int FROM productos_favoritos pf WHERE pf.id_producto = p.id_producto)
        ) AS "_count",
        (SELECT ROUND(AVG(rp.calificacion)::numeric, 1) FROM resenas_producto rp WHERE rp.id_producto = p.id_producto) AS "promedioCalificacion"
      FROM productos p
      JOIN categorias cat ON cat.id_categoria = p.id_categoria
    `;
  }

  static async getAll(filters: ProductFilters = {}) {
    const whereConditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.idCategoria) {
      whereConditions.push(`p.id_categoria = $${idx++}`);
      params.push(filters.idCategoria);
    }
    if (filters.activo !== undefined) {
      whereConditions.push(`p.activo = $${idx++}`);
      params.push(filters.activo);
    }
    if (filters.canalDeVenta) {
      whereConditions.push(`p.canal_de_venta = $${idx++}`);
      params.push(filters.canalDeVenta);
    }
    if (filters.idEstilo) {
      whereConditions.push(
        `EXISTS (SELECT 1 FROM producto_estilos pe WHERE pe.id_producto = p.id_producto AND pe.id_estilo = $${idx++})`
      );
      params.push(filters.idEstilo);
    }
    if (filters.idEtiqueta) {
      whereConditions.push(
        `EXISTS (SELECT 1 FROM producto_etiquetas pet WHERE pet.id_producto = p.id_producto AND pet.id_etiqueta = $${idx++})`
      );
      params.push(filters.idEtiqueta);
    }
    if (filters.search) {
      whereConditions.push(
        `(
          p.nombre_producto ILIKE $${idx}
          OR p.descripcion ILIKE $${idx}
          OR p.codigo_producto ILIKE $${idx}
          OR EXISTS (
            SELECT 1
            FROM variantes v
            LEFT JOIN opciones_variante ovar ON ovar.id_variante = v.id_variante
            LEFT JOIN opciones_variacion ov ON ov.id_opcion_variacion = ovar.id_opcion_variacion
            WHERE v.id_producto = p.id_producto
              AND (v.sku ILIKE $${idx} OR ov.nombre_opcion ILIKE $${idx})
          )
        )`
      );
      params.push(`%${filters.search}%`);
      idx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    let paginatedSql = `${this.baseSelectQuery()} ${whereClause} ORDER BY p.id_producto DESC`;

    if (filters.limit !== undefined || filters.page !== undefined) {
      const countRes = await query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM productos p ${whereClause};`,
        params
      );
      const total = countRes.rows[0]?.total || 0;
      const limit = Math.min(Math.max(1, Number(filters.limit) || 20), 100);
      const page = Math.max(1, Number(filters.page) || 1);
      const offset = (page - 1) * limit;

      paginatedSql += ` LIMIT $${idx++} OFFSET $${idx++};`;
      const res = await query(paginatedSql, [...params, limit, offset]);

      return {
        items: res.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const res = await query(`${paginatedSql};`, params);
    return {
      items: res.rows,
      pagination: {
        total: res.rows.length,
        page: 1,
        limit: res.rows.length,
        totalPages: 1,
      },
    };
  }

  static async getById(idProducto: number) {
    const sql = `
      SELECT 
        p.id_producto AS "idProducto",
        p.id_categoria AS "idCategoria",
        p.nombre_producto AS "nombreProducto",
        p.codigo_producto AS "codigoProducto",
        p.descripcion,
        p.precio_costo AS "precioCosto",
        p.precio_base AS "precioBase",
        p.precio_anterior AS "precioAnterior",
        p.activo,
        p.canal_de_venta AS "canalDeVenta",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        json_build_object(
          'idCategoria', cat.id_categoria,
          'nombreCategoria', cat.nombre_categoria,
          'precioBase', cat.precio_base,
          'color', cat.color,
          'descripcion', cat.descripcion
        ) AS "categoria",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idImagen', img.id_imagen,
                'idProducto', img.id_producto,
                'esPortada', img.es_portada,
                'imagenProductoUrl', img.imagen_producto_url,
                'posicion', img.posicion
              ) ORDER BY img.es_portada DESC, img.posicion ASC
            )
            FROM imagenes_producto img
            WHERE img.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "imagenes",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idVariante', v.id_variante,
                'idProducto', v.id_producto,
                'sku', v.sku,
                'stock', v.stock,
                'precioFinal', v.precio_final,
                'imagenVarianteUrl', v.imagen_variante_url,
                'activo', v.activo,
                'opciones', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'opcionVariacion', json_build_object(
                          'idOpcionVariacion', ov.id_opcion_variacion,
                          'idVariacion', ov.id_variacion,
                          'nombreOpcion', ov.nombre_opcion,
                          'precioExtra', ov.precio_extra,
                          'variacion', json_build_object(
                            'idVariacion', var.id_variacion,
                            'nombreVariacion', var.nombre_variacion
                          )
                        )
                      )
                    )
                    FROM opciones_variante opt_v
                    JOIN opciones_variacion ov ON ov.id_opcion_variacion = opt_v.id_opcion_variacion
                    JOIN variaciones var ON var.id_variacion = ov.id_variacion
                    WHERE opt_v.id_variante = v.id_variante
                  ),
                  '[]'::json
                )
              )
            )
            FROM variantes v
            WHERE v.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "variantes",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idProducto', pe.id_producto,
                'idEstilo', pe.id_estilo,
                'estilo', json_build_object(
                  'idEstilo', e.id_estilo,
                  'estilo', e.estilo,
                  'color', e.color
                )
              )
            )
            FROM producto_estilos pe
            JOIN estilos e ON e.id_estilo = pe.id_estilo
            WHERE pe.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "estilos",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idProducto', pet.id_producto,
                'idEtiqueta', pet.id_etiqueta,
                'esPredeterminado', pet.es_predeterminado,
                'etiqueta', json_build_object(
                  'idEtiqueta', et.id_etiqueta,
                  'nombreEtiqueta', et.nombre_etiqueta,
                  'color', et.color
                )
              )
            )
            FROM producto_etiquetas pet
            JOIN etiquetas et ON et.id_etiqueta = pet.id_etiqueta
            WHERE pet.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "etiquetas",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idResena', rp.id_resena,
                'idProducto', rp.id_producto,
                'idCliente', rp.id_cliente,
                'calificacion', rp.calificacion,
                'comentario', rp.comentario,
                'fecha', rp.fecha,
                'cliente', json_build_object(
                  'idCliente', cl.id_cliente,
                  'nombreCompleto', cl.nombre_completo
                )
              ) ORDER BY rp.fecha DESC
            )
            FROM resenas_producto rp
            JOIN clientes cl ON cl.id_cliente = rp.id_cliente
            WHERE rp.id_producto = p.id_producto
          ),
          '[]'::json
        ) AS "resenas"
      FROM productos p
      JOIN categorias cat ON cat.id_categoria = p.id_categoria
      WHERE p.id_producto = $1;
    `;
    const res = await query(sql, [idProducto]);
    return res.rows[0] || null;
  }

  private static normalizeCanalDeVenta(canal?: string): CanalDeVenta {
    const upper = (canal || '').trim().toUpperCase();
    if (upper === 'WEB' || upper === 'SOLO_WEB') return 'WEB';
    if (upper === 'LOCAL' || upper === 'SOLO_LOCAL') return 'LOCAL';
    return 'AMBOS';
  }

  private static async resolveOrCreateOptionIds(
    client: any,
    idCategoria: number,
    variant: CreateVariantInput
  ): Promise<number[]> {
    const resolvedIds = new Set<number>(variant.opcionIds || []);

    if (variant.opcionesNombres && variant.opcionesNombres.length > 0) {
      for (const opt of variant.opcionesNombres) {
        const varTrim = opt.nombreVariacion.trim().toUpperCase();
        const optTrim = opt.nombreOpcion.trim();

        let idVar: number;
        const varFind = await client.query(
          `SELECT id_variacion FROM variaciones WHERE UPPER(nombre_variacion) = $1 LIMIT 1;`,
          [varTrim]
        );
        if (varFind.rows.length > 0) {
          idVar = varFind.rows[0].id_variacion;
        } else {
          const varIns = await client.query(
            `INSERT INTO variaciones (nombre_variacion) VALUES ($1) ON CONFLICT (nombre_variacion) DO UPDATE SET nombre_variacion = EXCLUDED.nombre_variacion RETURNING id_variacion;`,
            [varTrim]
          );
          idVar = varIns.rows[0].id_variacion;
        }

        let idOpt: number;
        const optFind = await client.query(
          `SELECT id_opcion_variacion FROM opciones_variacion WHERE id_variacion = $1 AND UPPER(nombre_opcion) = UPPER($2) LIMIT 1;`,
          [idVar, optTrim]
        );
        if (optFind.rows.length > 0) {
          idOpt = optFind.rows[0].id_opcion_variacion;
          if (opt.precioExtra !== undefined && Number(opt.precioExtra) > 0) {
            await client.query(
              `UPDATE opciones_variacion SET precio_extra = $1 WHERE id_opcion_variacion = $2;`,
              [opt.precioExtra, idOpt]
            );
          }
        } else {
          const optIns = await client.query(
            `INSERT INTO opciones_variacion (id_variacion, nombre_opcion, precio_extra) VALUES ($1, $2, $3) RETURNING id_opcion_variacion;`,
            [idVar, optTrim, opt.precioExtra ?? 0]
          );
          idOpt = optIns.rows[0].id_opcion_variacion;
        }

        await client.query(
          `INSERT INTO opciones_categoria (id_categoria, id_opcion_variacion) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [idCategoria, idOpt]
        );

        resolvedIds.add(idOpt);
      }
    }

    return Array.from(resolvedIds);
  }

  static async create(data: CreateProductInput) {
    return withTransaction(async (client) => {
      const canal = this.normalizeCanalDeVenta(data.canalDeVenta);
      const codigo = (data.codigoProducto && data.codigoProducto.trim())
        ? data.codigoProducto.trim()
        : `BTC-${Date.now().toString().slice(-6)}`;
      const desc = data.descripcion ? data.descripcion.trim() : '';
      const costo = data.precioCosto !== undefined ? Number(data.precioCosto) : null;

      const insertProdSql = `
        INSERT INTO productos (
          id_categoria, nombre_producto, codigo_producto, descripcion,
          precio_costo, precio_base, precio_anterior, activo, canal_de_venta, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id_producto;
      `;
      const prodRes = await client.query(insertProdSql, [
        data.idCategoria,
        data.nombreProducto.trim(),
        codigo,
        desc,
        costo,
        data.precioBase,
        data.precioAnterior || null,
        data.activo ?? true,
        canal,
      ]);

      const idProducto = prodRes.rows[0].id_producto;

      // Imagenes
      if (data.imagenes && data.imagenes.length > 0) {
        for (let idx = 0; idx < data.imagenes.length; idx++) {
          const img = data.imagenes[idx];
          await client.query(
            `
            INSERT INTO imagenes_producto (id_producto, imagen_producto_url, es_portada, posicion)
            VALUES ($1, $2, $3, $4);
          `,
            [idProducto, img.imagenProductoUrl, img.esPortada ?? idx === 0, img.posicion ?? idx]
          );
        }
      }

      // Estilos
      if (data.estiloIds && data.estiloIds.length > 0) {
        for (const idEstilo of data.estiloIds) {
          await client.query(
            `INSERT INTO producto_estilos (id_producto, id_estilo) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [idProducto, idEstilo]
          );
        }
      }

      // Etiquetas
      if (data.etiquetaIds && data.etiquetaIds.length > 0) {
        for (const item of data.etiquetaIds) {
          await client.query(
            `
            INSERT INTO producto_etiquetas (id_producto, id_etiqueta, es_predeterminado)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING;
          `,
            [idProducto, item.idEtiqueta, item.esPredeterminado ?? false]
          );
        }
      }

      // Variantes
      if (data.variantes && data.variantes.length > 0) {
        for (const variant of data.variantes) {
          const varRes = await client.query(
            `
            INSERT INTO variantes (id_producto, sku, stock, precio_final, imagen_variante_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_variante;
          `,
            [
              idProducto,
              variant.sku.trim(),
              variant.stock,
              variant.precioFinal,
              variant.imagenVarianteUrl || null,
            ]
          );
          const idVariante = varRes.rows[0].id_variante;
          const optionIds = await this.resolveOrCreateOptionIds(client, data.idCategoria, variant);
          for (const idOpcion of optionIds) {
            await client.query(
              `INSERT INTO opciones_variante (id_variante, id_opcion_variacion) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [idVariante, idOpcion]
            );
          }
        }
      }

      const created = await this.getById(idProducto);
      return created;
    });
  }

  static async update(idProducto: number, data: UpdateProductInput) {
    return withTransaction(async (client) => {
      // Estilos
      if (data.estiloIds !== undefined) {
        await client.query(`DELETE FROM producto_estilos WHERE id_producto = $1;`, [idProducto]);
        if (data.estiloIds.length > 0) {
          for (const idEstilo of data.estiloIds) {
            await client.query(
              `INSERT INTO producto_estilos (id_producto, id_estilo) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [idProducto, idEstilo]
            );
          }
        }
      }

      // Etiquetas
      if (data.etiquetaIds !== undefined) {
        await client.query(`DELETE FROM producto_etiquetas WHERE id_producto = $1;`, [idProducto]);
        if (data.etiquetaIds.length > 0) {
          for (const item of data.etiquetaIds) {
            await client.query(
              `
              INSERT INTO producto_etiquetas (id_producto, id_etiqueta, es_predeterminado)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING;
            `,
              [idProducto, item.idEtiqueta, item.esPredeterminado ?? false]
            );
          }
        }
      }

      // Imagenes
      if (data.imagenes !== undefined) {
        await client.query(`DELETE FROM imagenes_producto WHERE id_producto = $1;`, [idProducto]);
        if (data.imagenes.length > 0) {
          for (let idx = 0; idx < data.imagenes.length; idx++) {
            const img = data.imagenes[idx];
            await client.query(
              `
              INSERT INTO imagenes_producto (id_producto, imagen_producto_url, es_portada, posicion)
              VALUES ($1, $2, $3, $4);
            `,
              [idProducto, img.imagenProductoUrl, img.esPortada ?? idx === 0, img.posicion ?? idx]
            );
          }
        }
      }

      // Variantes (Upsert sin violar FK de detalles_pedido ni perder vinculo con premios)
      if (data.variantes !== undefined) {
        let targetCategoriaId = data.idCategoria;
        if (!targetCategoriaId) {
          const currentProd = await client.query(`SELECT id_categoria FROM productos WHERE id_producto = $1;`, [idProducto]);
          targetCategoriaId = currentProd.rows[0]?.id_categoria || 1;
        }

        const existingVarsRes = await client.query(
          `SELECT id_variante, sku FROM variantes WHERE id_producto = $1 ORDER BY id_variante ASC;`,
          [idProducto]
        );
        const existingVars: Array<{ id_variante: number; sku: string }> = existingVarsRes.rows;
        const keptVariantIds = new Set<number>();

        for (let idxVar = 0; idxVar < data.variantes.length; idxVar++) {
          const variant = data.variantes[idxVar];
          const cleanSku = variant.sku.trim();

          // Buscar coincidencia por SKU primero, o reutilizar variante existente libre en la misma posicion
          let matchedExisting = existingVars.find(
            (ev) => ev.sku.toUpperCase() === cleanSku.toUpperCase() && !keptVariantIds.has(ev.id_variante)
          );
          if (!matchedExisting && idxVar < existingVars.length && !keptVariantIds.has(existingVars[idxVar].id_variante)) {
            const candidate = existingVars[idxVar];
            const skuUsedLater = data.variantes
              .slice(idxVar + 1)
              .some((v) => v.sku.trim().toUpperCase() === candidate.sku.toUpperCase());
            if (!skuUsedLater) {
              matchedExisting = candidate;
            }
          }

          let idVariante: number;
          if (matchedExisting) {
            idVariante = matchedExisting.id_variante;
            keptVariantIds.add(idVariante);
            await client.query(
              `UPDATE variantes
               SET sku = $1, stock = $2, precio_final = $3, imagen_variante_url = $4, activo = true
               WHERE id_variante = $5;`,
              [
                cleanSku,
                variant.stock,
                variant.precioFinal,
                variant.imagenVarianteUrl || null,
                idVariante,
              ]
            );
            await client.query(`DELETE FROM opciones_variante WHERE id_variante = $1;`, [idVariante]);
          } else {
            const varRes = await client.query(
              `INSERT INTO variantes (id_producto, sku, stock, precio_final, imagen_variante_url, activo)
               VALUES ($1, $2, $3, $4, $5, true)
               ON CONFLICT (sku) DO UPDATE
               SET id_producto = EXCLUDED.id_producto,
                   stock = EXCLUDED.stock,
                   precio_final = EXCLUDED.precio_final,
                   imagen_variante_url = EXCLUDED.imagen_variante_url,
                   activo = true
               RETURNING id_variante;`,
              [
                idProducto,
                cleanSku,
                variant.stock,
                variant.precioFinal,
                variant.imagenVarianteUrl || null,
              ]
            );
            idVariante = varRes.rows[0].id_variante;
            keptVariantIds.add(idVariante);
            await client.query(`DELETE FROM opciones_variante WHERE id_variante = $1;`, [idVariante]);
          }

          const optionIds = await this.resolveOrCreateOptionIds(client, targetCategoriaId!, variant);
          for (const idOpcion of optionIds) {
            await client.query(
              `INSERT INTO opciones_variante (id_variante, id_opcion_variacion) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [idVariante, idOpcion]
            );
          }
        }

        // Procesar variantes antiguas que ya no forman parte del producto actualizado
        for (const oldVar of existingVars) {
          if (!keptVariantIds.has(oldVar.id_variante)) {
            const hasOrdersRes = await client.query(
              `SELECT 1 FROM detalles_pedido WHERE id_variante = $1 LIMIT 1;`,
              [oldVar.id_variante]
            );
            const hasRewardsRes = await client.query(
              `SELECT 1 FROM premios WHERE id_variante = $1 LIMIT 1;`,
              [oldVar.id_variante]
            );
            if (hasOrdersRes.rows.length > 0 || hasRewardsRes.rows.length > 0) {
              await client.query(
                `UPDATE variantes SET activo = false, stock = 0 WHERE id_variante = $1;`,
                [oldVar.id_variante]
              );
            } else {
              await client.query(`DELETE FROM opciones_variante WHERE id_variante = $1;`, [oldVar.id_variante]);
              await client.query(`DELETE FROM variantes WHERE id_variante = $1;`, [oldVar.id_variante]);
            }
          }
        }
      }

      // Campos base del producto
      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.idCategoria !== undefined) {
        sets.push(`id_categoria = $${idx++}`);
        values.push(data.idCategoria);
      }
      if (data.nombreProducto !== undefined) {
        sets.push(`nombre_producto = $${idx++}`);
        values.push(data.nombreProducto.trim());
      }
      if (data.codigoProducto !== undefined) {
        sets.push(`codigo_producto = $${idx++}`);
        values.push(data.codigoProducto.trim());
      }
      if (data.descripcion !== undefined) {
        sets.push(`descripcion = $${idx++}`);
        values.push(data.descripcion.trim());
      }
      if (data.precioCosto !== undefined) {
        sets.push(`precio_costo = $${idx++}`);
        values.push(data.precioCosto);
      }
      if (data.precioBase !== undefined) {
        sets.push(`precio_base = $${idx++}`);
        values.push(data.precioBase);
      }
      if (data.precioAnterior !== undefined) {
        sets.push(`precio_anterior = $${idx++}`);
        values.push(data.precioAnterior);
      }
      if (data.activo !== undefined) {
        sets.push(`activo = $${idx++}`);
        values.push(data.activo);
      }
      if (data.canalDeVenta !== undefined) {
        sets.push(`canal_de_venta = $${idx++}`);
        values.push(this.normalizeCanalDeVenta(data.canalDeVenta));
      }

      if (sets.length > 0) {
        sets.push(`updated_at = NOW()`);
        values.push(idProducto);
        await client.query(
          `UPDATE productos SET ${sets.join(', ')} WHERE id_producto = $${idx};`,
          values
        );
      }

      const updated = await this.getById(idProducto);
      return updated;
    });
  }

  static async delete(idProducto: number, logical: boolean = true) {
    if (logical) {
      const sql = `
        UPDATE productos 
        SET activo = false 
        WHERE id_producto = $1 
        RETURNING id_producto AS "idProducto";
      `;
      const res = await query(sql, [idProducto]);
      return res.rows[0];
    }
    const sql = `DELETE FROM productos WHERE id_producto = $1 RETURNING id_producto AS "idProducto";`;
    const res = await query(sql, [idProducto]);
    return res.rows[0];
  }

  // --- Reseñas ---
  static async addReview(
    idProducto: number,
    idCliente: number,
    data: { calificacion: number; comentario?: string }
  ) {
    const insertSql = `
      WITH inserted AS (
        INSERT INTO resenas_producto (id_producto, id_cliente, calificacion, comentario)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      )
      SELECT 
        i.id_resena AS "idResena",
        i.id_producto AS "idProducto",
        i.id_cliente AS "idCliente",
        i.calificacion,
        i.comentario,
        i.fecha,
        EXISTS (
          SELECT 1
          FROM pedidos_cliente pc
          JOIN detalles_pedido dp ON dp.id_pedido = pc.id_pedido
          JOIN variantes v ON v.id_variante = dp.id_variante
          WHERE pc.id_cliente = i.id_cliente
            AND v.id_producto = i.id_producto
            AND pc.estado != 'CANCELADO'
        ) AS "compraVerificada",
        json_build_object(
          'idCliente', c.id_cliente,
          'nombreCompleto', c.nombre_completo
        ) AS "cliente"
      FROM inserted i
      JOIN clientes c ON c.id_cliente = i.id_cliente;
    `;
    const res = await query(insertSql, [
      idProducto,
      idCliente,
      data.calificacion,
      data.comentario?.trim() || null,
    ]);
    return res.rows[0];
  }

  static async getReviews(idProducto: number) {
    const sql = `
      SELECT 
        rp.id_resena AS "idResena",
        rp.id_producto AS "idProducto",
        rp.id_cliente AS "idCliente",
        rp.calificacion,
        rp.comentario,
        rp.fecha,
        EXISTS (
          SELECT 1
          FROM pedidos_cliente pc
          JOIN detalles_pedido dp ON dp.id_pedido = pc.id_pedido
          JOIN variantes v ON v.id_variante = dp.id_variante
          WHERE pc.id_cliente = rp.id_cliente
            AND v.id_producto = rp.id_producto
            AND pc.estado != 'CANCELADO'
        ) AS "compraVerificada",
        json_build_object(
          'idCliente', c.id_cliente,
          'nombreCompleto', c.nombre_completo
        ) AS "cliente"
      FROM resenas_producto rp
      JOIN clientes c ON c.id_cliente = rp.id_cliente
      WHERE rp.id_producto = $1
      ORDER BY rp.fecha DESC;
    `;
    const res = await query(sql, [idProducto]);
    return res.rows;
  }

  static async deleteReview(idProducto: number, idResena: number) {
    const sql = `
      DELETE FROM resenas_producto
      WHERE id_resena = $1 AND id_producto = $2
      RETURNING id_resena AS "idResena", id_producto AS "idProducto";
    `;
    const res = await query(sql, [idResena, idProducto]);
    return res.rows[0];
  }
}
