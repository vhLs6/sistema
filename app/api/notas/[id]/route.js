import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

async function selectNota(id, userId) {
  const result = await query(
    "SELECT id, materia, nota_atual AS \"notaAtual\", creditos FROM notas WHERE id = $1 AND usuario_id = $2",
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
    return NextResponse.json({ error: "Nota inválida." }, { status: 400 });
  }

  const data = await request.json();
  const materia = String(data.materia || "").trim();
  const notaAtual = parseNota(data.notaAtual);
  const creditos = parseCreditos(data.creditos);

  if (!materia) {
    return NextResponse.json({ error: "Preencha a matéria." }, { status: 400 });
  }

  const result = await query(
    "UPDATE notas SET materia = $1, nota_atual = $2, creditos = $3 WHERE id = $4 AND usuario_id = $5",
    [materia, notaAtual, creditos, id, user.id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ nota: await selectNota(id, user.id) });
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

  await query("DELETE FROM notas WHERE id = $1 AND usuario_id = $2", [id, user.id]);

  return NextResponse.json({ ok: true });
}
