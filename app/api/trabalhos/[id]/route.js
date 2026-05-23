import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

  const result = db
    .prepare(
      "UPDATE trabalhos SET titulo = ?, data_entrega = ?, materia = ?, valor = ? WHERE id = ? AND usuario_id = ?"
    )
    .run(titulo, dataEntrega, materia, valor, id, user.id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ trabalho: selectTrabalho(id, user.id) });
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

  db.prepare("DELETE FROM trabalhos WHERE id = ? AND usuario_id = ?").run(id, user.id);

  return NextResponse.json({ ok: true });
}
