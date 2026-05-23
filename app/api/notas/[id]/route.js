import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

export async function PATCH(request, context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Nota inválida." }, { status: 400 });
  }

  const data = await request.json();
  const materia = String(data.materia || "").trim();
  const notaAtual = parseNota(data.notaAtual);
  const creditos = parseCreditos(data.creditos);

  if (!materia) {
    return NextResponse.json({ error: "Preencha a matéria." }, { status: 400 });
  }

  const result = db
    .prepare("UPDATE notas SET materia = ?, nota_atual = ?, creditos = ? WHERE id = ? AND usuario_id = ?")
    .run(materia, notaAtual, creditos, id, user.id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ nota: selectNota(id, user.id) });
}

export async function DELETE(_request, context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Nota inválida." }, { status: 400 });
  }

  db.prepare("DELETE FROM notas WHERE id = ? AND usuario_id = ?").run(id, user.id);

  return NextResponse.json({ ok: true });
}
