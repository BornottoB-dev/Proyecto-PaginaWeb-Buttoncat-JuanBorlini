import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { SvgGeneratorService } from './svg-generator.service.js';
import type { Transform2D } from './custom-product.types.js';

export interface CreateTemplateOptionInput {
  colorHex?: string;
  imagenPlantillaUrl: string;
  nombreOpcion: string;
  precioExtra?: number;
  transformOpcion?: Transform2D;
}

export interface CreateTemplateVariationInput {
  nombreVariacion: string;
  nroPaso: number;
  ordenCapaSvg: number;
  transformVariante?: Transform2D;
  opciones?: CreateTemplateOptionInput[];
}

export interface CreateTemplateInput {
  nombrePlantilla: string;
  descripcion: string;
  precioBase: number;
  permiteSubirImagen?: boolean;
  transformGlobal?: Transform2D;
  imagenBaseUrl: string;
  variaciones?: CreateTemplateVariationInput[];
}

export interface UpdateTemplateInput {
  nombrePlantilla?: string;
  descripcion?: string;
  precioBase?: number;
  permiteSubirImagen?: boolean;
  transformGlobal?: Transform2D;
  imagenBaseUrl?: string;
  activo?: boolean;
}

export interface CreateCustomProductInput {
  idPlantillaCustom: number;
  nombreCustom: string;
  opcionIds: number[];
  imagenSubidaClienteUrl?: string;
  transformImagenSubida?: Transform2D;
  comentarioCliente?: string;
  svgRenderizado?: string;
}

export class CustomProductService {
  // Helper para consulta base de plantilla con variaciones y opciones anidadas
  private static async getTemplateQuery(
    whereClause: string,
    params: any[],
    client?: PoolClient
  ) {
    const sql = `
      SELECT
        p.id_plantilla_custom AS "idPlantillaCustom",
        p.nombre_plantilla AS "nombrePlantilla",
        p.descripcion,
        p.precio_base::numeric AS "precioBase",
        p.permite_subir_imagen AS "permiteSubirImagen",
        p.transform_global AS "transformGlobal",
        p.imagen_base_url AS "imagenBaseUrl",
        p.activo,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idVariacionCustom', v.id_variacion_custom,
                'idPlantillaCustom', v.id_plantilla_custom,
                'nombreVariacion', v.nombre_variacion,
                'nroPaso', v.nro_paso,
                'ordenCapaSvg', v.orden_capa_svg,
                'transformVariante', v.transform_variante,
                'activo', v.activo,
                'opciones', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'idOpcionCustom', o.id_opcion_custom,
                        'idVariacionCustom', o.id_variacion_custom,
                        'nombreOpcion', o.nombre_opcion,
                        'imagenPlantillaUrl', o.imagen_plantilla_url,
                        'colorHex', o.color_hex,
                        'precioExtra', o.precio_extra::numeric,
                        'transformOpcion', o.transform_opcion,
                        'activo', o.activo
                      ) ORDER BY o.id_opcion_custom ASC
                    )
                    FROM opciones_variacion_custom o
                    WHERE o.id_variacion_custom = v.id_variacion_custom
                      AND (v.activo = true OR o.activo = true)
                  ),
                  '[]'::json
                )
              ) ORDER BY v.nro_paso ASC, v.orden_capa_svg ASC
            )
            FROM variaciones_custom v
            WHERE v.id_plantilla_custom = p.id_plantilla_custom
          ),
          '[]'::json
        ) AS "variaciones"
      FROM plantillas_producto_custom p
      ${whereClause}
      ORDER BY p.id_plantilla_custom ASC;
    `;
    const res = client ? await client.query(sql, params) : await query(sql, params);
    return res.rows;
  }

  // --- Plantillas Custom ---
  static async getAllTemplates(onlyActive: boolean = true) {
    const where = onlyActive ? 'WHERE p.activo = true' : '';
    return this.getTemplateQuery(where, []);
  }

  static async getTemplateById(idPlantillaCustom: number, client?: PoolClient) {
    const rows = await this.getTemplateQuery(
      'WHERE p.id_plantilla_custom = $1',
      [idPlantillaCustom],
      client
    );
    return rows[0] || null;
  }

