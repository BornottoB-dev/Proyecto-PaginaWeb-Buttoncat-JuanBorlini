import { query } from '../../config/db.js';

export class LocationService {
  static async getAllProvincias() {
    const sql = `
      SELECT 
        p.id_provincia AS "idProvincia",
        p.provincia,
        json_build_object('localidades', COUNT(l.id_localidad)::int) AS "_count"
      FROM provincias p
      LEFT JOIN localidades l ON l.id_provincia = p.id_provincia
      GROUP BY p.id_provincia, p.provincia
      ORDER BY p.provincia ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async getProvinciaById(idProvincia: number) {
    const sql = `
      SELECT 
        p.id_provincia AS "idProvincia",
        p.provincia,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'idLocalidad', loc.id_localidad,
                'idProvincia', loc.id_provincia,
                'localidad', loc.localidad
              ) ORDER BY loc.localidad ASC
            )
            FROM localidades loc
            WHERE loc.id_provincia = p.id_provincia
          ),
          '[]'::json
        ) AS "localidades"
      FROM provincias p
      WHERE p.id_provincia = $1;
    `;
    const res = await query(sql, [idProvincia]);
    return res.rows[0] || null;
  }

  static async createProvincia(data: { provincia: string }) {
    const sql = `
      INSERT INTO provincias (provincia)
      VALUES ($1)
      RETURNING id_provincia AS "idProvincia", provincia;
    `;
    const res = await query(sql, [data.provincia.trim()]);
    return res.rows[0];
  }

  static async getLocalidadesByProvincia(idProvincia: number) {
    const sql = `
      SELECT 
        id_localidad AS "idLocalidad",
        id_provincia AS "idProvincia",
        localidad
      FROM localidades
      WHERE id_provincia = $1
      ORDER BY localidad ASC;
    `;
    const res = await query(sql, [idProvincia]);
    return res.rows;
  }

  static async getAllLocalidades() {
    const sql = `
      SELECT 
        l.id_localidad AS "idLocalidad",
        l.id_provincia AS "idProvincia",
        l.localidad,
        json_build_object(
          'idProvincia', p.id_provincia,
          'provincia', p.provincia
        ) AS "provincia"
      FROM localidades l
      JOIN provincias p ON p.id_provincia = l.id_provincia
      ORDER BY l.localidad ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  static async createLocalidad(data: { idProvincia: number; localidad: string }) {
    const sql = `
      WITH inserted AS (
        INSERT INTO localidades (id_provincia, localidad)
        VALUES ($1, $2)
        RETURNING *
      )
      SELECT 
        i.id_localidad AS "idLocalidad",
        i.id_provincia AS "idProvincia",
        i.localidad,
        json_build_object(
          'idProvincia', p.id_provincia,
          'provincia', p.provincia
        ) AS "provincia"
      FROM inserted i
      JOIN provincias p ON p.id_provincia = i.id_provincia;
    `;
    const res = await query(sql, [data.idProvincia, data.localidad.trim()]);
    return res.rows[0];
  }
}
