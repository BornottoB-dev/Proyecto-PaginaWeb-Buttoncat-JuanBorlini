import { randomUUID } from 'node:crypto';
import { query, withTransaction } from '../../config/db.js';
import type { PoolClient } from 'pg';
import type { EstadoPedido } from '../../types/database.types.js';

export interface OrderItemInput {
  idVariante?: number;
  idProducto?: number;
  idProductoCustom?: string;
  customProduct?: {
    nombre?: string;
    precio?: number;
    svg?: string;
    comentario?: string;
  };
  cantidad: number;
}

export interface CreateOrderInput {
  idCliente?: number;
  idMetodoPago?: number;
  codigoPremio?: string;
  nombreCompleto: string;
  telefonoContacto: string;
  correoContacto: string;
  provinciaEntrega?: string;
  localidadEntrega?: string;
  calleEntrega?: string;
  alturaEntrega?: number;
  codigoPostal?: string;
  deptoEntrega?: number;
  costoDeEnvio?: number;
  items: OrderItemInput[];
}

export interface OrderFilters {
  idCliente?: number;
  estado?: EstadoPedido;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class OrderService {
  private static baseSelectQuery(): string {
    return `
      SELECT 
        p.id_pedido::text AS "idPedido",
        p.id_cliente AS "idCliente",
        p.id_metodo_pago AS "idMetodoPago",
        p.codigo_premio AS "codigoPremio",
        p.fecha_emision AS "fechaEmision",
        p.nombre_completo AS "nombreCompleto",
        p.telefono_contacto AS "telefonoContacto",
        p.correo_contacto AS "correoContacto",
        p.provincia_entrega AS "provinciaEntrega",
        p.localidad_entrega AS "localidadEntrega",
        p.calle_entrega AS "calleEntrega",
        p.altura_entrega AS "alturaEntrega",
        p.codigo_postal AS "codigoPostal",
        p.depto_entrega AS "deptoEntrega",
        p.codigo_seguimiento AS "codigoSeguimiento",
        p.costo_de_envio AS "costoDeEnvio",
        p.descuento,
        p.total,
        p.estado,
        json_build_object(
          'idCliente', c.id_cliente,
          'nombreCompleto', c.nombre_completo,
          'correo', c.correo
        ) AS "cliente",
        json_build_object(
          'idMetodoPago', mp.id_metodo_pago,
          'nombreMetodoPago', mp.nombre_metodo_pago,
          'porcentajeDescuento', mp.porcentaje_descuento,
          'activo', mp.activo
        ) AS "metodoPago",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'numeroItem', dp.numero_item,
                'idPedido', dp.id_pedido::text,
                'idVariante', dp.id_variante,
                'idProductoCustom', dp.id_producto_custom,
                'cantidad', dp.cantidad,
                'subtotal', dp.subtotal,
                'variante', CASE WHEN v.id_variante IS NOT NULL THEN
                  json_build_object(
                    'idVariante', v.id_variante,
                    'sku', v.sku,
                    'stock', v.stock,
                    'precioFinal', v.precio_final,
                    'producto', json_build_object(
                      'idProducto', prod.id_producto,
                      'nombreProducto', prod.nombre_producto,
                      'codigoProducto', prod.codigo_producto
                    )
                  )
                ELSE NULL END,
                'productoCustom', CASE WHEN pc.id_producto_custom IS NOT NULL THEN
                  json_build_object(
                    'idProductoCustom', pc.id_producto_custom,
                    'nombreCustom', pc.nombre_custom,
                    'precioFinal', pc.precio_final,
                    'svgRenderizado', pc.svg_renderizado
                  )
                ELSE NULL END
              ) ORDER BY dp.numero_item ASC
            )
            FROM detalles_pedido dp
            LEFT JOIN variantes v ON v.id_variante = dp.id_variante
            LEFT JOIN productos prod ON prod.id_producto = v.id_producto
            LEFT JOIN productos_custom pc ON pc.id_producto_custom = dp.id_producto_custom
            WHERE dp.id_pedido = p.id_pedido
          ),
          '[]'::json
        ) AS "detalles"
      FROM pedidos_cliente p
      JOIN clientes c ON c.id_cliente = p.id_cliente
      JOIN metodos_pago mp ON mp.id_metodo_pago = p.id_metodo_pago
    `;
  }

  static async create(data: CreateOrderInput) {
    if (!data.items || data.items.length === 0) {
      throw new Error('El pedido debe contener al menos un item');
    }

    return withTransaction(async (client) => {
      // 0. Resolver o crear cliente por correo si no se proporciona idCliente
      let resolvedClienteId = data.idCliente;
      if (!resolvedClienteId) {
        const clientLookup = await client.query(
          `SELECT id_cliente AS "idCliente" FROM clientes WHERE correo = $1;`,
          [data.correoContacto.trim().toLowerCase()]
        );
        if (clientLookup.rows.length > 0) {
          resolvedClienteId = clientLookup.rows[0].idCliente;
        } else {
          const insertClient = await client.query(
            `
            INSERT INTO clientes (correo, nombre_completo, telefono, contrasena_hash)
            VALUES ($1, $2, $3, 'guest-account')
            RETURNING id_cliente AS "idCliente";
          `,
            [
              data.correoContacto.trim().toLowerCase(),
              data.nombreCompleto.trim(),
              data.telefonoContacto.trim(),
            ]
          );
          resolvedClienteId = insertClient.rows[0].idCliente;
        }
      }

      // 1. Validar metodo de pago (fallback al primer metodo activo si no se pasa)
      let resolvedMetodoPagoId = data.idMetodoPago;
      if (!resolvedMetodoPagoId) {
        const firstMetodo = await client.query(
          `SELECT id_metodo_pago AS "idMetodoPago" FROM metodos_pago WHERE activo = true LIMIT 1;`
        );
        resolvedMetodoPagoId = firstMetodo.rows[0] ? firstMetodo.rows[0].idMetodoPago : 1;
      }

      const mpRes = await client.query(
        `SELECT id_metodo_pago AS "idMetodoPago", porcentaje_descuento AS "porcentajeDescuento", activo FROM metodos_pago WHERE id_metodo_pago = $1;`,
        [resolvedMetodoPagoId]
      );
      const metodoPago = mpRes.rows[0];
      if (!metodoPago || !metodoPago.activo) {
        throw new Error('Metodo de pago no valido o inactivo');
      }

      // 2. Validar cupon de premio si existe
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str));

      let validRewardUuid: string | null = null;
      let rewardMeta: { titulo: string; descripcion: string; precioVariante?: number } | null = null;
      let staticPromoCode: string | null = null;

      if (data.codigoPremio) {
        const cleanCode = data.codigoPremio.trim();
        if (isUUID(cleanCode)) {
          const premioRes = await client.query(
            `
            SELECT 
              pc.codigo_premio, 
              pc.estado, 
              pc.fecha_expiracion, 
              pr.costo_puntos,
              pr.titulo,
              pr.descripcion,
              v.precio_final AS "precioVariante"
            FROM premios_cliente pc
            JOIN premios pr ON pr.id_premio = pc.id_premio
            LEFT JOIN variantes v ON v.id_variante = pr.id_variante
            WHERE pc.codigo_premio = $1;
          `,
            [cleanCode]
          );
          const premioCliente = premioRes.rows[0];

          if (!premioCliente || premioCliente.estado !== 'DISPONIBLE') {
            throw new Error('El codigo de premio no es valido o ya ha sido utilizado');
          }

          if (new Date() > new Date(premioCliente.fecha_expiracion)) {
            throw new Error('El codigo de premio ha expirado');
          }

          await client.query(`UPDATE premios_cliente SET estado = 'USADO' WHERE codigo_premio = $1;`, [
            cleanCode,
          ]);
          validRewardUuid = cleanCode;
          rewardMeta = {
            titulo: premioCliente.titulo || '',
            descripcion: premioCliente.descripcion || '',
            precioVariante: premioCliente.precioVariante ? Number(premioCliente.precioVariante) : undefined,
          };
        } else {
          staticPromoCode = cleanCode.toUpperCase();
        }
      }

      // 3. Procesar items y validar stock
      let subtotalTotal = 0;
      const processedItems: {
        numeroItem: number;
        idVariante?: number;
        idProductoCustom?: string;
        cantidad: number;
        subtotal: number;
      }[] = [];

      let itemIndex = 1;
      for (const item of data.items) {
        if (item.cantidad <= 0) {
          throw new Error('La cantidad debe ser mayor a 0');
        }

        let variantId = item.idVariante;
        if (!variantId && item.idProducto) {
          const foundVar = await client.query(
            `SELECT id_variante FROM variantes WHERE id_producto = $1 AND activo = true LIMIT 1;`,
            [item.idProducto]
          );
          if (foundVar.rows.length > 0) {
            variantId = foundVar.rows[0].id_variante;
          }
        }

        if (variantId) {
          const varRes = await client.query(
            `SELECT id_variante, sku, stock, precio_final, activo FROM variantes WHERE id_variante = $1 FOR UPDATE;`,
            [variantId]
          );
          const variante = varRes.rows[0];

          if (!variante || !variante.activo) {
            throw new Error(`Variante con ID ${variantId} no disponible`);
          }

          if (variante.stock < item.cantidad) {
            throw new Error(
              `Stock insuficiente para SKU "${variante.sku}". Stock disponible: ${variante.stock}`
            );
          }

          // Decrementar stock
          await client.query(`UPDATE variantes SET stock = stock - $1 WHERE id_variante = $2;`, [
            item.cantidad,
            variantId,
          ]);

          const subtotalItem = Number(variante.precio_final) * item.cantidad;
          subtotalTotal += subtotalItem;

          processedItems.push({
            numeroItem: itemIndex++,
            idVariante: variantId,
            cantidad: item.cantidad,
            subtotal: subtotalItem,
          });
        } else if (item.idProductoCustom || item.customProduct) {
          let customId = item.idProductoCustom;
          let precioCustom = 0;

          if (isUUID(customId)) {
            const customRes = await client.query(
              `SELECT id_producto_custom, precio_final FROM productos_custom WHERE id_producto_custom = $1;`,
              [customId]
            );
            if (customRes.rows.length > 0) {
              precioCustom = Number(customRes.rows[0].precio_final);
            } else {
              customId = undefined;
            }
          }

          if (!customId || !isUUID(customId)) {
            const tplRes = await client.query(
              `SELECT id_plantilla_custom FROM plantillas_producto_custom WHERE activo = true LIMIT 1;`
            );
            const templateId = tplRes.rows[0]?.id_plantilla_custom || 1;
            const newCustomId = randomUUID();
            const customName = item.customProduct?.nombre || 'Producto Personalizado';
            precioCustom = Number(item.customProduct?.precio || 1500);
            const svgContent =
              item.customProduct?.svg ||
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Personalizado</text></svg>';

            await client.query(
              `INSERT INTO productos_custom (
                id_producto_custom, id_plantilla_custom, nombre_custom, precio_final,
                svg_renderizado, comentario_cliente
              ) VALUES ($1, $2, $3, $4, $5, $6);`,
              [
                newCustomId,
                templateId,
                customName,
                precioCustom,
                svgContent,
                item.customProduct?.comentario || null,
              ]
            );
            customId = newCustomId;
          }

          const subtotalItem = precioCustom * item.cantidad;
          subtotalTotal += subtotalItem;

          processedItems.push({
            numeroItem: itemIndex++,
            idProductoCustom: customId,
            cantidad: item.cantidad,
            subtotal: subtotalItem,
          });
        } else {
          throw new Error('Cada item debe especificar un idVariante o un idProductoCustom');
        }
      }

      // 4. Calcular descuento por cupon y por metodo de pago
      let descuentoPremio = 0;
      let isFreeShippingPromo = false;

      if (rewardMeta) {
        const fullText = `${rewardMeta.titulo} ${rewardMeta.descripcion}`.toUpperCase();
        if (fullText.includes('ENVIO GRATIS') || fullText.includes('ENVÍO GRATIS')) {
          isFreeShippingPromo = true;
        } else {
          const dollarMatch = fullText.match(/\$\s*([\d.]+)/);
          const pctMatch = fullText.match(/(\d+)%/);
          if (dollarMatch) {
            const parsedAmount = parseFloat(dollarMatch[1].replace(/\./g, ''));
            if (!isNaN(parsedAmount) && parsedAmount > 0) {
              descuentoPremio = Math.min(subtotalTotal, parsedAmount);
            }
          } else if (pctMatch) {
            const pct = parseInt(pctMatch[1], 10);
            if (!isNaN(pct) && pct > 0) {
              descuentoPremio = (subtotalTotal * pct) / 100;
            }
          } else if (rewardMeta.precioVariante) {
            descuentoPremio = Math.min(subtotalTotal, rewardMeta.precioVariante);
          } else {
            descuentoPremio = (subtotalTotal * 10) / 100;
          }
        }
      } else if (staticPromoCode) {
        if (staticPromoCode === 'BUTTONCAT10' || staticPromoCode === 'WELCOME10') {
          descuentoPremio = (subtotalTotal * 10) / 100;
        } else if (staticPromoCode === 'FREESHIP' || staticPromoCode === 'BTC-FREESHIP') {
          isFreeShippingPromo = true;
        }
      }

      const porcentajeDescuentoPago = Number(metodoPago.porcentajeDescuento) || 0;
      const descuentoPago = Math.max(0, ((subtotalTotal - descuentoPremio) * porcentajeDescuentoPago) / 100);
      const descuentoTotal = descuentoPago + descuentoPremio;

      const costoEnvio = isFreeShippingPromo ? 0 : (data.costoDeEnvio ?? 0);
      const totalFinal = Math.max(0, subtotalTotal - descuentoTotal + costoEnvio);

      // 5. Crear el PedidoCliente
      const insertOrderSql = `
        INSERT INTO pedidos_cliente (
          id_cliente, id_metodo_pago, codigo_premio, nombre_completo, telefono_contacto,
          correo_contacto, provincia_entrega, localidad_entrega, calle_entrega,
          altura_entrega, codigo_postal, depto_entrega, costo_de_envio, descuento,
          total, estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'PENDIENTE')
        RETURNING id_pedido;
      `;
      const orderRes = await client.query(insertOrderSql, [
        resolvedClienteId,
        resolvedMetodoPagoId,
        validRewardUuid,
        data.nombreCompleto.trim(),
        data.telefonoContacto.trim(),
        data.correoContacto.trim().toLowerCase(),
        data.provinciaEntrega || null,
        data.localidadEntrega || null,
        data.calleEntrega || null,
        data.alturaEntrega || null,
        data.codigoPostal || null,
        data.deptoEntrega || null,
        costoEnvio,
        descuentoTotal,
        totalFinal,
      ]);

      const idPedido = orderRes.rows[0].id_pedido;

      // Insertar detalles
      for (const pi of processedItems) {
        await client.query(
          `
          INSERT INTO detalles_pedido (numero_item, id_pedido, id_variante, id_producto_custom, cantidad, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6);
        `,
          [
            pi.numeroItem,
            idPedido,
            pi.idVariante || null,
            pi.idProductoCustom || null,
            pi.cantidad,
            pi.subtotal,
          ]
        );
      }

      // 6. Otorgar puntos de fidelizacion al cliente
      const puntosOtorgados = Math.floor(totalFinal / 100);
      if (puntosOtorgados > 0) {
        await client.query(`UPDATE clientes SET puntos = puntos + $1 WHERE id_cliente = $2;`, [
          puntosOtorgados,
          resolvedClienteId,
        ]);
      }

      const created = await this.getById(idPedido, client);
      return created;
    });
  }

  static async getAll(filters: OrderFilters = {}) {
    const whereConditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.idCliente) {
      whereConditions.push(`p.id_cliente = $${idx++}`);
      params.push(filters.idCliente);
    }
    if (filters.estado) {
      whereConditions.push(`p.estado = $${idx++}`);
      params.push(filters.estado);
    }
    if (filters.fechaDesde) {
      whereConditions.push(`p.fecha_emision >= $${idx++}`);
      params.push(filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      whereConditions.push(`p.fecha_emision <= $${idx++}`);
      params.push(filters.fechaHasta);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const sql = `${this.baseSelectQuery()} ${whereClause} ORDER BY p.id_pedido DESC;`;

    const res = await query(sql, params);
    return res.rows;
  }

  static async getById(idPedido: string | bigint | number, dbClient?: PoolClient) {
    const sql = `${this.baseSelectQuery()} WHERE p.id_pedido = $1;`;
    const res = dbClient ? await dbClient.query(sql, [idPedido]) : await query(sql, [idPedido]);
    return res.rows[0] || null;
  }

  static async updateStatus(idPedido: string | bigint | number, estado: EstadoPedido) {
    const sql = `
      UPDATE pedidos_cliente
      SET estado = $1
      WHERE id_pedido = $2;
    `;
    await query(sql, [estado, idPedido]);
    return this.getById(idPedido);
  }

  static async updateTracking(
    idPedido: string | bigint | number,
    data: { codigoSeguimiento?: string; costoDeEnvio?: number }
  ) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.codigoSeguimiento !== undefined) {
      sets.push(`codigo_seguimiento = $${idx++}`);
      values.push(data.codigoSeguimiento);
    }
    if (data.costoDeEnvio !== undefined) {
      sets.push(`costo_de_envio = $${idx++}`);
      values.push(data.costoDeEnvio);
    }

    if (sets.length > 0) {
      values.push(idPedido);
      await query(`UPDATE pedidos_cliente SET ${sets.join(', ')} WHERE id_pedido = $${idx};`, values);
    }

    return this.getById(idPedido);
  }

  static async delete(idPedido: string | bigint | number) {
    const sql = `DELETE FROM pedidos_cliente WHERE id_pedido = $1 RETURNING id_pedido AS "idPedido";`;
    const res = await query(sql, [idPedido]);
    return res.rows[0];
  }
}
