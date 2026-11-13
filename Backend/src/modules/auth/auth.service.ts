import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
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
  private static determineRole(email: string): 'ADMIN' | 'CLIENTE' {
    const clean = email.trim().toLowerCase();
    if (clean === env.ADMIN_EMAIL.toLowerCase() || clean.includes('admin')) {
      return 'ADMIN';
    }
    return 'CLIENTE';
  }

  private static generateToken(payload: AuthUserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static async register(data: RegisterInput) {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Verificar si ya existe un cliente con ese correo
    const existing = await query(
      `SELECT id_cliente FROM clientes WHERE LOWER(correo) = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      throw new Error('El correo electronico ya se encuentra registrado');
    }

    // 2. Hashear contrasena
    const saltRounds = 10;
    const contrasenaHash = await bcrypt.hash(data.password, saltRounds);

    // 3. Insertar nuevo cliente
    const insertSql = `
      INSERT INTO clientes (correo, nombre_completo, contrasena_hash, telefono, puntos, activo)
      VALUES ($1, $2, $3, $4, 0, true)
      RETURNING id_cliente AS "idCliente",
                correo,
                nombre_completo AS "nombreCompleto",
                telefono,
                puntos,
                activo,
                created_at AS "createdAt";
    `;
    const res = await query(insertSql, [
      cleanEmail,
      data.name.trim(),
      contrasenaHash,
      data.phone?.trim() || null,
    ]);
    const client = res.rows[0];

    const role = this.determineRole(client.correo);
    const token = this.generateToken({
      idCliente: client.idCliente,
      email: client.correo,
      role,
    });

    return {
      user: {
        id: String(client.idCliente),
        name: client.nombreCompleto,
        email: client.correo,
        phone: client.telefono || undefined,
        points: client.puntos,
        role,
      },
      token,
    };
  }

  static async login(data: LoginInput) {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Buscar cliente
    const res = await query(
      `SELECT id_cliente AS "idCliente",
              correo,
              nombre_completo AS "nombreCompleto",
              contrasena_hash AS "contrasenaHash",
              telefono,
              puntos,
              activo
       FROM clientes
       WHERE LOWER(correo) = $1;`,
      [cleanEmail]
    );

    let client = res.rows[0];

    // Si es el usuario admin y no existe en BD, crearlo con la clave ingresada para bootstrapping
    if (!client && this.determineRole(cleanEmail) === 'ADMIN') {
      const hash = await bcrypt.hash(data.password, 10);
      const adminIns = await query(
        `INSERT INTO clientes (correo, nombre_completo, contrasena_hash, telefono, puntos, activo)
         VALUES ($1, $2, $3, null, 1000, true)
         RETURNING id_cliente AS "idCliente",
                   correo,
                   nombre_completo AS "nombreCompleto",
                   contrasena_hash AS "contrasenaHash",
                   telefono,
                   puntos,
                   activo;`,
        [cleanEmail, 'Administrador Buttoncat', hash]
      );
      client = adminIns.rows[0];
    }

    if (!client || !client.activo) {
      throw new Error('Credenciales invalidas o cuenta inactiva');
    }

    // 2. Verificar contrasena
    const isValid = await bcrypt.compare(data.password, client.contrasenaHash);
    if (!isValid) {
      throw new Error('Credenciales invalidas');
    }

    const role = this.determineRole(client.correo);
    const token = this.generateToken({
      idCliente: client.idCliente,
      email: client.correo,
      role,
    });

    return {
      user: {
        id: String(client.idCliente),
        name: client.nombreCompleto,
        email: client.correo,
        phone: client.telefono || undefined,
        points: client.puntos,
        role,
      },
      token,
    };
  }

  static async getMe(idCliente: number) {
    const res = await query(
      `SELECT c.id_cliente AS "idCliente",
              c.correo,
              c.nombre_completo AS "nombreCompleto",
              c.telefono,
              c.puntos,
              c.activo,
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
       FROM clientes c
       WHERE c.id_cliente = $1 AND c.activo = true;`,
      [idCliente]
    );

    const client = res.rows[0];
    if (!client) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    const role = this.determineRole(client.correo);

    return {
      id: String(client.idCliente),
      name: client.nombreCompleto,
      email: client.correo,
      phone: client.telefono || undefined,
      points: client.puntos,
      role,
      addresses: client.domicilios || [],
    };
  }
}

