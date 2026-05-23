import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { setUserSession } from "@/lib/session";

export async function POST(request) {
  const { nome, senha, matricula } = await request.json();
  const normalizedName = String(nome || "").trim();
  const normalizedMatricula = String(matricula || "").trim();

  if (!normalizedName || !normalizedMatricula || !senha) {
    return NextResponse.json({ error: "Preencha nome, matricula e senha." }, { status: 400 });
  }

  const userResult = await query(
    "SELECT id, senha_hash FROM usuarios WHERE nome = $1 AND matricula = $2",
    [normalizedName, normalizedMatricula]
  );
  const user = userResult.rows[0];

  if (!user) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(String(senha), user.senha_hash);
  if (!passwordMatches) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  await setUserSession(user.id);

  return NextResponse.json({ ok: true });
}
