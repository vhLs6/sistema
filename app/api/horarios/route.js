import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const allowedDays = new Set(["segunda", "terca", "quarta", "quinta", "sexta"]);
const allowedTimes = new Set([
  "07:00",
  "07:50",
  "08:40",
  "09:50",
  "10:40",
  "11:30",
  "13:00",
  "13:50",
  "15:00",
  "15:50",
  "16:40",
]);

function normalizeCell(cell) {
  const dia = String(cell?.dia || "").trim();
  const horario = String(cell?.horario || "").trim();
  const conteudo = String(cell?.conteudo || "").trim();

  if (!allowedDays.has(dia) || !allowedTimes.has(horario)) {
    return null;
  }

  return { dia, horario, conteudo };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const horarios = db
    .prepare("SELECT dia, horario, conteudo FROM horarios WHERE usuario_id = ?")
    .all(user.id);

  return NextResponse.json({ horarios });
}

export async function PATCH(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const data = await request.json();
  const cells = Array.isArray(data.horarios) ? data.horarios.map(normalizeCell).filter(Boolean) : [];

  const saveHorarios = db.transaction(() => {
    db.prepare("DELETE FROM horarios WHERE usuario_id = ?").run(user.id);

    const insert = db.prepare(
      "INSERT INTO horarios (usuario_id, dia, horario, conteudo) VALUES (?, ?, ?, ?)"
    );

    for (const cell of cells) {
      if (cell.conteudo) {
        insert.run(user.id, cell.dia, cell.horario, cell.conteudo);
      }
    }
  });

  saveHorarios();

  const horarios = db
    .prepare("SELECT dia, horario, conteudo FROM horarios WHERE usuario_id = ?")
    .all(user.id);

  return NextResponse.json({ horarios });
}
