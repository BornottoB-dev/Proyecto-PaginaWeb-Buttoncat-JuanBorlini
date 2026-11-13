import { query } from '../../config/db.js';

export interface CreateSupplierInput {
  razonSocial: string;
  cuit?: string;
  telefono?: string;
  correo?: string;
}

export interface UpdateSupplierInput {
  razonSocial?: string;
  cuit?: string;
  telefono?: string;
  correo?: string;
  activo?: boolean;
}

export interface CreateExpenseInput {
  idCategoriaGasto: number;
  idMetodoPago: number;
  idProveedor: number;
  conceptoGasto: string;
  montoTotal: number;
  comprobanteUrl?: string;
  fechaGasto?: Date;
}

export interface ExpenseFilters {
  idProveedor?: number;
  idCategoriaGasto?: number;
  idMetodoPago?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class ExpenseService {
  // --- Proveedores ---
  static async getAllSuppliers(onlyActive: boolean = true) {
    const sql = `
      SELECT 
        p.id_proveedor AS "idProveedor",
        p.razon_social AS "razonSocial",
        p.cuit,
        p.telefono,
        p.correo,
        p.activo,
        json_build_object(
          'gastos', (SELECT COUNT(*)::int FROM gastos g WHERE g.id_proveedor = p.id_proveedor)
        ) AS "_count"
      FROM proveedores p
      WHERE ($1::boolean IS NULL OR p.activo = true)
      ORDER BY p.razon_social ASC;
    `;
    const res = await query(sql, [onlyActive ? true : null]);
    return res.rows;
  }

  static async getSupplierById(idProveedor: number) {
    const sql = `
      SELECT 
        p.id_proveedor AS "idProveedor",
        p.razon_social AS "razonSocial",
        p.cuit,
        p.telefono,
        p.correo,
        p.activo,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idGasto', g.id_gasto,
                'conceptoGasto', g.concepto_gasto,
                'montoTotal', g.monto_total,
                'fechaGasto', g.fecha_gasto
              ) ORDER BY g.fecha_gasto DESC
            )
            FROM gastos g
            WHERE g.id_proveedor = p.id_proveedor
          ),
          '[]'::json
        ) AS "gastos"
      FROM proveedores p
      WHERE p.id_proveedor = $1;
    `;
    const res = await query(sql, [idProveedor]);
    return res.rows[0] || null;
  }

  static async createSupplier(data: CreateSupplierInput) {
    const sql = `
      INSERT INTO proveedores (razon_social, cuit, telefono, correo)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id_proveedor AS "idProveedor",
        razon_social AS "razonSocial",
        cuit,
        telefono,
        correo,
        activo;
    `;
    const res = await query(sql, [
      data.razonSocial.trim(),
      data.cuit?.trim() || null,
      data.telefono?.trim() || null,
      data.correo?.trim().toLowerCase() || null,
    ]);
    return res.rows[0];
  }

  static async updateSupplier(idProveedor: number, data: UpdateSupplierInput) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.razonSocial !== undefined) {
      sets.push(`razon_social = $${idx++}`);
      values.push(data.razonSocial.trim());
    }
    if (data.cuit !== undefined) {
      sets.push(`cuit = $${idx++}`);
      values.push(data.cuit?.trim() || null);
    }
    if (data.telefono !== undefined) {
      sets.push(`telefono = $${idx++}`);
      values.push(data.telefono?.trim() || null);
    }
    if (data.correo !== undefined) {
      sets.push(`correo = $${idx++}`);
      values.push(data.correo?.trim().toLowerCase() || null);
    }
    if (data.activo !== undefined) {
      sets.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (sets.length === 0) {
      return this.getSupplierById(idProveedor);
    }

    values.push(idProveedor);
    const sql = `
      UPDATE proveedores
      SET ${sets.join(', ')}
      WHERE id_proveedor = $${idx}
      RETURNING 
        id_proveedor AS "idProveedor",
        razon_social AS "razonSocial",
        cuit,
        telefono,
        correo,
        activo;
    `;
    const res = await query(sql, values);
    return res.rows[0];
  }

  static async deleteSupplier(idProveedor: number) {
    const sql = `
      UPDATE proveedores 
      SET activo = false 
      WHERE id_proveedor = $1 
      RETURNING id_proveedor AS "idProveedor", activo;
    `;
    const res = await query(sql, [idProveedor]);
    return res.rows[0];
  }