  static async createTemplate(data: CreateTemplateInput) {
    const { variaciones, ...templateData } = data;

    return withTransaction(async (client) => {
      const insertTplSql = `
        INSERT INTO plantillas_producto_custom (
          nombre_plantilla, descripcion, precio_base, permite_subir_imagen,
          transform_global, imagen_base_url, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id_plantilla_custom;
      `;
      const tplRes = await client.query(insertTplSql, [
        templateData.nombrePlantilla.trim(),
        templateData.descripcion.trim(),
        templateData.precioBase,
        templateData.permiteSubirImagen ?? false,
        templateData.transformGlobal ? JSON.stringify(templateData.transformGlobal) : null,
        templateData.imagenBaseUrl,
      ]);
      const idPlantilla = tplRes.rows[0].id_plantilla_custom;

      if (variaciones && variaciones.length > 0) {
        for (const v of variaciones) {
          const insertVarSql = `
            INSERT INTO variaciones_custom (
              id_plantilla_custom, nombre_variacion, nro_paso, orden_capa_svg,
              transform_variante, activo
            ) VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id_variacion_custom;
          `;
          const varRes = await client.query(insertVarSql, [
            idPlantilla,
            v.nombreVariacion.trim(),
            v.nroPaso,
            v.ordenCapaSvg,
            v.transformVariante ? JSON.stringify(v.transformVariante) : null,
          ]);
          const idVar = varRes.rows[0].id_variacion_custom;

          if (v.opciones && v.opciones.length > 0) {
            for (const opt of v.opciones) {
              await client.query(
                `INSERT INTO opciones_variacion_custom (
                  id_variacion_custom, nombre_opcion, imagen_plantilla_url,
                  color_hex, precio_extra, transform_opcion, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, true);`,
                [
                  idVar,
                  opt.nombreOpcion.trim(),
                  opt.imagenPlantillaUrl,
                  opt.colorHex ? opt.colorHex.trim() : null,
                  opt.precioExtra ?? 0,
                  opt.transformOpcion ? JSON.stringify(opt.transformOpcion) : null,
                ]
              );
            }
          }
        }
      }

      return this.getTemplateById(idPlantilla, client);
    });
  }

