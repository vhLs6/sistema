import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

export async function PATCH(request, context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Prova inválida." }, { status: 400 });
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
    "UPDATE provas SET titulo = $1, data_prova = $2, materia = $3, conteudo = $4, valor = $5, nota = $6 WHERE id = $7 AND usuario_id = $8",
    [titulo, dataProva, materia, conteudo, valor, nota, id, user.id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Prova não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ prova: await selectProva(id, user.id) });
}

export async function DELETE(_request, context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Prova inválida." }, { status: 400 });
  }

  await query("DELETE FROM provas WHERE id = $1 AND usuario_id = $2", [id, user.id]);

  return NextResponse.json({ ok: true });
}
