import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseValor(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function selectTrabalho(id, userId) {
  return db
    .prepare(
      "SELECT id, titulo, data_entrega AS dataEntrega, materia, valor FROM trabalhos WHERE id = ? AND usuario_id = ?"
    )
    .get(id, userId);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const trabalhos = db
    .prepare(
      "SELECT id, titulo, data_entrega AS dataEntrega, materia, valor FROM trabalhos WHERE usuario_id = ? ORDER BY data_entrega ASC, id DESC"
    )
    .all(user.id);

  return NextResponse.json({ trabalhos });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const data = await request.json();
  const titulo = String(data.titulo || "").trim();
  const dataEntrega = String(data.dataEntrega || "").trim();
  const materia = String(data.materia || "").trim();
  const valor = parseValor(data.valor);

  if (!titulo || !dataEntrega || !materia) {
    return NextResponse.json(
      { error: "Preencha trabalho, data de entrega e matéria." },
      { status: 400 }
    );
  }

  const result = db
    .prepare(
      "INSERT INTO trabalhos (usuario_id, titulo, data_entrega, materia, valor) VALUES (?, ?, ?, ?, ?)"
    )
    .run(user.id, titulo, dataEntrega, materia, valor);

  return NextResponse.json({ trabalho: selectTrabalho(result.lastInsertRowid, user.id) });
}
