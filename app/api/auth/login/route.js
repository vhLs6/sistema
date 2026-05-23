import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { setUserSession } from "@/lib/session";

export async function POST(request) {
  const { nome, senha, matricula } = await request.json();
  const normalizedName = String(nome || "").trim();
  const normalizedMatricula = String(matricula || "").trim();

  if (!normalizedName || !normalizedMatricula || !senha) {
    return NextResponse.json({ error: "Preencha nome, matricula e senha." }, { status: 400 });
  }

  const user = db
    .prepare("SELECT id, senha_hash FROM usuarios WHERE nome = ? AND matricula = ?")
    .get(normalizedName, normalizedMatricula);

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
