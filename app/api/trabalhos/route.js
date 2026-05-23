import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseValor(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

async function selectTrabalho(id, userId) {
  const result = await query(
    "SELECT id, titulo, data_entrega AS \"dataEntrega\", materia, valor FROM trabalhos WHERE id = $1 AND usuario_id = $2",
    [id, userId]
  );

  return result.rows[0];
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const trabalhos = await query(
    "SELECT id, titulo, data_entrega AS \"dataEntrega\", materia, valor FROM trabalhos WHERE usuario_id = $1 ORDER BY data_entrega ASC, id DESC",
    [user.id]
  );

  return NextResponse.json({ trabalhos: trabalhos.rows });
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

  const result = await query(
    "INSERT INTO trabalhos (usuario_id, titulo, data_entrega, materia, valor) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [user.id, titulo, dataEntrega, materia, valor]
  );

  return NextResponse.json({ trabalho: await selectTrabalho(result.rows[0].id, user.id) });
}
