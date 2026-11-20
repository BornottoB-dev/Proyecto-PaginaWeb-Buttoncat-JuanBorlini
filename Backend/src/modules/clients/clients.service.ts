import { query, withTransaction } from '../../config/db.js';
import { AuthService } from '../auth/auth.service.js';
import type { PoolClient } from 'pg';

export interface CreateClientInput {
  correo: string;
  nombreCompleto: string;
  contrasenaHash: string;
  telefono?: string;
  puntos?: number;
}

export interface UpdateClientInput {
  nombreCompleto?: string;
  telefono?: string;
  puntos?: number;
  activo?: boolean;
}

export interface CreateDomicilioInput {
  idLocalidad?: number;
  provincia?: string;
  localidad?: string;
  nombreDomicilio: string;
  calle: string;
  altura: number;
  codigoPostal: string;
  depto?: string;
  esPredeterminado?: boolean;
}

export interface UpdateDomicilioInput {
  idLocalidad?: number;
  provincia?: string;
  localidad?: string;
  nombreDomicilio?: string;
  calle?: string;
  altura?: number;
  codigoPostal?: string;
  depto?: string;
  esPredeterminado?: boolean;
  activo?: boolean;
}

export class ClientService {
  static async getAll(activo?: boolean) {
    await AuthService.ensureDefaultProfiles();
    const sql = `
      SELECT 
        c.id_cliente AS "idCliente",
        c.id_usuario AS "idUsuario",
        c.correo,
        c.nombre_completo AS "nombreCompleto",
        c.telefono,
        c.puntos,
        COALESCE(u.rol, 'CLIENTE') AS "rol",
        c.activo,
        c.created_at AS "createdAt",
        COALESCE(
          (SELECT SUM(p.total)::numeric(12,2) FROM pedidos_cliente p WHERE p.id_cliente = c.id_cliente),
          0
        ) AS "totalGastado",
        json_build_object(
          'pedidos', (SELECT COUNT(*)::int FROM pedidos_cliente p WHERE p.id_cliente = c.id_cliente),
          'domicilios', (SELECT COUNT(*)::int FROM domicilios d WHERE d.id_cliente = c.id_cliente AND d.activo = true),
          'favoritos', (SELECT COUNT(*)::int FROM productos_favoritos f WHERE f.id_cliente = c.id_cliente)
        ) AS "_count",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idDomicilio', d.id_domicilio,
                'idCliente', d.id_cliente,
                'idLocalidad', d.id_localidad,
                'nombreDomicilio', d.nombre_domicilio,
                'calle', d.calle,
                'altura', d.altura,
                'codigoPostal', d.codigo_postal,
                'depto', d.depto,
                'esPredeterminado', d.es_predeterminado,
                'activo', d.activo,
                'localidad', json_build_object(
                  'idLocalidad', l.id_localidad,
                  'idProvincia', l.id_provincia,
                  'localidad', l.localidad,
                  'provincia', json_build_object(
                    'idProvincia', p.id_provincia,
                    'provincia', p.provincia
                  )
                )
              ) ORDER BY d.es_predeterminado DESC, d.id_domicilio ASC
            )
            FROM domicilios d
            JOIN localidades l ON l.id_localidad = d.id_localidad
            JOIN provincias p ON p.id_provincia = l.id_provincia
            WHERE d.id_cliente = c.id_cliente AND d.activo = true
          ),
          '[]'::json
        ) AS "domicilios"
      FROM clientes c
      LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
      WHERE COALESCE(u.rol, c.rol, 'CLIENTE') = 'CLIENTE'
        AND ($1::boolean IS NULL OR c.activo = $1)
      ORDER BY c.nombre_completo ASC;
    `;
    const res = await query(sql, [activo !== undefined ? activo : null]);
    return res.rows;
  }

