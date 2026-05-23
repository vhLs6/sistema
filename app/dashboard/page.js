import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const trabalhos = db
    .prepare(
      "SELECT id, titulo, data_entrega AS dataEntrega, materia, valor FROM trabalhos WHERE usuario_id = ? ORDER BY data_entrega ASC, id DESC"
    )
    .all(user.id);

  const notas = db
    .prepare(
      "SELECT id, materia, nota_atual AS notaAtual, creditos FROM notas WHERE usuario_id = ? ORDER BY materia ASC, id DESC"
    )
    .all(user.id);

  const horarios = db
    .prepare(
      "SELECT dia, horario, conteudo FROM horarios WHERE usuario_id = ? ORDER BY horario ASC, dia ASC"
    )
    .all(user.id);

  return (
    <DashboardClient
      userName={user.nome}
      initialProfile={user}
      initialTrabalhos={trabalhos}
      initialNotas={notas}
      initialHorarios={horarios}
    />
  );
}
