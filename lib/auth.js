import db from "@/lib/db";
import { getUserSession } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getUserSession();

  if (!session?.userId) {
    return null;
  }

  return (
    db
      .prepare(
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
        WHERE id = ?`
      )
      .get(session.userId) || null
  );
}
