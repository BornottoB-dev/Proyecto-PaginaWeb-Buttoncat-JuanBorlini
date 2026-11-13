import { randomUUID } from 'node:crypto';
import { query, withTransaction } from '../../config/db.js';

export interface CreateRewardInput {
  idCategoriaPremio: number;
  idVariante?: number;
  titulo: string;
  descripcion: string;
  costoPuntos: number;
  imagenPremioUrl: string;
  stockPremios: number;
}

export interface UpdateRewardInput {
  idCategoriaPremio?: number;
  idVariante?: number;
  titulo?: string;
  descripcion?: string;
  costoPuntos?: number;
  imagenPremioUrl?: string;
  stockPremios?: number;
  activo?: boolean;
}

export class RewardService {
  // --- Categorias de Premio ---
  static async getCategories() {
    const sql = `
      SELECT 
        cp.id_categoria_premio AS "idCategoriaPremio",
        cp.categoria,
        json_build_object(
          'premios', (SELECT COUNT(*)::int FROM premios pr WHERE pr.id_categoria_premio = cp.id_categoria_premio)
        ) AS "_count"
      FROM categorias_premio cp
      ORDER BY cp.categoria ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async createCategory(categoria: string) {
    const sql = `
      INSERT INTO categorias_premio (categoria)
      VALUES ($1)
      RETURNING id_categoria_premio AS "idCategoriaPremio", categoria;
    `;
    const res = await query(sql, [categoria.trim()]);
    return res.rows[0];
  }

  static async updateCategory(idCategoriaPremio: number, categoria: string) {
    const sql = `
      UPDATE categorias_premio
      SET categoria = $1
      WHERE id_categoria_premio = $2
      RETURNING id_categoria_premio AS "idCategoriaPremio", categoria;
    `;
    const res = await query(sql, [categoria.trim(), idCategoriaPremio]);
    return res.rows[0];
  }

  static async deleteCategory(idCategoriaPremio: number) {
    const sql = `
      DELETE FROM categorias_premio
      WHERE id_categoria_premio = $1
      RETURNING id_categoria_premio AS "idCategoriaPremio";
    `;
    const res = await query(sql, [idCategoriaPremio]);
    return res.rows[0];
  }

  // --- Catalogo de Premios ---
  static async getAll(onlyActive: boolean = true) {
    const sql = `
      SELECT 
        pr.id_premio AS "idPremio",
        pr.id_categoria_premio AS "idCategoriaPremio",
        pr.id_variante AS "idVariante",
        pr.titulo,
        pr.descripcion,
        pr.costo_puntos AS "costoPuntos",
        pr.imagen_premio_url AS "imagenPremioUrl",
        pr.stock_premios AS "stockPremios",
        pr.activo,
        json_build_object(
          'idCategoriaPremio', cp.id_categoria_premio,
          'categoria', cp.categoria
        ) AS "categoriaPremio",
        CASE WHEN v.id_variante IS NOT NULL THEN
          json_build_object(
            'idVariante', v.id_variante,
            'sku', v.sku,
            'stock', v.stock,
            'precioFinal', v.precio_final,
            'producto', json_build_object(
              'idProducto', prod.id_producto,
              'nombreProducto', prod.nombre_producto
            )
          )
        ELSE NULL END AS "variante"
      FROM premios pr
      JOIN categorias_premio cp ON cp.id_categoria_premio = pr.id_categoria_premio
      LEFT JOIN variantes v ON v.id_variante = pr.id_variante
      LEFT JOIN productos prod ON prod.id_producto = v.id_producto
      WHERE ($1::boolean IS NULL OR (pr.activo = true AND pr.stock_premios > 0))
      ORDER BY pr.costo_puntos ASC;
    `;
    const res = await query(sql, [onlyActive ? true : null]);
    return res.rows;
  }

  static async getById(idPremio: number) {
    const sql = `
      SELECT 
        pr.id_premio AS "idPremio",
        pr.id_categoria_premio AS "idCategoriaPremio",
        pr.id_variante AS "idVariante",
        pr.titulo,
        pr.descripcion,
        pr.costo_puntos AS "costoPuntos",
        pr.imagen_premio_url AS "imagenPremioUrl",
        pr.stock_premios AS "stockPremios",
        pr.activo,
        json_build_object(
          'idCategoriaPremio', cp.id_categoria_premio,
          'categoria', cp.categoria
        ) AS "categoriaPremio",
        CASE WHEN v.id_variante IS NOT NULL THEN
          json_build_object(
            'idVariante', v.id_variante,
            'sku', v.sku,
            'stock', v.stock,
            'precioFinal', v.precio_final,
            'producto', json_build_object(
              'idProducto', prod.id_producto,
              'nombreProducto', prod.nombre_producto
            )
          )
        ELSE NULL END AS "variante"
      FROM premios pr
      JOIN categorias_premio cp ON cp.id_categoria_premio = pr.id_categoria_premio
      LEFT JOIN variantes v ON v.id_variante = pr.id_variante
      LEFT JOIN productos prod ON prod.id_producto = v.id_producto
      WHERE pr.id_premio = $1;
    `;
    const res = await query(sql, [idPremio]);
    return res.rows[0] || null;
  }

  static async create(data: CreateRewardInput) {
    let resolvedVarianteId: number | null = data.idVariante || null;
    if (resolvedVarianteId) {
      const pVar = await query(
        `SELECT id_variante FROM variantes WHERE id_producto = $1 AND activo = true LIMIT 1;`,
        [resolvedVarianteId]
      );
      if (pVar.rows.length > 0) {
        resolvedVarianteId = pVar.rows[0].id_variante;
      } else {
        const vCheck = await query(`SELECT id_variante FROM variantes WHERE id_variante = $1 LIMIT 1;`, [
          resolvedVarianteId,
        ]);
        if (vCheck.rows.length === 0) {
          resolvedVarianteId = null;
        }
      }
    }

    const sql = `
      WITH inserted AS (
        INSERT INTO premios (
          id_categoria_premio, id_variante, titulo, descripcion,
          costo_puntos, imagen_premio_url, stock_premios
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_premio
      )
      SELECT id_premio AS "idPremio" FROM inserted;
    `;
    const res = await query(sql, [
      data.idCategoriaPremio,
      resolvedVarianteId,
      data.titulo.trim(),
      data.descripcion.trim(),
      data.costoPuntos,
      data.imagenPremioUrl,
      data.stockPremios,
    ]);
    return this.getById(res.rows[0].idPremio);
  }

  static async update(idPremio: number, data: UpdateRewardInput) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.idCategoriaPremio !== undefined) {
      sets.push(`id_categoria_premio = $${idx++}`);
      values.push(data.idCategoriaPremio);
    }
    if (data.idVariante !== undefined) {
      sets.push(`id_variante = $${idx++}`);
      values.push(data.idVariante || null);
    }
    if (data.titulo !== undefined) {
      sets.push(`titulo = $${idx++}`);
      values.push(data.titulo.trim());
    }
    if (data.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      values.push(data.descripcion.trim());
    }
    if (data.costoPuntos !== undefined) {
      sets.push(`costo_puntos = $${idx++}`);
      values.push(data.costoPuntos);
    }
    if (data.imagenPremioUrl !== undefined) {
      sets.push(`imagen_premio_url = $${idx++}`);
      values.push(data.imagenPremioUrl);
    }
    if (data.stockPremios !== undefined) {
      sets.push(`stock_premios = $${idx++}`);
      values.push(data.stockPremios);
    }
    if (data.activo !== undefined) {
      sets.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (sets.length === 0) {
      return this.getById(idPremio);
    }

    values.push(idPremio);
    const sql = `
      UPDATE premios
      SET ${sets.join(', ')}
      WHERE id_premio = $${idx};
    `;
    await query(sql, values);
    return this.getById(idPremio);
  }

  static async delete(idPremio: number) {
    const sql = `
      UPDATE premios 
      SET activo = false 
      WHERE id_premio = $1 
      RETURNING id_premio AS "idPremio";
    `;
    const res = await query(sql, [idPremio]);
    return res.rows[0];
  }

  // --- Canje de Premios por Cliente ---
  static async claimReward(idCliente: number, idPremio: number, validityDays: number = 30) {
    return withTransaction(async (client) => {
      const clientRes = await client.query(
        `SELECT id_cliente AS "idCliente", puntos FROM clientes WHERE id_cliente = $1 FOR UPDATE;`,
        [idCliente]
      );
      const cliente = clientRes.rows[0];
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      const rewardRes = await client.query(
        `SELECT id_premio AS "idPremio", costo_puntos AS "costoPuntos", stock_premios AS "stockPremios", activo FROM premios WHERE id_premio = $1 FOR UPDATE;`,
        [idPremio]
      );
      const premio = rewardRes.rows[0];
      if (!premio || !premio.activo) {
        throw new Error('Premio no disponible');
      }
      if (premio.stockPremios <= 0) {
        throw new Error('No hay stock disponible para este premio');
      }
      if (cliente.puntos < premio.costoPuntos) {
        throw new Error(
          `Puntos insuficientes. Requiere ${premio.costoPuntos} pts, tiene ${cliente.puntos} pts`
        );
      }

      // 1. Restar puntos al cliente
      await client.query(`UPDATE clientes SET puntos = puntos - $1 WHERE id_cliente = $2;`, [
        premio.costoPuntos,
        idCliente,
      ]);

      // 2. Decrementar stock del premio
      await client.query(`UPDATE premios SET stock_premios = stock_premios - 1 WHERE id_premio = $1;`, [
        idPremio,
      ]);

      // 3. Crear el premio canjeado
      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + validityDays);
      const codigoPremio = randomUUID();

      const insertRes = await client.query(
        `
        INSERT INTO premios_cliente (codigo_premio, id_cliente, id_premio, costo_puntos, fecha_expiracion, estado)
        VALUES ($1, $2, $3, $4, $5, 'DISPONIBLE')
        RETURNING 
          codigo_premio AS "codigoPremio",
          id_cliente AS "idCliente",
          id_premio AS "idPremio",
          costo_puntos AS "costoPuntos",
          fecha_expiracion AS "fechaExpiracion",
          estado;
      `,
        [codigoPremio, idCliente, idPremio, premio.costoPuntos, fechaExpiracion]
      );

      const created = insertRes.rows[0];

      // Incluir objeto premio
      const premioInfo = await client.query(
        `
        SELECT 
          pr.id_premio AS "idPremio",
          pr.id_variante AS "idVariante",
          pr.titulo,
          pr.descripcion,
          pr.costo_puntos AS "costoPuntos",
          pr.imagen_premio_url AS "imagenPremioUrl",
          CASE WHEN v.id_variante IS NOT NULL THEN
            json_build_object(
              'idVariante', v.id_variante,
              'idProducto', v.id_producto
            )
          ELSE NULL END AS "variante"
        FROM premios pr
        LEFT JOIN variantes v ON v.id_variante = pr.id_variante
        WHERE pr.id_premio = $1;
      `,
        [idPremio]
      );

      return {
        ...created,
        premio: premioInfo.rows[0],
      };
    });
  }

  static async getClientRewards(idCliente: number) {
    const sql = `
      SELECT 
        pc.codigo_premio AS "codigoPremio",
        pc.id_cliente AS "idCliente",
        pc.id_premio AS "idPremio",
        pc.estado,
        pc.fecha_expiracion AS "fechaExpiracion",
        pc.costo_puntos AS "costoPuntos",
        json_build_object(
          'idPremio', pr.id_premio,
          'idVariante', pr.id_variante,
          'titulo', pr.titulo,
          'descripcion', pr.descripcion,
          'costoPuntos', pr.costo_puntos,
          'imagenPremioUrl', pr.imagen_premio_url,
          'categoriaPremio', json_build_object(
            'idCategoriaPremio', cp.id_categoria_premio,
            'categoria', cp.categoria
          ),
          'variante', CASE WHEN v.id_variante IS NOT NULL THEN
            json_build_object(
              'idVariante', v.id_variante,
              'idProducto', v.id_producto
            )
          ELSE NULL END
        ) AS "premio"
      FROM premios_cliente pc
      JOIN premios pr ON pr.id_premio = pc.id_premio
      JOIN categorias_premio cp ON cp.id_categoria_premio = pr.id_categoria_premio
      LEFT JOIN variantes v ON v.id_variante = pr.id_variante
      WHERE pc.id_cliente = $1
      ORDER BY pc.fecha_expiracion DESC;
    `;
    const res = await query(sql, [idCliente]);
    return res.rows;
  }

  static async validateRewardCode(codigoPremio: string) {
    const sql = `
      SELECT 
        pc.codigo_premio AS "codigoPremio",
        pc.id_cliente AS "idCliente",
        pc.id_premio AS "idPremio",
        pc.estado,
        pc.fecha_expiracion AS "fechaExpiracion",
        pc.costo_puntos AS "costoPuntos",
        json_build_object(
          'idPremio', pr.id_premio,
          'titulo', pr.titulo,
          'descripcion', pr.descripcion,
          'costoPuntos', pr.costo_puntos,
          'imagenPremioUrl', pr.imagen_premio_url
        ) AS "premio",
        json_build_object(
          'idCliente', c.id_cliente,
          'nombreCompleto', c.nombre_completo,
          'correo', c.correo
        ) AS "cliente"
      FROM premios_cliente pc
      JOIN premios pr ON pr.id_premio = pc.id_premio
      JOIN clientes c ON c.id_cliente = pc.id_cliente
      WHERE pc.codigo_premio = $1;
    `;
    const res = await query(sql, [codigoPremio]);
    const premioCliente = res.rows[0];

    if (!premioCliente) {
      return { valid: false, error: 'Codigo de premio no encontrado' };
    }

    if (premioCliente.estado !== 'DISPONIBLE') {
      return { valid: false, error: `El premio ya no esta disponible (${premioCliente.estado})` };
    }

    if (new Date() > new Date(premioCliente.fechaExpiracion)) {
      return { valid: false, error: 'El premio ha expirado' };
    }

    return { valid: true, data: premioCliente };
  }
}
