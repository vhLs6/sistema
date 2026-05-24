import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

function parseFaltas(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

async function selectNota(id, userId) {
  const result = await query(
    "SELECT id, materia, nota_atual AS \"notaAtual\", creditos, faltas FROM notas WHERE id = $1 AND usuario_id = $2",
    [id, userId]
  );

  return result.rows[0];
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const notas = await query(
    "SELECT id, materia, nota_atual AS \"notaAtual\", creditos, faltas FROM notas WHERE usuario_id = $1 ORDER BY materia ASC, id DESC",
    [user.id]
  );

  return NextResponse.json({ notas: notas.rows });
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
  const faltas = parseFaltas(data.faltas);

  if (!materia) {
    return NextResponse.json({ error: "Preencha a matéria." }, { status: 400 });
  }

  const result = await query(
    "INSERT INTO notas (usuario_id, materia, nota_atual, creditos, faltas) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [user.id, materia, notaAtual, creditos, faltas]
  );

  return NextResponse.json({ nota: await selectNota(result.rows[0].id, user.id) });
}
