import { query } from '../../config/db.js';

export class PaymentService {
  static async getAll(onlyActive: boolean = true) {
    const sql = `
      SELECT 
        id_metodo_pago AS "idMetodoPago",
        nombre_metodo_pago AS "nombreMetodoPago",
        porcentaje_descuento AS "porcentajeDescuento",
        activo,
        datos_bancarios AS "datosBancarios"
      FROM metodos_pago
      WHERE ($1::boolean IS NULL OR activo = true)
      ORDER BY id_metodo_pago ASC;
    `;
    const res = await query(sql, [onlyActive ? true : null]);
    return res.rows;
  }

  static async getById(idMetodoPago: number) {
    const sql = `
      SELECT 
        id_metodo_pago AS "idMetodoPago",
        nombre_metodo_pago AS "nombreMetodoPago",
        porcentaje_descuento AS "porcentajeDescuento",
        activo,
        datos_bancarios AS "datosBancarios"
      FROM metodos_pago
      WHERE id_metodo_pago = $1;
    `;
    const res = await query(sql, [idMetodoPago]);
    return res.rows[0] || null;
  }

  static async create(data: {
    nombreMetodoPago: string;
    porcentajeDescuento?: number;
    datosBancarios?: string;
  }) {
    const sql = `
      INSERT INTO metodos_pago (nombre_metodo_pago, porcentaje_descuento, datos_bancarios)
      VALUES ($1, $2, $3)
      RETURNING 
        id_metodo_pago AS "idMetodoPago",
        nombre_metodo_pago AS "nombreMetodoPago",
        porcentaje_descuento AS "porcentajeDescuento",
        activo,
        datos_bancarios AS "datosBancarios";
    `;
    const res = await query(sql, [
      data.nombreMetodoPago.trim(),
      data.porcentajeDescuento ?? 0,
      data.datosBancarios?.trim() || null,
    ]);
    return res.rows[0];
  }

  static async update(
    idMetodoPago: number,
    data: {
      nombreMetodoPago?: string;
      porcentajeDescuento?: number;
      activo?: boolean;
      datosBancarios?: string;
    }
  ) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreMetodoPago !== undefined) {
      sets.push(`nombre_metodo_pago = $${idx++}`);
      values.push(data.nombreMetodoPago.trim());
    }
    if (data.porcentajeDescuento !== undefined) {
      sets.push(`porcentaje_descuento = $${idx++}`);
      values.push(data.porcentajeDescuento);
    }
    if (data.activo !== undefined) {
      sets.push(`activo = $${idx++}`);
      values.push(data.activo);
    }
    if (data.datosBancarios !== undefined) {
      sets.push(`datos_bancarios = $${idx++}`);
      values.push(data.datosBancarios.trim() || null);
    }

    if (sets.length === 0) {
      return this.getById(idMetodoPago);
    }

    values.push(idMetodoPago);
    const sql = `
      UPDATE metodos_pago
      SET ${sets.join(', ')}
      WHERE id_metodo_pago = $${idx}
      RETURNING 
        id_metodo_pago AS "idMetodoPago",
        nombre_metodo_pago AS "nombreMetodoPago",
        porcentaje_descuento AS "porcentajeDescuento",
        activo,
        datos_bancarios AS "datosBancarios";
    `;
    const res = await query(sql, values);
    return res.rows[0];
  }

  static async delete(idMetodoPago: number) {
    const sql = `
      UPDATE metodos_pago 
      SET activo = false 
      WHERE id_metodo_pago = $1 
      RETURNING id_metodo_pago AS "idMetodoPago", activo;
    `;
    const res = await query(sql, [idMetodoPago]);
    return res.rows[0];
  }
}