  // --- Categorias de Gasto ---
  static async getAllCategories(onlyActive: boolean = true) {
    const sql = `
      SELECT 
        id_categoria_gasto AS "idCategoriaGasto",
        nombre_categoria AS "nombreCategoria",
        descripcion,
        activo
      FROM categorias_gasto
      WHERE ($1::boolean IS NULL OR activo = true)
      ORDER BY nombre_categoria ASC;
    `;
    const res = await query(sql, [onlyActive ? true : null]);
    return res.rows;
  }

  static async createCategory(data: { nombreCategoria: string; descripcion?: string }) {
    const sql = `
      INSERT INTO categorias_gasto (nombre_categoria, descripcion)
      VALUES ($1, $2)
      RETURNING 
        id_categoria_gasto AS "idCategoriaGasto",
        nombre_categoria AS "nombreCategoria",
        descripcion,
        activo;
    `;
    const res = await query(sql, [data.nombreCategoria.trim(), data.descripcion?.trim() || null]);
    return res.rows[0];
  }

  static async updateCategory(
    idCategoriaGasto: number,
    data: { nombreCategoria?: string; descripcion?: string; activo?: boolean }
  ) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreCategoria !== undefined) {
      sets.push(`nombre_categoria = $${idx++}`);
      values.push(data.nombreCategoria.trim());
    }
    if (data.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      values.push(data.descripcion?.trim() || null);
    }
    if (data.activo !== undefined) {
      sets.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (sets.length === 0) {
      const existing = await query(
        `SELECT id_categoria_gasto AS "idCategoriaGasto", nombre_categoria AS "nombreCategoria", descripcion, activo FROM categorias_gasto WHERE id_categoria_gasto = $1;`,
        [idCategoriaGasto]
      );
      return existing.rows[0];
    }

    values.push(idCategoriaGasto);
    const sql = `
      UPDATE categorias_gasto
      SET ${sets.join(', ')}
      WHERE id_categoria_gasto = $${idx}
      RETURNING 
        id_categoria_gasto AS "idCategoriaGasto",
        nombre_categoria AS "nombreCategoria",
        descripcion,
        activo;
    `;
    const res = await query(sql, values);
    return res.rows[0];
  }

  // --- Gastos ---
  private static baseExpenseQuery(): string {
    return `
      SELECT 
        g.id_gasto AS "idGasto",
        g.id_categoria_gasto AS "idCategoriaGasto",
        g.id_metodo_pago AS "idMetodoPago",
        g.id_proveedor AS "idProveedor",
        g.concepto_gasto AS "conceptoGasto",
        g.monto_total AS "montoTotal",
        g.comprobante_url AS "comprobanteUrl",
        g.fecha_gasto AS "fechaGasto",
        json_build_object(
          'idProveedor', prov.id_proveedor,
          'razonSocial', prov.razon_social,
          'cuit', prov.cuit
        ) AS "proveedor",
        json_build_object(
          'idCategoriaGasto', cg.id_categoria_gasto,
          'nombreCategoria', cg.nombre_categoria
        ) AS "categoriaGasto",
        json_build_object(
          'idMetodoPago', mp.id_metodo_pago,
          'nombreMetodoPago', mp.nombre_metodo_pago
        ) AS "metodoPago"
      FROM gastos g
      JOIN proveedores prov ON prov.id_proveedor = g.id_proveedor
      JOIN categorias_gasto cg ON cg.id_categoria_gasto = g.id_categoria_gasto
      JOIN metodos_pago mp ON mp.id_metodo_pago = g.id_metodo_pago
    `;
  }

  static async getAllExpenses(filters: ExpenseFilters = {}) {
    const whereConditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.idProveedor) {
      whereConditions.push(`g.id_proveedor = $${idx++}`);
      params.push(filters.idProveedor);
    }
    if (filters.idCategoriaGasto) {
      whereConditions.push(`g.id_categoria_gasto = $${idx++}`);
      params.push(filters.idCategoriaGasto);
    }
    if (filters.idMetodoPago) {
      whereConditions.push(`g.id_metodo_pago = $${idx++}`);
      params.push(filters.idMetodoPago);
    }
    if (filters.fechaDesde) {
      whereConditions.push(`g.fecha_gasto >= $${idx++}`);
      params.push(filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      whereConditions.push(`g.fecha_gasto <= $${idx++}`);
      params.push(filters.fechaHasta);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const sql = `${this.baseExpenseQuery()} ${whereClause} ORDER BY g.fecha_gasto DESC;`;

    const res = await query(sql, params);
    return res.rows;
  }

  static async getExpenseById(idGasto: number) {
    const sql = `${this.baseExpenseQuery()} WHERE g.id_gasto = $1;`;
    const res = await query(sql, [idGasto]);
    return res.rows[0] || null;
  }

  static async createExpense(data: CreateExpenseInput) {
    const insertSql = `
      INSERT INTO gastos (
        id_categoria_gasto, id_metodo_pago, id_proveedor, concepto_gasto,
        monto_total, comprobante_url, fecha_gasto
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_gasto;
    `;
    const res = await query(insertSql, [
      data.idCategoriaGasto,
      data.idMetodoPago,
      data.idProveedor,
      data.conceptoGasto.trim(),
      data.montoTotal,
      data.comprobanteUrl || null,
      data.fechaGasto || new Date(),
    ]);

    return this.getExpenseById(res.rows[0].id_gasto);
  }

  static async updateExpense(idGasto: number, data: Partial<CreateExpenseInput>) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.idCategoriaGasto !== undefined) {
      sets.push(`id_categoria_gasto = $${idx++}`);
      values.push(data.idCategoriaGasto);
    }
    if (data.idMetodoPago !== undefined) {
      sets.push(`id_metodo_pago = $${idx++}`);
      values.push(data.idMetodoPago);
    }
    if (data.idProveedor !== undefined) {
      sets.push(`id_proveedor = $${idx++}`);
      values.push(data.idProveedor);
    }
    if (data.conceptoGasto !== undefined) {
      sets.push(`concepto_gasto = $${idx++}`);
      values.push(data.conceptoGasto.trim());
    }
    if (data.montoTotal !== undefined) {
      sets.push(`monto_total = $${idx++}`);
      values.push(data.montoTotal);
    }
    if (data.comprobanteUrl !== undefined) {
      sets.push(`comprobante_url = $${idx++}`);
      values.push(data.comprobanteUrl || null);
    }
    if (data.fechaGasto !== undefined) {
      sets.push(`fecha_gasto = $${idx++}`);
      values.push(data.fechaGasto);
    }

    if (sets.length > 0) {
      values.push(idGasto);
      await query(`UPDATE gastos SET ${sets.join(', ')} WHERE id_gasto = $${idx};`, values);
    }

    return this.getExpenseById(idGasto);
  }

  static async deleteExpense(idGasto: number) {
    const sql = `DELETE FROM gastos WHERE id_gasto = $1 RETURNING id_gasto AS "idGasto";`;
    const res = await query(sql, [idGasto]);
    return res.rows[0];
  }

  static async getSummary() {
    const totalSql = `
      SELECT 
        COALESCE(SUM(monto_total), 0) AS "totalMonto",
        COUNT(id_gasto)::int AS "totalGastos"
      FROM gastos;
    `;
    const totalRes = await query(totalSql);
    const totals = totalRes.rows[0];

    const categorySql = `
      SELECT 
        cg.id_categoria_gasto AS "idCategoriaGasto",
        cg.nombre_categoria AS "nombreCategoria",
        COALESCE(SUM(g.monto_total), 0) AS "total",
        COUNT(g.id_gasto)::int AS "count"
      FROM categorias_gasto cg
      LEFT JOIN gastos g ON g.id_categoria_gasto = cg.id_categoria_gasto
      GROUP BY cg.id_categoria_gasto, cg.nombre_categoria
      HAVING COUNT(g.id_gasto) > 0;
    `;
    const catRes = await query(categorySql);

    return {
      totalMonto: Number(totals.totalMonto) || 0,
      totalGastos: totals.totalGastos || 0,
      porCategoria: catRes.rows.map((r) => ({
        idCategoriaGasto: r.idCategoriaGasto,
        nombreCategoria: r.nombreCategoria,
        total: Number(r.total) || 0,
        count: r.count,
      })),
    };
  }
}
