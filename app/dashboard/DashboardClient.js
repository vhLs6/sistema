"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Save,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";

const emptyTrabalho = {
  titulo: "",
  dataEntrega: "",
  materia: "",
  valor: "",
};

const emptyNota = {
  materia: "",
  notaAtual: "",
  creditos: "",
  faltas: "",
};

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const oneDecimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const deadlineFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const dayInMs = 24 * 60 * 60 * 1000;

const dayIdsByDateIndex = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

const scheduleDays = [
  { id: "segunda", label: "Segunda" },
  { id: "terca", label: "Terça" },
  { id: "quarta", label: "Quarta" },
  { id: "quinta", label: "Quinta" },
  { id: "sexta", label: "Sexta" },
];

const scheduleSlots = [
  { id: "07:00", label: "7:00 - 7:50" },
  { id: "07:50", label: "7:50 - 8:40" },
  { id: "08:40", label: "8:40 - 9:30" },
  { id: "recreio-manha", label: "9:30 - 9:50", breakLabel: "Recreio" },
  { id: "09:50", label: "9:50 - 10:40" },
  { id: "10:40", label: "10:40 - 11:30" },
  { id: "almoco", label: "11:30 - 13:00", breakLabel: "Almoço" },
  { id: "13:00", label: "13:00 - 13:50" },
  { id: "13:50", label: "13:50 - 14:40" },
  { id: "pausa-tarde", label: "14:40 - 15:00", breakLabel: "Pausa" },
  { id: "15:00", label: "15:00 - 15:50" },
  { id: "15:50", label: "15:50 - 16:40" },
];

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return numberFormatter.format(toNumber(value));
}

function formatTruncatedOneDecimal(value) {
  return oneDecimalFormatter.format(Math.trunc(toNumber(value) * 10) / 10);
}

function notaRestante(notaAtual) {
  return Math.max(60 - toNumber(notaAtual), 0);
}

function startOfDay(date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
}

