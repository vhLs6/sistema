import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseNota(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), 100);
}

function parseCreditos(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function selectNota(id, userId) {
  return db
    .prepare(
      "SELECT id, materia, nota_atual AS notaAtual, creditos FROM notas WHERE id = ? AND usuario_id = ?"
    )
    .get(id, userId);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const notas = db
    .prepare(
      "SELECT id, materia, nota_atual AS notaAtual, creditos FROM notas WHERE usuario_id = ? ORDER BY materia ASC, id DESC"
    )
    .all(user.id);

  return NextResponse.json({ notas });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const data = await request.json();
  const materia = String(data.materia || "").trim();
  const notaAtual = parseNota(data.notaAtual);
  const creditos = parseCreditos(data.creditos);

  if (!materia) {
    return NextResponse.json({ error: "Preencha a matéria." }, { status: 400 });
  }

  const result = db
    .prepare("INSERT INTO notas (usuario_id, materia, nota_atual, creditos) VALUES (?, ?, ?, ?)")
    .run(user.id, materia, notaAtual, creditos);

  return NextResponse.json({ nota: selectNota(result.lastInsertRowid, user.id) });
}