  static async getById(idCliente: number) {
    const sql = `
      SELECT 
        c.id_cliente AS "idCliente",
        c.correo,
        c.nombre_completo AS "nombreCompleto",
        c.telefono,
        c.puntos,
        c.rol,
        c.activo,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idDomicilio', d.id_domicilio,
                'idCliente', d.id_cliente,
                'idLocalidad', d.id_localidad,
                'nombreDomicilio', d.nombre_domicilio,
                'calle', d.calle,
                'altura', d.altura,
                'codigoPostal', d.codigo_postal,
                'depto', d.depto,
                'esPredeterminado', d.es_predeterminado,
                'activo', d.activo,
                'localidad', json_build_object(
                  'idLocalidad', l.id_localidad,
                  'idProvincia', l.id_provincia,
                  'localidad', l.localidad,
                  'provincia', json_build_object(
                    'idProvincia', p.id_provincia,
                    'provincia', p.provincia
                  )
                )
              ) ORDER BY d.es_predeterminado DESC, d.id_domicilio ASC
            )
            FROM domicilios d
            JOIN localidades l ON l.id_localidad = d.id_localidad
            JOIN provincias p ON p.id_provincia = l.id_provincia
            WHERE d.id_cliente = c.id_cliente AND d.activo = true
          ),
          '[]'::json
        ) AS "domicilios",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idProducto', f.id_producto,
                'idCliente', f.id_cliente,
                'producto', json_build_object(
                  'idProducto', pr.id_producto,
                  'nombreProducto', pr.nombre_producto,
                  'codigoProducto', pr.codigo_producto,
                  'precioBase', pr.precio_base,
                  'categoria', json_build_object(
                    'idCategoria', cat.id_categoria,
                    'nombreCategoria', cat.nombre_categoria
                  ),
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
                  )
                )
              )
            )
            FROM productos_favoritos f
            JOIN productos pr ON pr.id_producto = f.id_producto
            JOIN categorias cat ON cat.id_categoria = pr.id_categoria
            WHERE f.id_cliente = c.id_cliente
          ),
          '[]'::json
        ) AS "favoritos",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'codigoPremio', pc.codigo_premio,
                'idCliente', pc.id_cliente,
                'idPremio', pc.id_premio,
                'estado', pc.estado,
                'fechaExpiracion', pc.fecha_expiracion,
                'costoPuntos', pc.costo_puntos,
                'premio', json_build_object(
                  'idPremio', prem.id_premio,
                  'titulo', prem.titulo,
                  'descripcion', prem.descripcion,
                  'costoPuntos', prem.costo_puntos,
                  'imagenPremioUrl', prem.imagen_premio_url
                )
              )
            )
            FROM premios_cliente pc
            JOIN premios prem ON prem.id_premio = pc.id_premio
            WHERE pc.id_cliente = c.id_cliente AND pc.estado = 'DISPONIBLE'
          ),
          '[]'::json
        ) AS "premios"
      FROM clientes c
      WHERE c.id_cliente = $1;
    `;
    const res = await query(sql, [idCliente]);
    return res.rows[0] || null;
  }