function parseDateInput(value) {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDeadlineLabel(daysUntil) {
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `Em ${daysUntil} dias`;
}

function horarioKey(dayId, slotId) {
  return `${dayId}__${slotId}`;
}

function isUnavailableHorario(value) {
  return String(value || "").trim().toLowerCase() === "null";
}

function buildTodayOverview(todayDate, horarios) {
  if (!todayDate) {
    return {
      status: "loading",
      dateLabel: "Carregando seu dia...",
      lessons: [],
    };
  }

  const dayId = dayIdsByDateIndex[todayDate.getDay()];
  const dateLabel = todayFormatter.format(todayDate);

  if (dayId === "sabado" || dayId === "domingo") {
    return {
      status: "weekend",
      dateLabel,
      lessons: [],
      message:
        dayId === "sabado"
          ? "Sábado chegou: sem aulas cadastradas por aqui. Dá pra respirar um pouco."
          : "Domingo é território de descanso. Amanhã a gente volta pro plano.",
    };
  }

  const lessons = scheduleSlots
    .filter((slot) => !slot.breakLabel)
    .map((slot) => {
      const value = horarios[horarioKey(dayId, slot.id)] || "";
      const materia = String(value).trim();

      if (!materia || isUnavailableHorario(materia)) return null;

      return {
        id: slot.id,
        label: slot.label,
        materia,
      };
    })
    .filter(Boolean);

  return {
    status: "weekday",
    dateLabel,
    lessons,
  };
}

function buildUpcomingDeadlines(trabalhos, todayDate) {
  if (!todayDate) return [];

  const today = startOfDay(todayDate);

  return trabalhos
    .map((trabalho) => {
      const deadlineDate = parseDateInput(trabalho.dataEntrega);
      if (!deadlineDate) return null;

      const daysUntil = Math.round((startOfDay(deadlineDate) - today) / dayInMs);
      if (daysUntil < 0 || daysUntil > 7) return null;

      return {
        ...trabalho,
        daysUntil,
        dateLabel: deadlineFormatter.format(deadlineDate),
        deadlineLabel: getDeadlineLabel(daysUntil),
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.daysUntil - second.daysUntil || first.id - second.id)
    .slice(0, 5);
}

function createHorarioGrid(initialHorarios = []) {
  const grid = {};

  for (const slot of scheduleSlots) {
    if (slot.breakLabel) continue;

    for (const day of scheduleDays) {
      grid[horarioKey(day.id, slot.id)] = "";
    }
  }

  for (const item of initialHorarios) {
    const key = horarioKey(item.dia, item.horario);

    if (key in grid) {
      grid[key] = item.conteudo || "";
    }
  }

  return grid;
}

function horarioGridToList(grid) {
  const horarios = [];

  for (const slot of scheduleSlots) {
    if (slot.breakLabel) continue;

    for (const day of scheduleDays) {
      horarios.push({
        dia: day.id,
        horario: slot.id,
        conteudo: grid[horarioKey(day.id, slot.id)] || "",
      });
    }
  }

  return horarios;
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#1d6f8f] focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950 ${className}`}
    />
  );
}

function DateInput(props) {
  return <Input {...props} type="date" className={`min-w-0 appearance-none ${props.className || ""}`} />;
}

function IconButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export default function DashboardClient({
  userName,
  initialProfile,
  initialTrabalhos,
  initialNotas,
  initialHorarios,
}) {
  const [activeTab, setActiveTab] = useState("inicio");
  const [profile, setProfile] = useState(initialProfile);
  const [trabalhos, setTrabalhos] = useState(initialTrabalhos);
  const [notas, setNotas] = useState(initialNotas);
  const [horarios, setHorarios] = useState(() => createHorarioGrid(initialHorarios));
  const [novoTrabalho, setNovoTrabalho] = useState(emptyTrabalho);
  const [novaNota, setNovaNota] = useState(emptyNota);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [todayDate, setTodayDate] = useState(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    setTodayDate(new Date());
  }, []);

  useEffect(() => {
    if (!message && !error) return;

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [message, error]);

  function toggleDarkMode() {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    document.documentElement.classList.toggle("dark", nextMode);
    window.localStorage.setItem("theme", nextMode ? "dark" : "light");
  }

  const stats = useMemo(() => {
    const totalMaterias = notas.length;
    const creditosTotais = notas.reduce((sum, nota) => sum + toNumber(nota.creditos), 0);
    const somaPonderada = notas.reduce(
      (sum, nota) => sum + toNumber(nota.notaAtual) * toNumber(nota.creditos),
      0
    );
    const coeficiente = creditosTotais > 0 ? somaPonderada / creditosTotais : 0;
    const trabalhosPendentes = trabalhos.length;

    return {
      coeficiente,
      totalMaterias,
      creditosTotais,
      trabalhosPendentes,
    };
  }, [notas, trabalhos]);

  const todayOverview = useMemo(
    () => buildTodayOverview(todayDate, horarios),
    [todayDate, horarios]
  );

  const upcomingDeadlines = useMemo(
    () => buildUpcomingDeadlines(trabalhos, todayDate),
    [trabalhos, todayDate]
  );

  async function sendRequest(url, options) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível salvar.");
    }

    return data;
  }

  function showSuccess(text) {
    setError("");
    setMessage(text);
  }

  function showError(errorObject) {
    setMessage("");
    setError(errorObject.message || "Não foi possível concluir a operação.");
  }

  function updateTrabalho(id, field, value) {
    setTrabalhos((current) =>
      current.map((trabalho) =>
        trabalho.id === id ? { ...trabalho, [field]: value } : trabalho
      )
    );
  }

  function updateNota(id, field, value) {
    setNotas((current) =>
      current.map((nota) => (nota.id === id ? { ...nota, [field]: value } : nota))
    );
  }

  function updateHorario(dayId, slotId, value) {
    setHorarios((current) => ({
      ...current,
      [horarioKey(dayId, slotId)]: value,
    }));
  }

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy("save-profile");

    try {
      const data = await sendRequest("/api/perfil", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });

      setProfile(data.profile);
      showSuccess("Informações pessoais salvas.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  function generateGradesPdf() {
    const doc = new jsPDF();
    const materiasAprovadas = notas.filter((nota) => toNumber(nota.notaAtual) >= 60);
    const materiasTranquilas = notas.filter(
      (nota) => toNumber(nota.notaAtual) < 60 && notaRestante(nota.notaAtual) <= 30
    );
    const materiasComRisco = notas.filter((nota) => notaRestante(nota.notaAtual) > 30);
    const nomeCompleto = profile.nomeCompleto || userName;

    let y = 18;
    const marginX = 14;
    const pageBottom = 282;
    const tableWidth = 182;
    const columns = [
      { label: "Matérias", x: marginX, width: 92 },
      { label: "Nota atual", x: marginX + 92, width: 38 },
      { label: "Pontos restantes", x: marginX + 130, width: 52 },
    ];

    function ensureSpace(height) {
      if (y + height <= pageBottom) return;
      doc.addPage();
      y = 18;
    }

    function drawTable(sectionTitle, rows, emptyText) {
      ensureSpace(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(sectionTitle, marginX, y);
      y += 7;

      doc.setFillColor(226, 232, 240);
      doc.setDrawColor(203, 213, 225);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      columns.forEach((column) => {
        doc.rect(column.x, y, column.width, 9, "FD");
      });
      doc.text("Matérias", columns[0].x + 2, y + 6);
      doc.text("Nota atual", columns[1].x + 2, y + 6);
      doc.text("Pontos restantes", columns[2].x + 2, y + 6);
      y += 9;
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");

      if (rows.length === 0) {
        doc.setFontSize(10);
        doc.rect(marginX, y, tableWidth, 10);
        doc.text(emptyText, marginX + 2, y + 6.5);
        y += 20;
        return;
      }

      rows.forEach((nota) => {
        const materiaLines = doc.splitTextToSize(nota.materia || "-", 86);
        const rowHeight = Math.max(10, materiaLines.length * 5 + 4);
        ensureSpace(rowHeight + 2);
        doc.setFontSize(9);
        doc.setDrawColor(203, 213, 225);

        columns.forEach((column) => {
          doc.rect(column.x, y, column.width, rowHeight);
        });

        doc.text(materiaLines, columns[0].x + 2, y + 5);
        doc.text(formatNumber(nota.notaAtual), columns[1].x + 2, y + 6);
        doc.text(formatNumber(notaRestante(nota.notaAtual)), columns[2].x + 2, y + 6);
        y += rowHeight;
      });

      y += 14;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Relatório de notas", 14, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    [
      `Nome completo: ${nomeCompleto || "-"}`,
      `Matrícula: ${profile.matricula || "-"}`,
      `Ano no ensino médio: ${profile.anoEnsinoMedio || "-"}`,
      `Período: ${profile.periodo || "-"}`,
      `Coeficiente atual: ${formatTruncatedOneDecimal(stats.coeficiente)}`,
    ].forEach((line) => {
      doc.text(line, 14, y);
      y += 7;
    });

    y += 4;
    drawTable(
      "Matérias com aprovação registrada",
      materiasAprovadas,
      "Nenhuma matéria com aprovação registrada."
    );
    drawTable(
      "Matérias em situação tranquila",
      materiasTranquilas,
      "Nenhuma matéria nessa situação."
    );
    drawTable(
      "Matérias que precisam de mais pontos",
      materiasComRisco,
      "Nenhuma matéria nessa situação."
    );

    doc.save(`relatorio-notas-${profile.matricula || "aluno"}.pdf`);
  }

  async function addTrabalho(event) {
    event.preventDefault();
    setBusy("add-trabalho");

    try {
      const data = await sendRequest("/api/trabalhos", {
        method: "POST",
        body: JSON.stringify(novoTrabalho),
      });

      setTrabalhos((current) => [...current, data.trabalho]);
      setNovoTrabalho(emptyTrabalho);
      showSuccess("Trabalho adicionado.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function saveTrabalho(trabalho) {
    setBusy(`trabalho-${trabalho.id}`);

    try {
      const data = await sendRequest(`/api/trabalhos/${trabalho.id}`, {
        method: "PATCH",
        body: JSON.stringify(trabalho),
      });

      setTrabalhos((current) =>
        current.map((item) => (item.id === trabalho.id ? data.trabalho : item))
      );
      showSuccess("Trabalho salvo.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function deleteTrabalho(id) {
    setBusy(`delete-trabalho-${id}`);

    try {
      await sendRequest(`/api/trabalhos/${id}`, { method: "DELETE" });
      setTrabalhos((current) => current.filter((trabalho) => trabalho.id !== id));
      showSuccess("Trabalho removido.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function addNota(event) {
    event.preventDefault();
    setBusy("add-nota");

    try {
      const data = await sendRequest("/api/notas", {
        method: "POST",
        body: JSON.stringify(novaNota),
      });

      setNotas((current) => [...current, data.nota]);
      setNovaNota(emptyNota);
      showSuccess("Matéria adicionada.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function saveNota(nota) {
    setBusy(`nota-${nota.id}`);

    try {
      const data = await sendRequest(`/api/notas/${nota.id}`, {
        method: "PATCH",
        body: JSON.stringify(nota),
      });

      setNotas((current) => current.map((item) => (item.id === nota.id ? data.nota : item)));
      showSuccess("Nota salva.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function deleteNota(id) {
    setBusy(`delete-nota-${id}`);

    try {
      await sendRequest(`/api/notas/${id}`, { method: "DELETE" });
      setNotas((current) => current.filter((nota) => nota.id !== id));
      showSuccess("Matéria removida.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function saveHorarios() {
    setBusy("save-horarios");

    try {
      const data = await sendRequest("/api/horarios", {
        method: "PATCH",
        body: JSON.stringify({ horarios: horarioGridToList(horarios) }),
      });

      setHorarios(createHorarioGrid(data.horarios));
      showSuccess("Horários salvos.");
    } catch (requestError) {
      showError(requestError);
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    setBusy("logout");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } finally {
      setBusy("");
    }
  }

  const navItems = [
    { id: "inicio", label: "Início", icon: LayoutDashboard },
    { id: "notas", label: "Notas", icon: GraduationCap },
    { id: "trabalhos", label: "Trabalhos", icon: ClipboardList },
    { id: "horarios", label: "Horários", icon: CalendarDays },
    { id: "perfil", label: "Informações pessoais", icon: UserRound },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#1d6f8f]">
                Área interna
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">Estudos</h1>
            </div>

            <div className="flex gap-2 lg:hidden">
              <IconButton
                type="button"
                onClick={toggleDarkMode}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title={darkMode ? "Modo claro" : "Modo escuro"}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <IconButton
                type="button"
                onClick={logout}
                disabled={busy === "logout"}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Sair"
              >
                <LogOut size={18} />
              </IconButton>
            </div>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#17324d] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 hidden lg:block">
            <IconButton
              type="button"
              onClick={toggleDarkMode}
              className="mb-3 w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? "Modo claro" : "Modo escuro"}
            </IconButton>
            <IconButton
              type="button"
              onClick={logout}
              disabled={busy === "logout"}
              className="w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <LogOut size={18} />
              Sair
            </IconButton>
          </div>
        </aside>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          {(message || error) && (
            <div
              className={`mb-5 rounded-md border px-4 py-3 text-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              }`}
            >
              {error || message}
            </div>
          )}

          {activeTab === "perfil" && (
            <ProfileSection
              profile={profile}
              updateProfile={updateProfile}
              saveProfile={saveProfile}
              busy={busy}
            />
          )}

          {activeTab === "inicio" && (
            <div className="space-y-6">
              <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#1d6f8f]">
                  Bem-vindo
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">
                  Olá, {userName}.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Seu dia, seus prazos e os números principais em um lugar só.
                </p>
              </header>

              <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <TodayClassesCard overview={todayOverview} />
                <UpcomingDeadlinesCard deadlines={upcomingDeadlines} ready={Boolean(todayDate)} />
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Informações importantes</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Coeficiente atual"
                    value={formatTruncatedOneDecimal(stats.coeficiente)}
                    icon={<GraduationCap size={20} />}
                  />
                  <Metric
                    label="Matérias"
                    value={formatNumber(stats.totalMaterias)}
                    icon={<BookOpen size={20} />}
                  />
                  <Metric
                    label="Trabalhos"
                    value={formatNumber(stats.trabalhosPendentes)}
                    icon={<ClipboardList size={20} />}
                  />
                  <Metric
                    label="Créditos totais"
                    value={formatNumber(stats.creditosTotais)}
                    icon={<LayoutDashboard size={20} />}
                  />
                </div>
              </section>

            </div>
          )}

          {activeTab === "trabalhos" && (
            <WorkSection
              trabalhos={trabalhos}
              novoTrabalho={novoTrabalho}
              setNovoTrabalho={setNovoTrabalho}
              updateTrabalho={updateTrabalho}
              addTrabalho={addTrabalho}
              saveTrabalho={saveTrabalho}
              deleteTrabalho={deleteTrabalho}
              busy={busy}
            />
          )}

          {activeTab === "notas" && (
            <GradeSection
              notas={notas}
              novaNota={novaNota}
              setNovaNota={setNovaNota}
              updateNota={updateNota}
              addNota={addNota}
              saveNota={saveNota}
              deleteNota={deleteNota}
              generateGradesPdf={generateGradesPdf}
              busy={busy}
            />
          )}

          {activeTab === "horarios" && (
            <ScheduleSection
              horarios={horarios}
              updateHorario={updateHorario}
              saveHorarios={saveHorarios}
              busy={busy}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-[#1d6f8f] dark:bg-cyan-950 dark:text-cyan-300">
          {icon}
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
    </div>
  );
}

function ProfileSection({ profile, updateProfile, saveProfile, busy }) {
  const fields = [
    { id: "nomeCompleto", label: "Nome completo", placeholder: "Seu nome completo" },
    { id: "idade", label: "Idade", placeholder: "Sua idade" },
    { id: "matricula", label: "Matrícula", placeholder: "Sua matrícula" },
    { id: "anoEnsinoMedio", label: "Ano no ensino médio", placeholder: "Ex: 2º ano" },
    { id: "periodo", label: "Período", placeholder: "Ex: manhã" },
    { id: "turma", label: "Turma", placeholder: "Ex: 2A" },
    { id: "cursoTecnico", label: "Curso técnico", placeholder: "Seu curso técnico" },
    { id: "emailAcademico", label: "Email acadêmico", placeholder: "seu.email@escola.com" },
    { id: "numeroBiblioteca", label: "Número da biblioteca", placeholder: "Seu número" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Informações pessoais</h2>
      </header>

      <form
        onSubmit={saveProfile}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {field.label}
              </label>
              <Input
                id={field.id}
                type={field.id === "emailAcademico" ? "email" : "text"}
                value={profile[field.id] || ""}
                onChange={(event) => updateProfile(field.id, event.target.value)}
                placeholder={field.placeholder}
                className="mt-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <IconButton
            type="submit"
            disabled={busy === "save-profile"}
            className="bg-[#1d6f8f] text-white hover:bg-[#155873]"
          >
            <Save size={18} />
            Salvar informações
          </IconButton>
        </div>
      </form>
    </div>
  );
}

function deadlineBadgeClassName(daysUntil) {
  if (daysUntil === 0) {
    return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200";
  }

  if (daysUntil === 1) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "bg-cyan-50 text-[#1d6f8f] dark:bg-cyan-950 dark:text-cyan-200";
}

function TodayClassesCard({ overview }) {
  const hasLessons = overview.lessons.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1d6f8f]">Hoje</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {overview.dateLabel}
          </h3>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {overview.status === "weekend" ? "Descanso" : "Aulas"}
        </span>
      </div>

      {overview.status === "loading" && (
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">Organizando seu dia...</p>
      )}

      {overview.status === "weekend" && (
        <p className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {overview.message}
        </p>
      )}

      {overview.status === "weekday" && !hasLessons && (
        <p className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Nenhuma matéria cadastrada para hoje.
        </p>
      )}

      {overview.status === "weekday" && hasLessons && (
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {overview.lessons.map((lesson) => (
            <div key={`${lesson.id}-${lesson.materia}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-9 min-w-[4rem] items-center justify-center rounded-md bg-cyan-50 px-2 text-xs font-semibold text-[#1d6f8f] dark:bg-cyan-950 dark:text-cyan-200">
                {lesson.id}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {lesson.materia}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{lesson.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UpcomingDeadlinesCard({ deadlines, ready }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1d6f8f]">
          Prazos próximos
        </p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
          Próximos 7 dias
        </h3>
      </div>

      {!ready && (
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">Carregando prazos...</p>
      )}

      {ready && deadlines.length === 0 && (
        <p className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Nenhum prazo chegando nos próximos 7 dias.
        </p>
      )}

      {ready && deadlines.length > 0 && (
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {deadlines.map((trabalho) => (
            <div key={trabalho.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {trabalho.titulo}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {trabalho.materia || "Sem matéria"} - {trabalho.dateLabel}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${deadlineBadgeClassName(
                    trabalho.daysUntil
                  )}`}
                >
                  {trabalho.deadlineLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ScheduleSection({ horarios, updateHorario, saveHorarios, busy }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Horários</h2>
        <IconButton
          type="button"
          onClick={saveHorarios}
          disabled={busy === "save-horarios"}
          className="bg-[#1d6f8f] text-white hover:bg-[#155873]"
        >
          <Save size={18} />
          Salvar horários
        </IconButton>
      </header>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="w-36 px-3 py-2 font-semibold">Horário</th>
                {scheduleDays.map((day) => (
                  <th key={day.id} className="px-3 py-2 font-semibold">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scheduleSlots.map((slot) => {
                if (slot.breakLabel) {
                  return (
                    <tr key={slot.id} className="bg-slate-50 dark:bg-slate-800/70">
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{slot.label}</td>
                      <td
                        colSpan={scheduleDays.length}
                        className="px-3 py-2 text-center font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {slot.breakLabel}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id}>
                    <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{slot.label}</td>
                    {scheduleDays.map((day) => {
                      const value = horarios[horarioKey(day.id, slot.id)] || "";
                      const unavailable = isUnavailableHorario(value);

                      return (
                        <td key={day.id} className="px-2 py-2 align-top">
                          <input
                            type="text"
                            value={unavailable ? "" : value}
                            onChange={(event) =>
                              updateHorario(day.id, slot.id, event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                unavailable &&
                                (event.key === "Backspace" || event.key === "Delete")
                              ) {
                                updateHorario(day.id, slot.id, "");
                              }
                            }}
                            title={unavailable ? "Sem matéria nesse horário" : undefined}
                            className={`h-10 w-full rounded-md border px-2 text-sm outline-none transition focus:border-[#1d6f8f] focus:ring-4 focus:ring-cyan-100 dark:focus:ring-cyan-950 ${
                              unavailable
                                ? "border-slate-400 bg-slate-200 text-slate-400 shadow-inner dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-500"
                                : "border-slate-300 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkSection({
  trabalhos,
  novoTrabalho,
  setNovoTrabalho,
  updateTrabalho,
  addTrabalho,
  saveTrabalho,
  deleteTrabalho,
  busy,
}) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Trabalhos</h2>
      </header>

      <form
        onSubmit={addTrabalho}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1.4fr_180px_1fr_140px_auto]"
      >
        <Input
          value={novoTrabalho.titulo}
          onChange={(event) =>
            setNovoTrabalho((current) => ({ ...current, titulo: event.target.value }))
          }
          placeholder="Trabalho"
        />
        <DateInput
          aria-label="Data para entrega"
          title="Data para entrega"
          value={novoTrabalho.dataEntrega}
          onChange={(event) =>
            setNovoTrabalho((current) => ({ ...current, dataEntrega: event.target.value }))
          }
        />
        <Input
          value={novoTrabalho.materia}
          onChange={(event) =>
            setNovoTrabalho((current) => ({ ...current, materia: event.target.value }))
          }
          placeholder="Matéria"
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          value={novoTrabalho.valor}
          onChange={(event) =>
            setNovoTrabalho((current) => ({ ...current, valor: event.target.value }))
          }
          placeholder="Valor"
        />
        <IconButton
          type="submit"
          disabled={busy === "add-trabalho"}
          className="bg-[#1d6f8f] text-white hover:bg-[#155873]"
        >
          <Plus size={18} />
          Adicionar
        </IconButton>
      </form>

      <div className="space-y-3 md:hidden">
        {trabalhos.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Nenhum trabalho cadastrado.
          </div>
        )}

        {trabalhos.map((trabalho) => (
          <article
            key={trabalho.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Trabalho
                </p>
                <Input
                  value={trabalho.titulo}
                  onChange={(event) => updateTrabalho(trabalho.id, "titulo", event.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex shrink-0 gap-2 pt-5">
                <IconButton
                  type="button"
                  onClick={() => saveTrabalho(trabalho)}
                  disabled={busy === `trabalho-${trabalho.id}`}
                  className="h-10 w-10 border border-slate-200 bg-white px-0 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Salvar"
                  aria-label="Salvar trabalho"
                >
                  <Save size={18} />
                </IconButton>
                <IconButton
                  type="button"
                  onClick={() => deleteTrabalho(trabalho.id)}
                  disabled={busy === `delete-trabalho-${trabalho.id}`}
                  className="h-10 w-10 border border-red-200 bg-red-50 px-0 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
                  title="Remover"
                  aria-label="Remover trabalho"
                >
                  <Trash2 size={18} />
                </IconButton>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Entrega
                </p>
                <DateInput
                  aria-label="Data para entrega"
                  title="Data para entrega"
                  value={trabalho.dataEntrega}
                  onChange={(event) =>
                    updateTrabalho(trabalho.id, "dataEntrega", event.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Valor
                </p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={trabalho.valor}
                  onChange={(event) => updateTrabalho(trabalho.id, "valor", event.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Matéria
                </p>
                <Input
                  value={trabalho.materia}
                  onChange={(event) => updateTrabalho(trabalho.id, "materia", event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Trabalho</th>
                <th className="px-4 py-3 font-semibold">Data para entrega</th>
                <th className="px-4 py-3 font-semibold">Matéria</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trabalhos.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum trabalho cadastrado.
                  </td>
                </tr>
              )}

              {trabalhos.map((trabalho) => (
                <tr key={trabalho.id}>
                  <td className="px-4 py-3">
                    <Input
                      value={trabalho.titulo}
                      onChange={(event) => updateTrabalho(trabalho.id, "titulo", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DateInput
                      aria-label="Data para entrega"
                      title="Data para entrega"
                      value={trabalho.dataEntrega}
                      onChange={(event) =>
                        updateTrabalho(trabalho.id, "dataEntrega", event.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={trabalho.materia}
                      onChange={(event) =>
                        updateTrabalho(trabalho.id, "materia", event.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={trabalho.valor}
                      onChange={(event) => updateTrabalho(trabalho.id, "valor", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <IconButton
                        type="button"
                        onClick={() => saveTrabalho(trabalho)}
                        disabled={busy === `trabalho-${trabalho.id}`}
                        className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title="Salvar"
                      >
                        <Save size={18} />
                      </IconButton>
                      <IconButton
                        type="button"
                        onClick={() => deleteTrabalho(trabalho.id)}
                        disabled={busy === `delete-trabalho-${trabalho.id}`}
                        className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GradeSection({
  notas,
  novaNota,
  setNovaNota,
  updateNota,
  addNota,
  saveNota,
  deleteNota,
  generateGradesPdf,
  busy,
}) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Controle de notas</h2>
      </header>

      <form
        onSubmit={addNota}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1.4fr_140px_140px_120px_auto]"
      >
        <Input
          value={novaNota.materia}
          onChange={(event) =>
            setNovaNota((current) => ({ ...current, materia: event.target.value }))
          }
          placeholder="Matéria"
        />
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={novaNota.notaAtual}
          onChange={(event) =>
            setNovaNota((current) => ({ ...current, notaAtual: event.target.value }))
          }
          placeholder="Minha nota"
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          value={novaNota.creditos}
          onChange={(event) =>
            setNovaNota((current) => ({ ...current, creditos: event.target.value }))
          }
          placeholder="Créditos"
        />
        <Input
          type="number"
          min="0"
          step="1"
          value={novaNota.faltas}
          onChange={(event) =>
            setNovaNota((current) => ({ ...current, faltas: event.target.value }))
          }
          placeholder="Faltas"
        />
        <IconButton
          type="submit"
          disabled={busy === "add-nota"}
          className="bg-[#1d6f8f] text-white hover:bg-[#155873]"
        >
          <Plus size={18} />
          Adicionar
        </IconButton>
      </form>

      <div className="space-y-3 md:hidden">
        {notas.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Nenhuma matéria cadastrada.
          </div>
        )}

        {notas.map((nota) => (
          <article
            key={nota.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Matéria
                </p>
                <Input
                  value={nota.materia}
                  onChange={(event) => updateNota(nota.id, "materia", event.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex shrink-0 gap-2 pt-5">
                <IconButton
                  type="button"
                  onClick={() => saveNota(nota)}
                  disabled={busy === `nota-${nota.id}`}
                  className="h-10 w-10 border border-slate-200 bg-white px-0 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Salvar"
                  aria-label="Salvar nota"
                >
                  <Save size={18} />
                </IconButton>
                <IconButton
                  type="button"
                  onClick={() => deleteNota(nota.id)}
                  disabled={busy === `delete-nota-${nota.id}`}
                  className="h-10 w-10 border border-red-200 bg-red-50 px-0 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
                  title="Remover"
                  aria-label="Remover nota"
                >
                  <Trash2 size={18} />
                </IconButton>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Minha nota
                </p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={nota.notaAtual}
                  onChange={(event) => updateNota(nota.id, "notaAtual", event.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Créditos
                </p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nota.creditos}
                  onChange={(event) => updateNota(nota.id, "creditos", event.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Nota restante
                </p>
                <span className="mt-1 flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {formatNumber(notaRestante(nota.notaAtual))}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Faltas
                </p>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={nota.faltas ?? ""}
                  onChange={(event) => updateNota(nota.id, "faltas", event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
        <div className="overflow-x-auto">
          <table className="grades-table w-full min-w-[960px] border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Matéria</th>
                <th className="px-4 py-3 font-semibold">Minha nota</th>
                <th className="px-4 py-3 font-semibold">Nota restante</th>
                <th className="px-4 py-3 font-semibold">Faltas</th>
                <th className="px-4 py-3 font-semibold">Créditos</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notas.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma matéria cadastrada.
                  </td>
                </tr>
              )}

              {notas.map((nota) => (
                <tr key={nota.id}>
                  <td className="px-4 py-3">
                    <Input
                      value={nota.materia}
                      onChange={(event) => updateNota(nota.id, "materia", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={nota.notaAtual}
                      onChange={(event) => updateNota(nota.id, "notaAtual", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {formatNumber(notaRestante(nota.notaAtual))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={nota.faltas ?? ""}
                      onChange={(event) => updateNota(nota.id, "faltas", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={nota.creditos}
                      onChange={(event) => updateNota(nota.id, "creditos", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <IconButton
                        type="button"
                        onClick={() => saveNota(nota)}
                        disabled={busy === `nota-${nota.id}`}
                        className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title="Salvar"
                      >
                        <Save size={18} />
                      </IconButton>
                      <IconButton
                        type="button"
                        onClick={() => deleteNota(nota.id)}
                        disabled={busy === `delete-nota-${nota.id}`}
                        className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <IconButton
          type="button"
          onClick={generateGradesPdf}
          className="bg-[#17324d] text-white hover:bg-[#10263b]"
        >
          <FileDown size={18} />
          Gerar PDF
        </IconButton>
      </div>
    </div>
  );
}
