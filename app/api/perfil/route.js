import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const fields = {
  nomeCompleto: "nome_completo",
  idade: "idade",
  matricula: "matricula",
  anoEnsinoMedio: "ano_ensino_medio",
  periodo: "periodo",
  turma: "turma",
  cursoTecnico: "curso_tecnico",
  emailAcademico: "email_academico",
  numeroBiblioteca: "numero_biblioteca",
};

function normalizeProfile(data) {
  return Object.fromEntries(
    Object.keys(fields).map((field) => [field, String(data[field] || "").trim()])
  );
}

async function selectProfile(userId) {
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
    [userId]
  );

  return result.rows[0];
}

export async function PATCH(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const profile = normalizeProfile(await request.json());

  if (!profile.matricula) {
    return NextResponse.json({ error: "Preencha a matricula." }, { status: 400 });
  }

  await query(
    `UPDATE usuarios
      SET nome_completo = $1,
        idade = $2,
        matricula = $3,
        ano_ensino_medio = $4,
        periodo = $5,
        turma = $6,
        curso_tecnico = $7,
        email_academico = $8,
        numero_biblioteca = $9
      WHERE id = $10`,
    [
      profile.nomeCompleto,
      profile.idade,
      profile.matricula,
      profile.anoEnsinoMedio,
      profile.periodo,
      profile.turma,
      profile.cursoTecnico,
      profile.emailAcademico,
      profile.numeroBiblioteca,
      user.id,
    ]
  );

  return NextResponse.json({ profile: await selectProfile(user.id) });
}
