import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { sendPasswordResetConfirmationEmail } from '../../config/mailer.js';
import type { AuthUserPayload } from '../../middlewares/auth.middleware.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  private static profilesEnsured = false;

  private static determineRole(email: string, dbRole?: string | null): 'ADMIN' | 'CLIENTE' {
    if (dbRole && dbRole.toUpperCase() === 'ADMIN') {
      return 'ADMIN';
    }
    const clean = email.trim().toLowerCase();
    if (clean === env.ADMIN_EMAIL.toLowerCase()) {
      return 'ADMIN';
    }
    return 'CLIENTE';
  }

  private static generateToken(payload: AuthUserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  /**
   * Garantiza la separacion de dominio:
   * - Tabla `usuarios`: identidad de autenticacion y rol ('ADMIN' | 'CLIENTE').
   * - Tabla `clientes`: vinculada 1:1 a `usuarios` UNICAMENTE para usuarios con rol 'CLIENTE'
   *   (con puntos, telefono, domicilios, pedidos, favoritos y resenas).
   * - Un Administrador existe en `usuarios` con rol 'ADMIN' y NO es un registro de `clientes`.
   */
  static async ensureDefaultProfiles(): Promise<void> {
    if (this.profilesEnsured) return;
    try {
      // 1. Crear tabla `usuarios` (Clase Usuario con rol)
      await query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id_usuario SERIAL PRIMARY KEY,
          correo VARCHAR(150) UNIQUE NOT NULL,
          nombre_completo VARCHAR(150) NOT NULL,
          contrasena_hash VARCHAR(255) NOT NULL,
          rol VARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
          activo BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // 2. Vincular `clientes` con `usuarios` mediante `id_usuario`
      await query(`
        ALTER TABLE clientes
        ADD COLUMN IF NOT EXISTS id_usuario INT UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
      `);
      await query(`
        ALTER TABLE clientes
        ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'CLIENTE';
      `);
      await query(`
        ALTER TABLE clientes
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
      `);
      await query(`
        ALTER TABLE categorias
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
      `);
      await query(`
        ALTER TABLE productos
        ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
      `);
      await query(`
        ALTER TABLE pedidos_cliente
        ALTER COLUMN depto_entrega TYPE TEXT USING depto_entrega::TEXT;
      `);
      await query(`
        ALTER TABLE pedidos_cliente
        ADD COLUMN IF NOT EXISTS comprobante_url TEXT;
      `);

      // 3. Tabla de codigos de recuperacion vinculada a `usuarios`
      await query(`
        CREATE TABLE IF NOT EXISTS codigos_recuperacion_clave (
          id_recuperacion SERIAL PRIMARY KEY,
          id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          id_cliente INT REFERENCES clientes(id_cliente) ON DELETE CASCADE,
          correo VARCHAR(150) NOT NULL,
          codigo_hash VARCHAR(255) NOT NULL,
          expira_en TIMESTAMP NOT NULL,
          usado BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      await query(`
        ALTER TABLE codigos_recuperacion_clave
        ADD COLUMN IF NOT EXISTS id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
      `);
      await query(`
        ALTER TABLE codigos_recuperacion_clave
        ALTER COLUMN id_cliente DROP NOT NULL;
      `);

      // 4. Asegurar Usuario Administrador en `usuarios` (SIN fila en `clientes`)
      const adminEmail = env.ADMIN_EMAIL.toLowerCase();
      const adminHash = await bcrypt.hash('admin123', 10);
      await query(
        `INSERT INTO usuarios (correo, nombre_completo, contrasena_hash, rol, activo)
         VALUES ($1, 'Administrador Buttoncat', $2, 'ADMIN', true)
         ON CONFLICT (correo) DO UPDATE
         SET rol = 'ADMIN',
             activo = true,
             contrasena_hash = COALESCE(NULLIF(usuarios.contrasena_hash, ''), EXCLUDED.contrasena_hash);`,
        [adminEmail, adminHash]
      );

      // 5. Asegurar Usuario de Prueba (rol CLIENTE) en `usuarios` y su perfil en `clientes`
      const testUserEmail = 'cliente@buttoncat.com';
      const userHash = await bcrypt.hash('cliente123', 10);
      const testUserRes = await query(
        `INSERT INTO usuarios (correo, nombre_completo, contrasena_hash, rol, activo)
         VALUES ($1, 'Usuario de Prueba', $2, 'CLIENTE', true)
         ON CONFLICT (correo) DO UPDATE
         SET rol = 'CLIENTE',
             activo = true,
             contrasena_hash = COALESCE(NULLIF(usuarios.contrasena_hash, ''), EXCLUDED.contrasena_hash)
         RETURNING id_usuario;`,
        [testUserEmail, userHash]
      );
      const testUsuarioId: number = testUserRes.rows[0].id_usuario;

      const userClientCheck = await query(
        `SELECT id_cliente FROM clientes WHERE LOWER(correo) = $1 OR id_usuario = $2 LIMIT 1;`,
        [testUserEmail, testUsuarioId]
      );
      let testClientId: number;
      if (userClientCheck.rows.length === 0) {
        const insClient = await query(
          `INSERT INTO clientes (id_usuario, correo, nombre_completo, contrasena_hash, telefono, puntos, rol, activo, updated_at)
           VALUES ($1, $2, 'Usuario de Prueba', $3, '11-5500-0002', 500, 'CLIENTE', true, NOW())
           RETURNING id_cliente;`,
          [testUsuarioId, testUserEmail, userHash]
        );
        testClientId = insClient.rows[0].id_cliente;
      } else {
        testClientId = userClientCheck.rows[0].id_cliente;
        await query(
          `UPDATE clientes
           SET id_usuario = $2,
               nombre_completo = 'Usuario de Prueba',
               contrasena_hash = COALESCE(NULLIF(contrasena_hash, ''), $3),
               telefono = COALESCE(telefono, '11-5500-0002'),
               rol = 'CLIENTE',
               activo = true
           WHERE id_cliente = $1;`,
          [testClientId, testUsuarioId, userHash]
        );
      }

      // 6. Migrar clientes existentes sin `id_usuario` hacia la tabla `usuarios`
      const unlinkedClients = await query(`
        SELECT id_cliente, correo, nombre_completo, contrasena_hash, rol, activo
        FROM clientes
        WHERE id_usuario IS NULL;
      `);
      for (const c of unlinkedClients.rows) {
        const cleanCorreo = String(c.correo).trim().toLowerCase();
        const role = this.determineRole(cleanCorreo, c.rol);
        const fallbackHash = c.contrasena_hash || userHash;
        const uRes = await query(
          `INSERT INTO usuarios (correo, nombre_completo, contrasena_hash, rol, activo)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (correo) DO UPDATE
           SET nombre_completo = EXCLUDED.nombre_completo,
               rol = EXCLUDED.rol
           RETURNING id_usuario;`,
          [cleanCorreo, c.nombre_completo, fallbackHash, role, c.activo ?? true]
        );
        await query(
          `UPDATE clientes SET id_usuario = $1 WHERE id_cliente = $2;`,
          [uRes.rows[0].id_usuario, c.id_cliente]
        );
      }

      // 7. Limpiar de la tabla `clientes` cualquier cuenta que sea ADMIN o demo ficticia
      //    (Un Administrador NO es un Cliente)
      const nonClientRows = await query(
        `SELECT c.id_cliente
         FROM clientes c
         LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
         WHERE (
           LOWER(c.correo) = $1
           OR COALESCE(u.rol, c.rol) = 'ADMIN'
           OR LOWER(c.correo) LIKE '%demo%'
           OR LOWER(c.correo) = 'luna@buttoncat.com'
         )
         AND c.id_cliente != $2;`,
        [adminEmail, testClientId]
      );
      for (const row of nonClientRows.rows) {
        const oldId = row.id_cliente;
        await query(`UPDATE pedidos_cliente SET id_cliente = $1 WHERE id_cliente = $2;`, [testClientId, oldId]);
        await query(`UPDATE premios_cliente SET id_cliente = $1 WHERE id_cliente = $2;`, [testClientId, oldId]);
        await query(`UPDATE resenas_producto SET id_cliente = $1 WHERE id_cliente = $2;`, [testClientId, oldId]);
        await query(`DELETE FROM productos_favoritos WHERE id_cliente = $1;`, [oldId]);
        await query(`DELETE FROM productos_custom_favoritos WHERE id_cliente = $1;`, [oldId]);
        await query(`DELETE FROM domicilios WHERE id_cliente = $1;`, [oldId]);
        await query(`DELETE FROM codigos_recuperacion_clave WHERE id_cliente = $1;`, [oldId]);
        // Desvincular antes de borrar de clientes para no borrar el usuario ADMIN en cascada
        await query(`UPDATE clientes SET id_usuario = NULL WHERE id_cliente = $1;`, [oldId]);
        await query(`DELETE FROM clientes WHERE id_cliente = $1;`, [oldId]);
      }

      // Eliminar usuarios demo ficticios de la tabla `usuarios`
      await query(
        `DELETE FROM usuarios
         WHERE (LOWER(correo) LIKE '%demo%' OR LOWER(correo) = 'luna@buttoncat.com')
           AND LOWER(correo) NOT IN ($1, $2);`,
        [adminEmail, testUserEmail]
      );

      // 8. Asegurar que el Usuario de Prueba tenga un domicilio real predeterminado si hay localidades
      const domCheck = await query(
        `SELECT id_domicilio FROM domicilios WHERE id_cliente = $1 AND activo = true LIMIT 1;`,
        [testClientId]
      );
      if (domCheck.rows.length === 0) {
        const locRes = await query(
          `SELECT id_localidad FROM localidades ORDER BY id_localidad ASC LIMIT 1;`
        );
        if (locRes.rows.length > 0) {
          await query(
            `INSERT INTO domicilios (
               id_cliente, id_localidad, nombre_domicilio, calle, altura, codigo_postal, depto, es_predeterminado, activo
             ) VALUES ($1, $2, 'Casa Principal', 'Av. Santa Fe', 3250, '1425', '4B', true, true);`,
            [testClientId, locRes.rows[0].id_localidad]
          );
        }
      }

      this.profilesEnsured = true;
    } catch (err) {
      console.error('[AuthService.ensureDefaultProfiles Error]:', err);
    }
  }

  static async register(data: RegisterInput) {
    await this.ensureDefaultProfiles();
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Verificar si ya existe un usuario con ese correo
    const existing = await query(
      `SELECT id_usuario FROM usuarios WHERE LOWER(correo) = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      throw new Error('El correo electronico ya se encuentra registrado');
    }

    // 2. Hashear contrasena
    const contrasenaHash = await bcrypt.hash(data.password, 10);
    const role = this.determineRole(cleanEmail);
    const cleanName = data.name.trim();
    const cleanPhone = data.phone?.trim() || null;

    // 3. Crear Usuario y, si su rol es CLIENTE, su ficha en Clientes
    const result = await withTransaction(async (tx) => {
      const userRes = await tx.query(
        `INSERT INTO usuarios (correo, nombre_completo, contrasena_hash, rol, activo)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id_usuario AS "idUsuario",
                   correo,
                   nombre_completo AS "nombreCompleto",
                   rol,
                   activo;`,
        [cleanEmail, cleanName, contrasenaHash, role]
      );
      const userRow = userRes.rows[0];

      let clientRow: any = null;
      if (role === 'CLIENTE') {
        const clientRes = await tx.query(
          `INSERT INTO clientes (id_usuario, correo, nombre_completo, contrasena_hash, telefono, puntos, rol, activo, updated_at)
           VALUES ($1, $2, $3, $4, $5, 0, 'CLIENTE', true, NOW())
           RETURNING id_cliente AS "idCliente",
                     telefono,
                     puntos;`,
          [userRow.idUsuario, cleanEmail, cleanName, contrasenaHash, cleanPhone]
        );
        clientRow = clientRes.rows[0];
      }

      return { userRow, clientRow };
    });

    const idCliente = result.clientRow?.idCliente ?? null;
    const token = this.generateToken({
      idUsuario: result.userRow.idUsuario,
      idCliente,
      email: result.userRow.correo,
      role,
    });

    return {
      user: {
        id: String(idCliente ?? result.userRow.idUsuario),
        idUsuario: String(result.userRow.idUsuario),
        name: result.userRow.nombreCompleto,
        email: result.userRow.correo,
        phone: result.clientRow?.telefono || undefined,
        points: result.clientRow?.puntos ?? 0,
        role,
      },
      token,
    };
  }

  static async login(data: LoginInput) {
    await this.ensureDefaultProfiles();
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Buscar en tabla `usuarios` con LEFT JOIN a `clientes` (solo tendrá fila en `clientes` si es CLIENTE)
    const res = await query(
      `SELECT u.id_usuario AS "idUsuario",
              u.correo,
              u.nombre_completo AS "nombreCompleto",
              u.contrasena_hash AS "contrasenaHash",
              u.rol,
              u.activo,
              c.id_cliente AS "idCliente",
              c.telefono,
              c.puntos
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
       WHERE LOWER(u.correo) = $1
       LIMIT 1;`,
      [cleanEmail]
    );

    const userRow = res.rows[0];

    if (!userRow || !userRow.activo) {
      throw new Error('Credenciales invalidas o cuenta inactiva');
    }

    // 2. Verificar contrasena contra `usuarios.contrasena_hash`
    const isValid = await bcrypt.compare(data.password, userRow.contrasenaHash);
    if (!isValid) {
      throw new Error('Credenciales invalidas');
    }

    const role = this.determineRole(userRow.correo, userRow.rol);
    const idCliente = role === 'CLIENTE' ? (userRow.idCliente ?? null) : null;

    const token = this.generateToken({
      idUsuario: userRow.idUsuario,
      idCliente,
      email: userRow.correo,
      role,
    });

    return {
      user: {
        id: String(idCliente ?? userRow.idUsuario),
        idUsuario: String(userRow.idUsuario),
        name: userRow.nombreCompleto,
        email: userRow.correo,
        phone: role === 'CLIENTE' ? (userRow.telefono || undefined) : undefined,
        points: role === 'CLIENTE' ? (userRow.puntos ?? 0) : 0,
        role,
      },
      token,
    };
  }

  static async requestPasswordReset(email: string) {
    await this.ensureDefaultProfiles();
    const cleanEmail = email.trim().toLowerCase();

    const res = await query(
      `SELECT u.id_usuario AS "idUsuario",
              u.correo,
              u.nombre_completo AS "nombreCompleto",
              u.activo,
              c.id_cliente AS "idCliente"
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
       WHERE LOWER(TRIM(u.correo)) = $1
       LIMIT 1;`,
      [cleanEmail]
    );

    const userRow = res.rows[0];
    if (!userRow || !userRow.activo) {
      throw new Error('No se encontro una cuenta activa asociada a ese correo electronico');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codigoHash = await bcrypt.hash(code, 10);

    await query(
      `UPDATE codigos_recuperacion_clave
       SET usado = true
       WHERE (id_usuario = $1 OR LOWER(correo) = $2) AND usado = false;`,
      [userRow.idUsuario, cleanEmail]
    );

    await query(
      `INSERT INTO codigos_recuperacion_clave (id_usuario, id_cliente, correo, codigo_hash, expira_en, usado)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '15 minutes', false);`,
      [userRow.idUsuario, userRow.idCliente || null, userRow.correo, codigoHash]
    );

    const mailResult = await sendPasswordResetConfirmationEmail({
      to: userRow.correo,
      userName: userRow.nombreCompleto,
      code,
    });

    return {
      email: userRow.correo,
      sent: true,
      previewEmailUrl: mailResult.previewUrl,
    };
  }

  static async resetPassword(data: { email: string; code: string; newPassword: string }) {
    await this.ensureDefaultProfiles();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanCode = (data.code || '').trim();

    if (!cleanCode || cleanCode.length !== 6) {
      throw new Error('Debes ingresar el codigo de confirmacion de 6 digitos enviado a tu correo');
    }

    const res = await query(
      `SELECT u.id_usuario AS "idUsuario",
              u.correo,
              u.activo,
              c.id_cliente AS "idCliente"
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
       WHERE LOWER(TRIM(u.correo)) = $1
       LIMIT 1;`,
      [cleanEmail]
    );

    const userRow = res.rows[0];
    if (!userRow || !userRow.activo) {
      throw new Error('No se encontro una cuenta activa asociada a ese correo electronico');
    }

    const codeRes = await query(
      `SELECT id_recuperacion AS "idRecuperacion", codigo_hash AS "codigoHash"
       FROM codigos_recuperacion_clave
       WHERE (id_usuario = $1 OR LOWER(correo) = $2)
         AND usado = false
         AND expira_en > NOW()
       ORDER BY created_at DESC
       LIMIT 1;`,
      [userRow.idUsuario, cleanEmail]
    );

    const codeRow = codeRes.rows[0];
    if (!codeRow) {
      throw new Error('El codigo de confirmacion ha expirado o no existe. Solicita un nuevo correo.');
    }

    const isCodeValid = await bcrypt.compare(cleanCode, codeRow.codigoHash);
    if (!isCodeValid) {
      throw new Error('El codigo de confirmacion ingresado es incorrecto.');
    }

    await query(
      `UPDATE codigos_recuperacion_clave
       SET usado = true
       WHERE id_recuperacion = $1;`,
      [codeRow.idRecuperacion]
    );

    const contrasenaHash = await bcrypt.hash(data.newPassword, 10);
    await query(
      `UPDATE usuarios
       SET contrasena_hash = $1,
           updated_at = NOW()
       WHERE id_usuario = $2;`,
      [contrasenaHash, userRow.idUsuario]
    );

    if (userRow.idCliente) {
      await query(
        `UPDATE clientes
         SET contrasena_hash = $1,
             updated_at = NOW()
         WHERE id_cliente = $2;`,
        [contrasenaHash, userRow.idCliente]
      );
    }

    return {
      email: userRow.correo,
      updated: true,
    };
  }

  static async getMe(authPayload: AuthUserPayload) {
    await this.ensureDefaultProfiles();

    const res = await query(
      `SELECT u.id_usuario AS "idUsuario",
              u.correo,
              u.nombre_completo AS "nombreCompleto",
              u.rol,
              u.activo,
              c.id_cliente AS "idCliente",
              c.telefono,
              c.puntos,
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
                        'idLocalidad', loc.id_localidad,
                        'idProvincia', loc.id_provincia,
                        'localidad', loc.localidad,
                        'provincia', json_build_object(
                          'idProvincia', prov.id_provincia,
                          'provincia', prov.provincia
                        )
                      )
                    )
                  )
                  FROM domicilios d
                  JOIN localidades loc ON loc.id_localidad = d.id_localidad
                  JOIN provincias prov ON prov.id_provincia = loc.id_provincia
                  WHERE d.id_cliente = c.id_cliente AND d.activo = true
                ),
                '[]'::json
              ) AS "domicilios"
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
       WHERE (
         ($1::int IS NOT NULL AND u.id_usuario = $1)
         OR ($2::int IS NOT NULL AND c.id_cliente = $2)
         OR LOWER(u.correo) = LOWER($3)
       )
       AND u.activo = true
       LIMIT 1;`,
      [authPayload.idUsuario ?? null, authPayload.idCliente ?? null, authPayload.email || '']
    );

    const row = res.rows[0];
    if (!row) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    const role = this.determineRole(row.correo, row.rol);
    const idCliente = role === 'CLIENTE' ? (row.idCliente ?? null) : null;

    return {
      id: String(idCliente ?? row.idUsuario),
      idUsuario: String(row.idUsuario),
      name: row.nombreCompleto,
      email: row.correo,
      phone: role === 'CLIENTE' ? (row.telefono || undefined) : undefined,
      points: role === 'CLIENTE' ? (row.puntos ?? 0) : 0,
      role,
      addresses: role === 'CLIENTE' ? (row.domicilios || []) : [],
    };
  }
}
