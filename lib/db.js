import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis;

const pool =
  globalForDb.pgPool ||
  new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

let initialized = false;

async function ensureDatabase() {
  if (!connectionString) {
    throw new Error("DATABASE_URL precisa estar configurada.");
  }

  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      matricula TEXT,
      nome_completo TEXT NOT NULL DEFAULT '',
      idade TEXT NOT NULL DEFAULT '',
      ano_ensino_medio TEXT NOT NULL DEFAULT '',
      periodo TEXT NOT NULL DEFAULT '',
      turma TEXT NOT NULL DEFAULT '',
      curso_tecnico TEXT NOT NULL DEFAULT '',
      email_academico TEXT NOT NULL DEFAULT '',
      numero_biblioteca TEXT NOT NULL DEFAULT '',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trabalhos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      data_entrega TEXT NOT NULL,
      materia TEXT NOT NULL,
      valor REAL NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notas (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      materia TEXT NOT NULL,
      nota_atual REAL NOT NULL DEFAULT 0,
      creditos REAL NOT NULL DEFAULT 0,
      faltas INTEGER NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS horarios (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      dia TEXT NOT NULL,
      horario TEXT NOT NULL,
      conteudo TEXT NOT NULL DEFAULT '',
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, dia, horario)
    );

    ALTER TABLE notas ADD COLUMN IF NOT EXISTS faltas INTEGER NOT NULL DEFAULT 0;
  `);

  initialized = true;
}

export async function query(text, params = []) {
  await ensureDatabase();
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  await ensureDatabase();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
