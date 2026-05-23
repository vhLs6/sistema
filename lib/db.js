import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "usuarios.sqlite");
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trabalhos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    data_entrega TEXT NOT NULL,
    materia TEXT NOT NULL,
    valor REAL NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    materia TEXT NOT NULL,
    nota_atual REAL NOT NULL DEFAULT 0,
    creditos REAL NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    dia TEXT NOT NULL,
    horario TEXT NOT NULL,
    conteudo TEXT NOT NULL DEFAULT '',
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, dia, horario),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );
`);

const usuarioColumns = db.prepare("PRAGMA table_info(usuarios)").all().map((column) => column.name);
const usuarioMigrations = [
  ["matricula", "ALTER TABLE usuarios ADD COLUMN matricula TEXT"],
  ["nome_completo", "ALTER TABLE usuarios ADD COLUMN nome_completo TEXT NOT NULL DEFAULT ''"],
  ["idade", "ALTER TABLE usuarios ADD COLUMN idade TEXT NOT NULL DEFAULT ''"],
  ["ano_ensino_medio", "ALTER TABLE usuarios ADD COLUMN ano_ensino_medio TEXT NOT NULL DEFAULT ''"],
  ["periodo", "ALTER TABLE usuarios ADD COLUMN periodo TEXT NOT NULL DEFAULT ''"],
  ["turma", "ALTER TABLE usuarios ADD COLUMN turma TEXT NOT NULL DEFAULT ''"],
  ["curso_tecnico", "ALTER TABLE usuarios ADD COLUMN curso_tecnico TEXT NOT NULL DEFAULT ''"],
  ["email_academico", "ALTER TABLE usuarios ADD COLUMN email_academico TEXT NOT NULL DEFAULT ''"],
  ["numero_biblioteca", "ALTER TABLE usuarios ADD COLUMN numero_biblioteca TEXT NOT NULL DEFAULT ''"],
];

for (const [columnName, statement] of usuarioMigrations) {
  if (!usuarioColumns.includes(columnName)) {
    db.prepare(statement).run();
  }
}

db.prepare(
  "UPDATE usuarios SET matricula = COALESCE(NULLIF(matricula, ''), '10198') WHERE lower(nome) = 'victor'"
).run();

export default db;
