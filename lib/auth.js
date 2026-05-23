import { query } from "@/lib/db";
import { getUserSession } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getUserSession();

  if (!session?.userId) {
    return null;
  }

  const result = await query(
    `SELECT
          id,
          nome,
          matricula,
          nome_completo AS nomeCompleto,
          idade,
          ano_ensino_medio AS anoEnsinoMedio,
          periodo,
          turma,
          curso_tecnico AS cursoTecnico,
          email_academico AS emailAcademico,
          numero_biblioteca AS numeroBiblioteca
        FROM usuarios
        WHERE id = $1`,
    [session.userId]
  );

  return result.rows[0] || null;
}
