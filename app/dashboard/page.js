import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const trabalhos = await query(
    "SELECT id, titulo, data_entrega AS \"dataEntrega\", materia, valor FROM trabalhos WHERE usuario_id = $1 ORDER BY data_entrega ASC, id DESC",
    [user.id]
  );

  const notas = await query(
    "SELECT id, materia, nota_atual AS \"notaAtual\", creditos, faltas FROM notas WHERE usuario_id = $1 ORDER BY materia ASC, id DESC",
    [user.id]
  );

  const horarios = await query(
    "SELECT dia, horario, conteudo FROM horarios WHERE usuario_id = $1 ORDER BY horario ASC, dia ASC",
    [user.id]
  );

  return (
    <DashboardClient
      userName={user.nome}
      initialProfile={user}
      initialTrabalhos={trabalhos.rows}
      initialNotas={notas.rows}
      initialHorarios={horarios.rows}
    />
  );
}