  static async updateTemplate(idPlantillaCustom: number, data: UpdateTemplateInput) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombrePlantilla !== undefined) {
      updates.push(`nombre_plantilla = $${idx++}`);
      values.push(data.nombrePlantilla.trim());
    }
    if (data.descripcion !== undefined) {
      updates.push(`descripcion = $${idx++}`);
      values.push(data.descripcion.trim());
    }
    if (data.precioBase !== undefined) {
      updates.push(`precio_base = $${idx++}`);
      values.push(data.precioBase);
    }
    if (data.permiteSubirImagen !== undefined) {
      updates.push(`permite_subir_imagen = $${idx++}`);
      values.push(data.permiteSubirImagen);
    }
    if (data.transformGlobal !== undefined) {
      updates.push(`transform_global = $${idx++}`);
      values.push(data.transformGlobal ? JSON.stringify(data.transformGlobal) : null);
    }
    if (data.imagenBaseUrl !== undefined) {
      updates.push(`imagen_base_url = $${idx++}`);
      values.push(data.imagenBaseUrl);
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (updates.length > 0) {
      values.push(idPlantillaCustom);
      await query(
        `UPDATE plantillas_producto_custom
         SET ${updates.join(', ')}
         WHERE id_plantilla_custom = $${idx};`,
        values
      );
    }

    return this.getTemplateById(idPlantillaCustom);
  }

  static async deleteTemplate(idPlantillaCustom: number) {
    const res = await query(
      `UPDATE plantillas_producto_custom
       SET activo = false
       WHERE id_plantilla_custom = $1
       RETURNING id_plantilla_custom AS "idPlantillaCustom", activo;`,
      [idPlantillaCustom]
    );
    return res.rows[0];
  }

  // --- Variaciones de Plantilla ---
  static async addVariation(
    idPlantillaCustom: number,
    data: CreateTemplateVariationInput
  ) {
    const { opciones, ...variationData } = data;

    return withTransaction(async (client) => {
      const vResult = await client.query(
        `INSERT INTO variaciones_custom (
          id_plantilla_custom, nombre_variacion, nro_paso, orden_capa_svg,
          transform_variante, activo
        ) VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id_variacion_custom AS "idVariacionCustom",
                  id_plantilla_custom AS "idPlantillaCustom",
                  nombre_variacion AS "nombreVariacion",
                  nro_paso AS "nroPaso",
                  orden_capa_svg AS "ordenCapaSvg",
                  transform_variante AS "transformVariante",
                  activo;`,
        [
          idPlantillaCustom,
          variationData.nombreVariacion.trim(),
          variationData.nroPaso,
          variationData.ordenCapaSvg,
          variationData.transformVariante ? JSON.stringify(variationData.transformVariante) : null,
        ]
      );
      const variation = vResult.rows[0];
      const insertedOptions = [];

      if (opciones && opciones.length > 0) {
        for (const opt of opciones) {
          const optResult = await client.query(
            `INSERT INTO opciones_variacion_custom (
              id_variacion_custom, nombre_opcion, imagen_plantilla_url,
              color_hex, precio_extra, transform_opcion, activo
            ) VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING id_opcion_custom AS "idOpcionCustom",
                      id_variacion_custom AS "idVariacionCustom",
                      nombre_opcion AS "nombreOpcion",
                      imagen_plantilla_url AS "imagenPlantillaUrl",
                      color_hex AS "colorHex",
                      precio_extra::numeric AS "precioExtra",
                      transform_opcion AS "transformOpcion",
                      activo;`,
            [
              variation.idVariacionCustom,
              opt.nombreOpcion.trim(),
              opt.imagenPlantillaUrl,
              opt.colorHex ? opt.colorHex.trim() : null,
              opt.precioExtra ?? 0,
              opt.transformOpcion ? JSON.stringify(opt.transformOpcion) : null,
            ]
          );
          insertedOptions.push(optResult.rows[0]);
        }
      }

      return {
        ...variation,
        opciones: insertedOptions,
      };
    });
  }

  static async updateVariation(
    idVariacionCustom: number,
    data: Partial<CreateTemplateVariationInput> & { activo?: boolean }
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreVariacion !== undefined) {
      updates.push(`nombre_variacion = $${idx++}`);
      values.push(data.nombreVariacion.trim());
    }
    if (data.nroPaso !== undefined) {
      updates.push(`nro_paso = $${idx++}`);
      values.push(data.nroPaso);
    }
    if (data.ordenCapaSvg !== undefined) {
      updates.push(`orden_capa_svg = $${idx++}`);
      values.push(data.ordenCapaSvg);
    }
    if (data.transformVariante !== undefined) {
      updates.push(`transform_variante = $${idx++}`);
      values.push(data.transformVariante ? JSON.stringify(data.transformVariante) : null);
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (updates.length === 0) {
      const res = await query(
        `SELECT id_variacion_custom AS "idVariacionCustom", id_plantilla_custom AS "idPlantillaCustom",
                nombre_variacion AS "nombreVariacion", nro_paso AS "nroPaso", orden_capa_svg AS "ordenCapaSvg",
                transform_variante AS "transformVariante", activo
         FROM variaciones_custom WHERE id_variacion_custom = $1;`,
        [idVariacionCustom]
      );
      return res.rows[0];
    }

    values.push(idVariacionCustom);
    const sql = `
      UPDATE variaciones_custom
      SET ${updates.join(', ')}
      WHERE id_variacion_custom = $${idx}
      RETURNING id_variacion_custom AS "idVariacionCustom",
                id_plantilla_custom AS "idPlantillaCustom",
                nombre_variacion AS "nombreVariacion",
                nro_paso AS "nroPaso",
                orden_capa_svg AS "ordenCapaSvg",
                transform_variante AS "transformVariante",
                activo;
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async deleteVariation(idVariacionCustom: number) {
    const result = await query(
      `UPDATE variaciones_custom SET activo = false WHERE id_variacion_custom = $1
       RETURNING id_variacion_custom AS "idVariacionCustom", activo;`,
      [idVariacionCustom]
    );
    return result.rows[0];
  }

  // --- Opciones de Variacion ---
  static async addOption(
    idVariacionCustom: number,
    data: CreateTemplateOptionInput
  ) {
    const sql = `
      INSERT INTO opciones_variacion_custom (
        id_variacion_custom, nombre_opcion, imagen_plantilla_url,
        color_hex, precio_extra, transform_opcion, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id_opcion_custom AS "idOpcionCustom",
                id_variacion_custom AS "idVariacionCustom",
                nombre_opcion AS "nombreOpcion",
                imagen_plantilla_url AS "imagenPlantillaUrl",
                color_hex AS "colorHex",
                precio_extra::numeric AS "precioExtra",
                transform_opcion AS "transformOpcion",
                activo;
    `;
    const result = await query(sql, [
      idVariacionCustom,
      data.nombreOpcion.trim(),
      data.imagenPlantillaUrl,
      data.colorHex ? data.colorHex.trim() : null,
      data.precioExtra ?? 0,
      data.transformOpcion ? JSON.stringify(data.transformOpcion) : null,
    ]);
    return result.rows[0];
  }

  static async updateOption(
    idOpcionCustom: number,
    data: Partial<CreateTemplateOptionInput> & { activo?: boolean }
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreOpcion !== undefined) {
      updates.push(`nombre_opcion = $${idx++}`);
      values.push(data.nombreOpcion.trim());
    }
    if (data.imagenPlantillaUrl !== undefined) {
      updates.push(`imagen_plantilla_url = $${idx++}`);
      values.push(data.imagenPlantillaUrl);
    }
    if (data.colorHex !== undefined) {
      updates.push(`color_hex = $${idx++}`);
      values.push(data.colorHex ? data.colorHex.trim() : null);
    }
    if (data.precioExtra !== undefined) {
      updates.push(`precio_extra = $${idx++}`);
      values.push(data.precioExtra);
    }
    if (data.transformOpcion !== undefined) {
      updates.push(`transform_opcion = $${idx++}`);
      values.push(data.transformOpcion ? JSON.stringify(data.transformOpcion) : null);
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (updates.length === 0) {
      const res = await query(
        `SELECT id_opcion_custom AS "idOpcionCustom", id_variacion_custom AS "idVariacionCustom",
                nombre_opcion AS "nombreOpcion", imagen_plantilla_url AS "imagenPlantillaUrl",
                color_hex AS "colorHex", precio_extra::numeric AS "precioExtra",
                transform_opcion AS "transformOpcion", activo
         FROM opciones_variacion_custom WHERE id_opcion_custom = $1;`,
        [idOpcionCustom]
      );
      return res.rows[0];
    }

    values.push(idOpcionCustom);
    const sql = `
      UPDATE opciones_variacion_custom
      SET ${updates.join(', ')}
      WHERE id_opcion_custom = $${idx}
      RETURNING id_opcion_custom AS "idOpcionCustom",
                id_variacion_custom AS "idVariacionCustom",
                nombre_opcion AS "nombreOpcion",
                imagen_plantilla_url AS "imagenPlantillaUrl",
                color_hex AS "colorHex",
                precio_extra::numeric AS "precioExtra",
                transform_opcion AS "transformOpcion",
                activo;
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async deleteOption(idOpcionCustom: number) {
    const result = await query(
      `UPDATE opciones_variacion_custom SET activo = false WHERE id_opcion_custom = $1
       RETURNING id_opcion_custom AS "idOpcionCustom", activo;`,
      [idOpcionCustom]
    );
    return result.rows[0];
  }

  // --- Creacion y Consulta de Producto Custom ---
  static async createCustomProduct(data: CreateCustomProductInput) {
    return withTransaction(async (client) => {
      // 1. Validar plantilla
      const tplRes = await client.query(
        `SELECT id_plantilla_custom AS "idPlantillaCustom",
                nombre_plantilla AS "nombrePlantilla",
                descripcion,
                precio_base::numeric AS "precioBase",
                permite_subir_imagen AS "permiteSubirImagen",
                transform_global AS "transformGlobal",
                imagen_base_url AS "imagenBaseUrl",
                activo
         FROM plantillas_producto_custom
         WHERE id_plantilla_custom = $1;`,
        [data.idPlantillaCustom]
      );
      const template = tplRes.rows[0];
      if (!template || !template.activo) {
        throw new Error('Plantilla custom no valida o inactiva');
      }

      // 2. Obtener opciones seleccionadas con datos de su variacion
      let selectedOptions: any[] = [];
      if (data.opcionIds && data.opcionIds.length > 0) {
        const optRes = await client.query(
          `SELECT
             o.id_opcion_custom AS "idOpcionCustom",
             o.id_variacion_custom AS "idVariacionCustom",
             o.nombre_opcion AS "nombreOpcion",
             o.imagen_plantilla_url AS "imagenPlantillaUrl",
             o.color_hex AS "colorHex",
             o.precio_extra::numeric AS "precioExtra",
             o.transform_opcion AS "transformOpcion",
             o.activo,
             json_build_object(
               'idVariacionCustom', v.id_variacion_custom,
               'idPlantillaCustom', v.id_plantilla_custom,
               'nombreVariacion', v.nombre_variacion,
               'nroPaso', v.nro_paso,
               'ordenCapaSvg', v.orden_capa_svg,
               'transformVariante', v.transform_variante,
               'activo', v.activo
             ) AS "variacion"
           FROM opciones_variacion_custom o
           JOIN variaciones_custom v ON v.id_variacion_custom = o.id_variacion_custom
           WHERE o.id_opcion_custom = ANY($1::int[]) AND o.activo = true;`,
          [data.opcionIds]
        );
        selectedOptions = optRes.rows;
      }

      // 3. Calcular precio final
      const precioBase = Number(template.precioBase);
      const sumExtras = selectedOptions.reduce(
        (acc, curr) => acc + Number(curr.precioExtra),
        0
      );
      const precioFinal = precioBase + sumExtras;

      // 4. Generar SVG renderizado si no fue provisto
      let svgFinal = data.svgRenderizado;
      if (!svgFinal) {
        svgFinal = SvgGeneratorService.composeSvg({
          imagenBaseUrl: template.imagenBaseUrl,
          transformGlobal: template.transformGlobal as unknown as Transform2D,
          imagenSubidaUrl: data.imagenSubidaClienteUrl,
          transformImagenSubida: data.transformImagenSubida,
          capas: selectedOptions.map((opt) => ({
            ordenCapa: opt.variacion.ordenCapaSvg,
            nombreCapa: opt.nombreOpcion,
            imagenUrl: opt.imagenPlantillaUrl,
            colorHex: opt.colorHex || undefined,
            transform: (opt.transformOpcion || opt.variacion.transformVariante) as unknown as Transform2D,
          })),
        });
      }

      // 5. Insertar producto_custom
      const idProductoCustom = randomUUID();
      await client.query(
        `INSERT INTO productos_custom (
          id_producto_custom, id_plantilla_custom, nombre_custom, precio_final,
          imagen_subida_cliente_url, svg_renderizado, transform_imagen_subida,
          comentario_cliente
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          idProductoCustom,
          data.idPlantillaCustom,
          data.nombreCustom.trim(),
          precioFinal,
          data.imagenSubidaClienteUrl || null,
          svgFinal,
          data.transformImagenSubida ? JSON.stringify(data.transformImagenSubida) : null,
          data.comentarioCliente ? data.comentarioCliente.trim() : null,
        ]
      );

      // 6. Insertar opciones_seleccionadas
      if (data.opcionIds && data.opcionIds.length > 0) {
        for (const idOpt of data.opcionIds) {
          await client.query(
            `INSERT INTO opciones_seleccionadas (id_opcion_custom, id_producto_custom)
             VALUES ($1, $2);`,
            [idOpt, idProductoCustom]
          );
        }
      }

      // 7. Retornar producto completo
      return this.getCustomProductById(idProductoCustom, client);
    });
  }

  static async getCustomProductById(idProductoCustom: string, client?: PoolClient) {
    const sql = `
      SELECT
        pc.id_producto_custom AS "idProductoCustom",
        pc.id_plantilla_custom AS "idPlantillaCustom",
        pc.nombre_custom AS "nombreCustom",
        pc.precio_final::numeric AS "precioFinal",
        pc.imagen_subida_cliente_url AS "imagenSubidaClienteUrl",
        pc.svg_renderizado AS "svgRenderizado",
        pc.transform_imagen_subida AS "transformImagenSubida",
        pc.comentario_cliente AS "comentarioCliente",
        pc.created_at AS "createdAt",
        json_build_object(
          'idPlantillaCustom', p.id_plantilla_custom,
          'nombrePlantilla', p.nombre_plantilla,
          'descripcion', p.descripcion,
          'precioBase', p.precio_base::numeric,
          'permiteSubirImagen', p.permite_subir_imagen,
          'transformGlobal', p.transform_global,
          'imagenBaseUrl', p.imagen_base_url,
          'activo', p.activo
        ) AS "plantilla",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idOpcionCustom', os.id_opcion_custom,
                'idProductoCustom', os.id_producto_custom,
                'opcionCustom', json_build_object(
                  'idOpcionCustom', oc.id_opcion_custom,
                  'idVariacionCustom', oc.id_variacion_custom,
                  'nombreOpcion', oc.nombre_opcion,
                  'imagenPlantillaUrl', oc.imagen_plantilla_url,
                  'colorHex', oc.color_hex,
                  'precioExtra', oc.precio_extra::numeric,
                  'transformOpcion', oc.transform_opcion,
                  'activo', oc.activo,
                  'variacion', json_build_object(
                    'idVariacionCustom', vc.id_variacion_custom,
                    'idPlantillaCustom', vc.id_plantilla_custom,
                    'nombreVariacion', vc.nombre_variacion,
                    'nroPaso', vc.nro_paso,
                    'ordenCapaSvg', vc.orden_capa_svg,
                    'transformVariante', vc.transform_variante,
                    'activo', vc.activo
                  )
                )
              )
            )
            FROM opciones_seleccionadas os
            JOIN opciones_variacion_custom oc ON oc.id_opcion_custom = os.id_opcion_custom
            JOIN variaciones_custom vc ON vc.id_variacion_custom = oc.id_variacion_custom
            WHERE os.id_producto_custom = pc.id_producto_custom
          ),
          '[]'::json
        ) AS "opcionesSeleccionadas"
      FROM productos_custom pc
      JOIN plantillas_producto_custom p ON p.id_plantilla_custom = pc.id_plantilla_custom
      WHERE pc.id_producto_custom = $1;
    `;
    const res = client ? await client.query(sql, [idProductoCustom]) : await query(sql, [idProductoCustom]);
    return res.rows[0] || null;
  }

  // --- Favoritos de Producto Custom ---
  static async toggleFavorite(idCliente: number, idProductoCustom: string) {
    const existing = await query(
      `SELECT 1 FROM productos_custom_favoritos
       WHERE id_cliente = $1 AND id_producto_custom = $2;`,
      [idCliente, idProductoCustom]
    );

    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM productos_custom_favoritos
         WHERE id_cliente = $1 AND id_producto_custom = $2;`,
        [idCliente, idProductoCustom]
      );
      return { isFavorite: false };
    } else {
      await query(
        `INSERT INTO productos_custom_favoritos (id_cliente, id_producto_custom)
         VALUES ($1, $2);`,
        [idCliente, idProductoCustom]
      );
      return { isFavorite: true };
    }
  }

  static async getClientFavorites(idCliente: number) {
    const sql = `
      SELECT
        pcf.id_cliente AS "idCliente",
        pcf.id_producto_custom AS "idProductoCustom",
        json_build_object(
          'idProductoCustom', pc.id_producto_custom,
          'idPlantillaCustom', pc.id_plantilla_custom,
          'nombreCustom', pc.nombre_custom,
          'precioFinal', pc.precio_final::numeric,
          'imagenSubidaClienteUrl', pc.imagen_subida_cliente_url,
          'svgRenderizado', pc.svg_renderizado,
          'transformImagenSubida', pc.transform_imagen_subida,
          'comentarioCliente', pc.comentario_cliente,
          'createdAt', pc.created_at,
          'plantilla', json_build_object(
            'idPlantillaCustom', p.id_plantilla_custom,
            'nombrePlantilla', p.nombre_plantilla,
            'descripcion', p.descripcion,
            'precioBase', p.precio_base::numeric,
            'permiteSubirImagen', p.permite_subir_imagen,
            'transformGlobal', p.transform_global,
            'imagenBaseUrl', p.imagen_base_url,
            'activo', p.activo
          ),
          'opcionesSeleccionadas', COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'idOpcionCustom', os.id_opcion_custom,
                  'idProductoCustom', os.id_producto_custom,
                  'opcionCustom', json_build_object(
                    'idOpcionCustom', oc.id_opcion_custom,
                    'idVariacionCustom', oc.id_variacion_custom,
                    'nombreOpcion', oc.nombre_opcion,
                    'imagenPlantillaUrl', oc.imagen_plantilla_url,
                    'colorHex', oc.color_hex,
                    'precioExtra', oc.precio_extra::numeric,
                    'transformOpcion', oc.transform_opcion,
                    'activo', oc.activo
                  )
                )
              )
              FROM opciones_seleccionadas os
              JOIN opciones_variacion_custom oc ON oc.id_opcion_custom = os.id_opcion_custom
              WHERE os.id_producto_custom = pc.id_producto_custom
            ),
            '[]'::json
          )
        ) AS "productoCustom"
      FROM productos_custom_favoritos pcf
      JOIN productos_custom pc ON pc.id_producto_custom = pcf.id_producto_custom
      JOIN plantillas_producto_custom p ON p.id_plantilla_custom = pc.id_plantilla_custom
      WHERE pcf.id_cliente = $1
      ORDER BY pcf.id_producto_custom ASC;
    `;
    const res = await query(sql, [idCliente]);
    return res.rows;
  }
}
