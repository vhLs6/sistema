import { NextResponse } from "next/server";
import db from "@/lib/db";
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

function selectProfile(userId) {
  return db
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
    .get(userId);
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

  db.prepare(
    `UPDATE usuarios
      SET nome_completo = ?,
        idade = ?,
        matricula = ?,
        ano_ensino_medio = ?,
        periodo = ?,
        turma = ?,
        curso_tecnico = ?,
        email_academico = ?,
        numero_biblioteca = ?
      WHERE id = ?`
  ).run(
    profile.nomeCompleto,
    profile.idade,
    profile.matricula,
    profile.anoEnsinoMedio,
    profile.periodo,
    profile.turma,
    profile.cursoTecnico,
    profile.emailAcademico,
    profile.numeroBiblioteca,
    user.id
  );

  return NextResponse.json({ profile: selectProfile(user.id) });
}
