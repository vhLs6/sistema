import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request) {
  const { nome, senha, matricula } = await request.json();
  const normalizedName = String(nome || "").trim();
  const normalizedMatricula = String(matricula || "").trim();

  if (!normalizedName || !normalizedMatricula || !senha) {
    return NextResponse.json({ error: "Preencha nome, matricula e senha." }, { status: 400 });
  }

  if (normalizedName.length < 3) {
    return NextResponse.json(
      { error: "O nome de usuário precisa ter pelo menos 3 caracteres." },
      { status: 400 }
    );
  }

  if (String(senha).length < 6) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const existingUser = db.prepare("SELECT id FROM usuarios WHERE nome = ?").get(normalizedName);
  if (existingUser) {
    return NextResponse.json({ error: "Esse usuário já existe." }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(String(senha), 10);
  db.prepare("INSERT INTO usuarios (nome, matricula, senha_hash) VALUES (?, ?, ?)").run(
    normalizedName,
    normalizedMatricula,
    senhaHash
  );

  return NextResponse.json({ ok: true });
}
