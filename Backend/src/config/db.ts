import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env.js';

const rawConnectionString = env.DIRECT_URL || env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const isRemote = rawConnectionString.includes('supabase.com') || rawConnectionString.includes('sslmode=require');
const connectionString = isRemote ? rawConnectionString.replace(/[?&]sslmode=[^&]+/, '') : rawConnectionString;

export const pool = new pg.Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]: Inesperado error en cliente inactivo del pool', err);
});

/**
 * Ejecuta una consulta SQL parametrizada utilizando el pool de conexiones.
 * Previene activamente SQL Injection forzando el uso de $1, $2, etc.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    if (env.NODE_ENV === 'development') {
      const duration = Date.now() - start;
      // Log de consultas en desarrollo
      console.log(`[SQL Query] (${duration}ms) ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
    return res;
  } catch (error) {
    console.error(`[SQL Error]: Fallo al ejecutar query:`, { text, params, error });
    throw error;
  }
}

/**
 * Obtiene un cliente dedicado del pool para transacciones manuales.
 * Recuerda SIEMPRE ejecutar client.release() en un bloque finally.
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Wrapper de ejecucion segura para bloques transaccionales.
 * Ejecuta BEGIN, la funcion con el cliente, COMMIT, o ROLLBACK si ocurre un error,
 * y garantiza client.release() siempre.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

