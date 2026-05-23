import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

export async function PATCH(request, context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Trabalho inválido." }, { status: 400 });
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
    "UPDATE trabalhos SET titulo = $1, data_entrega = $2, materia = $3, valor = $4 WHERE id = $5 AND usuario_id = $6",
    [titulo, dataEntrega, materia, valor, id, user.id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ trabalho: await selectTrabalho(id, user.id) });
}

export async function DELETE(_request, context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Trabalho inválido." }, { status: 400 });
  }

  await query("DELETE FROM trabalhos WHERE id = $1 AND usuario_id = $2", [id, user.id]);

  return NextResponse.json({ ok: true });
}