  static async getByEmail(correo: string) {
    const sql = `
      SELECT 
        id_cliente AS "idCliente",
        correo,
        nombre_completo AS "nombreCompleto",
        contrasena_hash AS "contrasenaHash",
        telefono,
        puntos,
        activo,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM clientes
      WHERE correo = $1;
    `;
    const res = await query(sql, [correo.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  static async create(data: CreateClientInput) {
    await AuthService.ensureDefaultProfiles();
    const cleanCorreo = data.correo.toLowerCase().trim();
    const cleanNombre = data.nombreCompleto.trim();
    const cleanTelefono = data.telefono?.trim() || null;
    const cleanPuntos = data.puntos !== undefined ? Number(data.puntos) || 0 : 0;

    return withTransaction(async (tx) => {
      const userRes = await tx.query(
        `INSERT INTO usuarios (correo, nombre_completo, contrasena_hash, rol, activo)
         VALUES ($1, $2, $3, 'CLIENTE', true)
         ON CONFLICT (correo) DO UPDATE
         SET nombre_completo = EXCLUDED.nombre_completo
         RETURNING id_usuario AS "idUsuario", rol;`,
        [cleanCorreo, cleanNombre, data.contrasenaHash]
      );
      const userRow = userRes.rows[0];
      if (userRow.rol === 'ADMIN') {
        throw new Error('El correo pertenece a un Usuario Administrador y no puede registrarse como Cliente.');
      }

      const clientRes = await tx.query(
        `INSERT INTO clientes (id_usuario, correo, nombre_completo, contrasena_hash, telefono, puntos, rol, activo, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'CLIENTE', true, NOW())
         RETURNING 
           id_cliente AS "idCliente",
           id_usuario AS "idUsuario",
           correo,
           nombre_completo AS "nombreCompleto",
           telefono,
           puntos,
           rol,
           activo,
           created_at AS "createdAt";`,
        [userRow.idUsuario, cleanCorreo, cleanNombre, data.contrasenaHash, cleanTelefono, cleanPuntos]
      );
      return clientRes.rows[0];
    });
  }

  static async update(idCliente: number, data: UpdateClientInput) {
    await AuthService.ensureDefaultProfiles();
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombreCompleto !== undefined) {
      sets.push(`nombre_completo = $${idx++}`);
      values.push(data.nombreCompleto.trim());
    }
    if (data.telefono !== undefined) {
      sets.push(`telefono = $${idx++}`);
      values.push(data.telefono?.trim() || null);
    }
    if (data.puntos !== undefined) {
      sets.push(`puntos = $${idx++}`);
      values.push(data.puntos);
    }
    if (data.activo !== undefined) {
      sets.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (sets.length === 0) {
      const existing = await this.getById(idCliente);
      return existing;
    }

    sets.push(`updated_at = NOW()`);
    values.push(idCliente);

    const sql = `
      UPDATE clientes
      SET ${sets.join(', ')}
      WHERE id_cliente = $${idx}
      RETURNING 
        id_cliente AS "idCliente",
        id_usuario AS "idUsuario",
        correo,
        nombre_completo AS "nombreCompleto",
        telefono,
        puntos,
        rol,
        activo,
        updated_at AS "updatedAt";
    `;
    const res = await query(sql, values);
    const updated = res.rows[0];

    if (updated?.idUsuario) {
      await query(
        `UPDATE usuarios
         SET nombre_completo = $1,
             activo = $2,
             updated_at = NOW()
         WHERE id_usuario = $3;`,
        [updated.nombreCompleto, updated.activo, updated.idUsuario]
      );
    }

    return updated;
  }

  static async delete(idCliente: number) {
    await AuthService.ensureDefaultProfiles();
    const clientRes = await query(
      `DELETE FROM clientes WHERE id_cliente = $1 RETURNING id_cliente AS "idCliente", id_usuario AS "idUsuario";`,
      [idCliente]
    );
    const deleted = clientRes.rows[0];
    if (deleted?.idUsuario) {
      await query(
        `DELETE FROM usuarios WHERE id_usuario = $1 AND rol = 'CLIENTE';`,
        [deleted.idUsuario]
      );
    }
    return deleted;
  }

  // --- Domicilios ---
  static async getDomicilios(idCliente: number) {
    const sql = `
      SELECT 
        d.id_domicilio AS "idDomicilio",
        d.id_cliente AS "idCliente",
        d.id_localidad AS "idLocalidad",
        d.nombre_domicilio AS "nombreDomicilio",
        d.calle,
        d.altura,
        d.codigo_postal AS "codigoPostal",
        d.depto,
        d.es_predeterminado AS "esPredeterminado",
        d.activo,
        json_build_object(
          'idLocalidad', l.id_localidad,
          'idProvincia', l.id_provincia,
          'localidad', l.localidad,
          'provincia', json_build_object(
            'idProvincia', p.id_provincia,
            'provincia', p.provincia
          )
        ) AS "localidad"
      FROM domicilios d
      JOIN localidades l ON l.id_localidad = d.id_localidad
      JOIN provincias p ON p.id_provincia = l.id_provincia
      WHERE d.id_cliente = $1 AND d.activo = true
      ORDER BY d.es_predeterminado DESC, d.id_domicilio ASC;
    `;
    const res = await query(sql, [idCliente]);
    return res.rows;
  }

  private static async resolveLocalidadId(
    client: PoolClient,
    idLocalidad?: number,
    provinciaName?: string,
    localidadName?: string
  ): Promise<number> {
    // 1. Si se provee idLocalidad valido, verificar que exista en la tabla localidades
    if (idLocalidad && !isNaN(Number(idLocalidad)) && Number(idLocalidad) > 0) {
      const check = await client.query(`SELECT id_localidad FROM localidades WHERE id_localidad = $1;`, [
        Number(idLocalidad),
      ]);
      if (check.rows.length > 0) {
        return check.rows[0].id_localidad;
      }
      throw new Error(`La localidad con ID ${idLocalidad} no existe en el catalogo maestro.`);
    }

    const provTrim = (provinciaName || '').trim();
    const locTrim = (localidadName || '').trim();

    if (!provTrim || !locTrim) {
      throw new Error('Debe especificar una provincia y una localidad validas del catalogo.');
    }

    // 2. Buscar provincia existente (estrictamente lectura, prohibido INSERT por cliente)
    const provRes = await client.query(
      `SELECT id_provincia FROM provincias WHERE UPPER(TRIM(provincia)) = UPPER($1) LIMIT 1;`,
      [provTrim]
    );
    if (provRes.rows.length === 0) {
      throw new Error(
        `La provincia '${provTrim}' no existe en el catalogo oficial de provincias. Debe seleccionar una provincia valida.`
      );
    }
    const idProv = provRes.rows[0].id_provincia;

    // 3. Buscar localidad existente en esa provincia (estrictamente lectura, prohibido INSERT por cliente)
    const locRes = await client.query(
      `SELECT id_localidad FROM localidades WHERE id_provincia = $1 AND UPPER(TRIM(localidad)) = UPPER($2) LIMIT 1;`,
      [idProv, locTrim]
    );
    if (locRes.rows.length === 0) {
      throw new Error(
        `La localidad '${locTrim}' no existe para la provincia '${provTrim}'. Debe seleccionar una localidad valida del catalogo.`
      );
    }

    return locRes.rows[0].id_localidad;
  }

  static async createDomicilio(idCliente: number, data: CreateDomicilioInput) {
    return withTransaction(async (client) => {
      if (data.esPredeterminado) {
        await client.query(
          `UPDATE domicilios SET es_predeterminado = false WHERE id_cliente = $1`,
          [idCliente]
        );
      }

      const resolvedIdLocalidad = await this.resolveLocalidadId(
        client,
        data.idLocalidad,
        data.provincia,
        data.localidad
      );

      const insertSql = `
        INSERT INTO domicilios (
          id_cliente, id_localidad, nombre_domicilio, calle, altura, codigo_postal, depto, es_predeterminado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const insertRes = await client.query(insertSql, [
        idCliente,
        resolvedIdLocalidad,
        data.nombreDomicilio.trim(),
        data.calle.trim(),
        Number(data.altura) || 0,
        data.codigoPostal.trim(),
        data.depto?.trim() || null,
        data.esPredeterminado ?? false,
      ]);

      const inserted = insertRes.rows[0];

      // Devolver con localidad y provincia incluidas
      const fullRes = await client.query(
        `
        SELECT 
          d.id_domicilio AS "idDomicilio",
          d.id_cliente AS "idCliente",
          d.id_localidad AS "idLocalidad",
          d.nombre_domicilio AS "nombreDomicilio",
          d.calle,
          d.altura,
          d.codigo_postal AS "codigoPostal",
          d.depto,
          d.es_predeterminado AS "esPredeterminado",
          d.activo,
          json_build_object(
            'idLocalidad', l.id_localidad,
            'idProvincia', l.id_provincia,
            'localidad', l.localidad,
            'provincia', json_build_object(
              'idProvincia', p.id_provincia,
              'provincia', p.provincia
            )
          ) AS "localidad"
        FROM domicilios d
        JOIN localidades l ON l.id_localidad = d.id_localidad
        JOIN provincias p ON p.id_provincia = l.id_provincia
        WHERE d.id_domicilio = $1;
      `,
        [inserted.id_domicilio]
      );

      return fullRes.rows[0];
    });
  }

  static async updateDomicilio(idDomicilio: number, idCliente: number, data: UpdateDomicilioInput) {
    return withTransaction(async (client) => {
      if (data.esPredeterminado) {
        await client.query(
          `UPDATE domicilios SET es_predeterminado = false WHERE id_cliente = $1`,
          [idCliente]
        );
      }

      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.idLocalidad !== undefined || data.provincia !== undefined || data.localidad !== undefined) {
        const resolvedIdLocalidad = await this.resolveLocalidadId(
          client,
          data.idLocalidad,
          data.provincia,
          data.localidad
        );
        sets.push(`id_localidad = $${idx++}`);
        values.push(resolvedIdLocalidad);
      }
      if (data.nombreDomicilio !== undefined) {
        sets.push(`nombre_domicilio = $${idx++}`);
        values.push(data.nombreDomicilio.trim());
      }
      if (data.calle !== undefined) {
        sets.push(`calle = $${idx++}`);
        values.push(data.calle.trim());
      }
      if (data.altura !== undefined) {
        sets.push(`altura = $${idx++}`);
        values.push(Number(data.altura) || 0);
      }
      if (data.codigoPostal !== undefined) {
        sets.push(`codigo_postal = $${idx++}`);
        values.push(data.codigoPostal.trim());
      }
      if (data.depto !== undefined) {
        sets.push(`depto = $${idx++}`);
        values.push(data.depto?.trim() || null);
      }
      if (data.esPredeterminado !== undefined) {
        sets.push(`es_predeterminado = $${idx++}`);
        values.push(data.esPredeterminado);
      }
      if (data.activo !== undefined) {
        sets.push(`activo = $${idx++}`);
        values.push(data.activo);
      }

      if (sets.length > 0) {
        values.push(idDomicilio);
        values.push(idCliente);
        await client.query(
          `UPDATE domicilios SET ${sets.join(', ')} WHERE id_domicilio = $${idx} AND id_cliente = $${idx + 1}`,
          values
        );
      }

      const fullRes = await client.query(
        `
        SELECT 
          d.id_domicilio AS "idDomicilio",
          d.id_cliente AS "idCliente",
          d.id_localidad AS "idLocalidad",
          d.nombre_domicilio AS "nombreDomicilio",
          d.calle,
          d.altura,
          d.codigo_postal AS "codigoPostal",
          d.depto,
          d.es_predeterminado AS "esPredeterminado",
          d.activo,
          json_build_object(
            'idLocalidad', l.id_localidad,
            'idProvincia', l.id_provincia,
            'localidad', l.localidad,
            'provincia', json_build_object(
              'idProvincia', p.id_provincia,
              'provincia', p.provincia
            )
          ) AS "localidad"
        FROM domicilios d
        JOIN localidades l ON l.id_localidad = d.id_localidad
        JOIN provincias p ON p.id_provincia = l.id_provincia
        WHERE d.id_domicilio = $1;
      `,
        [idDomicilio]
      );

      return fullRes.rows[0];
    });
  }

  static async deleteDomicilio(idDomicilio: number, idCliente: number) {
    const sql = `
      UPDATE domicilios
      SET activo = false, es_predeterminado = false
      WHERE id_domicilio = $1 AND id_cliente = $2
      RETURNING id_domicilio AS "idDomicilio";
    `;
    const res = await query(sql, [idDomicilio, idCliente]);
    return res.rows[0];
  }

  // --- Favoritos ---
  static async getFavoritos(idCliente: number) {
    const sql = `
      SELECT 
        f.id_producto AS "idProducto",
        f.id_cliente AS "idCliente",
        json_build_object(
          'idProducto', pr.id_producto,
          'nombreProducto', pr.nombre_producto,
          'codigoProducto', pr.codigo_producto,
          'precioBase', pr.precio_base,
          'categoria', json_build_object(
            'idCategoria', cat.id_categoria,
            'nombreCategoria', cat.nombre_categoria
          ),
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
          )
        ) AS "producto"
      FROM productos_favoritos f
      JOIN productos pr ON pr.id_producto = f.id_producto
      JOIN categorias cat ON cat.id_categoria = pr.id_categoria
      WHERE f.id_cliente = $1;
    `;
    const res = await query(sql, [idCliente]);
    return res.rows;
  }

  static async toggleFavorito(idCliente: number, idProducto: number) {
    const checkSql = `SELECT 1 FROM productos_favoritos WHERE id_producto = $1 AND id_cliente = $2;`;
    const existing = await query(checkSql, [idProducto, idCliente]);

    if (existing.rows.length > 0) {
      await query(`DELETE FROM productos_favoritos WHERE id_producto = $1 AND id_cliente = $2;`, [
        idProducto,
        idCliente,
      ]);
      return { isFavorite: false };
    } else {
      await query(`INSERT INTO productos_favoritos (id_producto, id_cliente) VALUES ($1, $2);`, [
        idProducto,
        idCliente,
      ]);
      return { isFavorite: true };
    }
  }

  // --- Reseñas del cliente ---
  static async getResenas(idCliente: number) {
    const sql = `
      SELECT 
        r.id_resena AS "idResena",
        r.id_producto AS "idProducto",
        r.id_cliente AS "idCliente",
        r.calificacion,
        r.comentario,
        r.fecha,
        json_build_object(
          'idProducto', p.id_producto,
          'nombreProducto', p.nombre_producto,
          'codigoProducto', p.codigo_producto
        ) AS "producto"
      FROM resenas_producto r
      JOIN productos p ON p.id_producto = r.id_producto
      WHERE r.id_cliente = $1
      ORDER BY r.fecha DESC;
    `;
    const res = await query(sql, [idCliente]);
    return res.rows;
  }
}
