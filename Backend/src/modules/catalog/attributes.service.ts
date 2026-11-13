import { query } from '../../config/db.js';

export class AttributeService {
  // --- Estilos ---
  static async getAllStyles() {
    const sql = `
      SELECT id_estilo AS "idEstilo", estilo, color 
      FROM estilos 
      ORDER BY estilo ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async createStyle(data: { estilo: string; color?: string }) {
    const sql = `
      INSERT INTO estilos (estilo, color)
      VALUES ($1, $2)
      RETURNING id_estilo AS "idEstilo", estilo, color;
    `;
    const res = await query(sql, [data.estilo.trim(), data.color?.trim() || null]);
    return res.rows[0];
  }

  static async updateStyle(idEstilo: number, data: { estilo?: string; color?: string }) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.estilo !== undefined) {
      sets.push(`estilo = $${idx++}`);
      values.push(data.estilo.trim());
    }
    if (data.color !== undefined) {
      sets.push(`color = $${idx++}`);
      values.push(data.color?.trim() || null);
    }

    if (sets.length === 0) {
      const existing = await query(`SELECT id_estilo AS "idEstilo", estilo, color FROM estilos WHERE id_estilo = $1;`, [idEstilo]);
      return existing.rows[0];
    }

    values.push(idEstilo);
    const sql = `
      UPDATE estilos
      SET ${sets.join(', ')}
      WHERE id_estilo = $${idx}
      RETURNING id_estilo AS "idEstilo", estilo, color;
    `;
    const res = await query(sql, values);
    return res.rows[0];
  }

  static async deleteStyle(idEstilo: number) {
    const sql = `DELETE FROM estilos WHERE id_estilo = $1 RETURNING id_estilo AS "idEstilo";`;
    const res = await query(sql, [idEstilo]);
    return res.rows[0];
  }

  // --- Etiquetas ---
  static async getAllTags() {
    const sql = `
      SELECT id_etiqueta AS "idEtiqueta", nombre_etiqueta AS "nombreEtiqueta", color 
      FROM etiquetas 
      ORDER BY nombre_etiqueta ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async createTag(data: { nombreEtiqueta: string; color?: string }) {
    const sql = `
      INSERT INTO etiquetas (nombre_etiqueta, color)
      VALUES ($1, $2)
      RETURNING id_etiqueta AS "idEtiqueta", nombre_etiqueta AS "nombreEtiqueta", color;
    `;
    const res = await query(sql, [data.nombreEtiqueta.trim(), data.color?.trim() || null]);
    return res.rows[0];
  }

  static async updateTag(idEtiqueta: number, data: { nombreEtiqueta?: string; color?: string }) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreEtiqueta !== undefined) {
      sets.push(`nombre_etiqueta = $${idx++}`);
      values.push(data.nombreEtiqueta.trim());
    }
    if (data.color !== undefined) {
      sets.push(`color = $${idx++}`);
      values.push(data.color?.trim() || null);
    }

    if (sets.length === 0) {
      const existing = await query(`SELECT id_etiqueta AS "idEtiqueta", nombre_etiqueta AS "nombreEtiqueta", color FROM etiquetas WHERE id_etiqueta = $1;`, [idEtiqueta]);
      return existing.rows[0];
    }

    values.push(idEtiqueta);
    const sql = `
      UPDATE etiquetas
      SET ${sets.join(', ')}
      WHERE id_etiqueta = $${idx}
      RETURNING id_etiqueta AS "idEtiqueta", nombre_etiqueta AS "nombreEtiqueta", color;
    `;
    const res = await query(sql, values);
    return res.rows[0];
  }

  static async deleteTag(idEtiqueta: number) {
    const sql = `DELETE FROM etiquetas WHERE id_etiqueta = $1 RETURNING id_etiqueta AS "idEtiqueta";`;
    const res = await query(sql, [idEtiqueta]);
    return res.rows[0];
  }

  // --- Variaciones y Opciones ---
  static async getAllVariations() {
    const sql = `
      SELECT 
        v.id_variacion AS "idVariacion",
        v.nombre_variacion AS "nombreVariacion",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idOpcionVariacion', o.id_opcion_variacion,
                'idVariacion', o.id_variacion,
                'nombreOpcion', o.nombre_opcion,
                'precioExtra', o.precio_extra
              ) ORDER BY o.nombre_opcion ASC
            )
            FROM opciones_variacion o
            WHERE o.id_variacion = v.id_variacion
          ),
          '[]'::json
        ) AS "opciones"
      FROM variaciones v
      ORDER BY v.nombre_variacion ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async createVariation(nombreVariacion: string) {
    const sql = `
      INSERT INTO variaciones (nombre_variacion)
      VALUES ($1)
      RETURNING id_variacion AS "idVariacion", nombre_variacion AS "nombreVariacion";
    `;
    const res = await query(sql, [nombreVariacion.trim()]);
    return res.rows[0];
  }

  static async addOption(data: { idVariacion: number; nombreOpcion: string; precioExtra?: number }) {
    const sql = `
      INSERT INTO opciones_variacion (id_variacion, nombre_opcion, precio_extra)
      VALUES ($1, $2, $3)
      RETURNING 
        id_opcion_variacion AS "idOpcionVariacion",
        id_variacion AS "idVariacion",
        nombre_opcion AS "nombreOpcion",
        precio_extra AS "precioExtra";
    `;
    const res = await query(sql, [
      data.idVariacion,
      data.nombreOpcion.trim(),
      data.precioExtra ?? 0,
    ]);
    return res.rows[0];
  }

  static async updateOption(idOpcionVariacion: number, data: { nombreOpcion?: string; precioExtra?: number }) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreOpcion !== undefined) {
      sets.push(`nombre_opcion = $${idx++}`);
      values.push(data.nombreOpcion.trim());
    }
    if (data.precioExtra !== undefined) {
      sets.push(`precio_extra = $${idx++}`);
      values.push(data.precioExtra);
    }

    if (sets.length === 0) {
      const existing = await query(`SELECT id_opcion_variacion AS "idOpcionVariacion", id_variacion AS "idVariacion", nombre_opcion AS "nombreOpcion", precio_extra AS "precioExtra" FROM opciones_variacion WHERE id_opcion_variacion = $1;`, [idOpcionVariacion]);
      return existing.rows[0];
    }

    values.push(idOpcionVariacion);
    const sql = `
      UPDATE opciones_variacion
      SET ${sets.join(', ')}
      WHERE id_opcion_variacion = $${idx}
      RETURNING 
        id_opcion_variacion AS "idOpcionVariacion",
        id_variacion AS "idVariacion",
        nombre_opcion AS "nombreOpcion",
        precio_extra AS "precioExtra";
    `;
    const res = await query(sql, values);
    return res.rows[0];
  }

  static async deleteOption(idOpcionVariacion: number) {
    const sql = `DELETE FROM opciones_variacion WHERE id_opcion_variacion = $1 RETURNING id_opcion_variacion AS "idOpcionVariacion";`;
    const res = await query(sql, [idOpcionVariacion]);
    return res.rows[0];
  }
}
