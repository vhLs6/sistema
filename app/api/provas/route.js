import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

async function selectProva(id, userId) {
  const result = await query(
    "SELECT id, titulo, data_prova AS \"dataProva\", materia, conteudo, valor, nota FROM provas WHERE id = $1 AND usuario_id = $2",
    [id, userId]
  );

  return result.rows[0];
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const provas = await query(
    "SELECT id, titulo, data_prova AS \"dataProva\", materia, conteudo, valor, nota FROM provas WHERE usuario_id = $1 ORDER BY data_prova ASC, id DESC",
    [user.id]
  );

  return NextResponse.json({ provas: provas.rows });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const data = await request.json();
  const titulo = String(data.titulo || "").trim();
  const dataProva = String(data.dataProva || "").trim();
  const materia = String(data.materia || "").trim();
  const conteudo = String(data.conteudo || "").trim();
  const valor = parseValue(data.valor);
  const nota = parseValue(data.nota);

  if (!titulo || !dataProva || !materia) {
    return NextResponse.json(
      { error: "Preencha prova, data e matéria." },
      { status: 400 }
    );
  }

  const result = await query(
    "INSERT INTO provas (usuario_id, titulo, data_prova, materia, conteudo, valor, nota) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    [user.id, titulo, dataProva, materia, conteudo, valor, nota]
  );

  return NextResponse.json({ prova: await selectProva(result.rows[0].id, user.id) });
}
