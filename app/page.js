"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Hourglass, LogIn, Moon, Power, Skull, Sun, UserPlus } from "lucide-react";

const horrorProfiles = [
  { id: "friend-1", name: "Friend 1", initialMs: 23 * 60 * 60 * 1000 + 59 * 60 * 1000 },
  { id: "friend-2", name: "Friend 2", initialMs: 44 * 365 * 24 * 60 * 60 * 1000 + 3 * 30 * 24 * 60 * 60 * 1000 },
  { id: "friend-3", name: "Friend 3", initialMs: 52 * 365 * 24 * 60 * 60 * 1000 + 8 * 30 * 24 * 60 * 60 * 1000 },
  { id: "friend-4", name: "Friend 4", initialMs: 67 * 365 * 24 * 60 * 60 * 1000 + 2 * 30 * 24 * 60 * 60 * 1000 },
  { id: "friend-5", name: "Friend 5", initialMs: 81 * 365 * 24 * 60 * 60 * 1000 + 6 * 30 * 24 * 60 * 60 * 1000 },
];

const deathTimeFields = [
  { key: "years", label: "Years", multiplier: 365 * 24 * 60 * 60 * 1000 },
  { key: "months", label: "Months", multiplier: 30 * 24 * 60 * 60 * 1000 },
  { key: "days", label: "Days", multiplier: 24 * 60 * 60 * 1000 },
  { key: "hours", label: "Hours", multiplier: 60 * 60 * 1000 },
  { key: "minutes", label: "Minutes", multiplier: 60 * 1000 },
  { key: "seconds", label: "Seconds", multiplier: 1000 },
];

function splitDeathTime(milliseconds) {
  let totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const years = Math.floor(totalSeconds / (365 * 24 * 60 * 60));
  totalSeconds -= years * 365 * 24 * 60 * 60;

  const months = Math.floor(totalSeconds / (30 * 24 * 60 * 60));
  totalSeconds -= months * 30 * 24 * 60 * 60;

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  totalSeconds -= days * 24 * 60 * 60;

  const hours = Math.floor(totalSeconds / (60 * 60));
  totalSeconds -= hours * 60 * 60;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  return [
    { label: "YEARS", value: years },
    { label: "MONTHS", value: months },
    { label: "DAYS", value: days },
    { label: "HOURS", value: hours },
    { label: "MINUTES", value: minutes },
    { label: "SECONDS", value: seconds },
  ];
}

function formatClockValue(value) {
  return String(value).padStart(2, "0");
}

function findHorrorProfile(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalizedValue) return null;

  return (
    horrorProfiles.find((profile) => {
      const normalizedName = profile.name.toLowerCase();
      const compactName = normalizedName.replace(/\s+/g, "");

      return (
        normalizedValue === normalizedName ||
        normalizedValue.replace(/\s+/g, "") === compactName ||
        normalizedValue === profile.id
      );
    }) || null
  );
}

function timePartsToFormValues(timeParts) {
  return deathTimeFields.reduce((values, field) => {
    const matchingPart = timeParts.find((part) => part.label.toLowerCase() === field.key);
    values[field.key] = matchingPart ? String(matchingPart.value) : "0";
    return values;
  }, {});
}

function formValuesToMilliseconds(values) {
  return deathTimeFields.reduce((total, field) => {
    const number = Number(values[field.key]);
    const safeNumber = Number.isFinite(number) && number > 0 ? number : 0;
    return total + safeNumber * field.multiplier;
  }, 0);
}

export default function Home() {
  const [mode, setMode] = useState("login");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [horrorAppOpen, setHorrorAppOpen] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleDarkMode() {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    document.documentElement.classList.toggle("dark", nextMode);
    window.localStorage.setItem("theme", nextMode ? "dark" : "light");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, matricula, senha }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Não foi possível concluir a operação.");
      return;
    }

    if (isLogin) {
      window.location.href = "/dashboard";
      return;
    }

    setMode("login");
    setSenha("");
    setMessage("Cadastro realizado. Agora entre com seu nome, matricula e senha.");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  function openHorrorApp() {
    window.scrollTo(0, 0);

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    setHorrorAppOpen(true);
  }

  function closeHorrorApp() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    setHorrorAppOpen(false);
  }

  if (horrorAppOpen) {
    return <HorrorShortFilmExperience onExit={closeHorrorApp} />;
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_420px]">
          <div className="flex min-h-80 flex-col justify-between bg-[#17324d] p-8 text-white md:p-10">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-cyan-200">
                Área de estudos
              </p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight md:text-5xl">
                Organize sua rotina escolar em um só lugar
              </h1>
            </div>
            <p className="mt-10 max-w-sm text-sm leading-6 text-slate-200">
              Acompanhe horários, trabalhos, provas, notas e faltas com um painel feito para o dia a dia.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? "Modo claro" : "Modo escuro"}
              </button>
            </div>

            <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex h-11 items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  isLogin
                    ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                <LogIn size={18} />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex h-11 items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  !isLogin
                    ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                <UserPlus size={18} />
                Cadastrar
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">{isLogin ? "Entrar" : "Criar conta"}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {isLogin
                  ? "Entre para ver seus horários, prazos, notas e provas."
                  : "Crie sua conta para montar seu painel de estudos."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="nome" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nome de usuário
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  autoComplete="username"
                  className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-[#1d6f8f] focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <label htmlFor="matricula" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Matricula
                </label>
                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(event) => setMatricula(event.target.value)}
                  autoComplete="off"
                  className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-[#1d6f8f] focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950"
                  placeholder="Digite sua matricula"
                />
              </div>

              <div>
                <label htmlFor="senha" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-[#1d6f8f] focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950"
                  placeholder="Digite sua senha"
                />
              </div>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1d6f8f] px-4 text-sm font-semibold text-white transition hover:bg-[#155873] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
              </button>
            </form>

            {isLogin && (
              <button
                type="button"
                onClick={openHorrorApp}
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-950 px-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-black dark:border-slate-700"
              >
                <Power size={16} />
                Open Mortalis
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function HorrorShortFilmExperience({ onExit }) {
  const [stage, setStage] = useState("login");
  const [profileInput, setProfileInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [baseMs, setBaseMs] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [deathTapCount, setDeathTapCount] = useState(0);
  const [settingsValues, setSettingsValues] = useState(() =>
    timePartsToFormValues(splitDeathTime(0))
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousBackground = document.body.style.background;

    document.body.style.overflow = "hidden";
    document.body.style.background = "#000";
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.background = previousBackground;
    };
  }, []);

  useEffect(() => {
    if (stage !== "loading") return;

    const timeoutId = window.setTimeout(() => {
      setStage("intro");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [stage]);

  useEffect(() => {
    if (!selectedProfile) return;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [selectedProfile]);

  useEffect(() => {
    if (deathTapCount === 0) return;

    const timeoutId = window.setTimeout(() => {
      setDeathTapCount(0);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [deathTapCount]);

  const remainingTime = selectedProfile
    ? baseMs - (now - startedAt)
    : 0;
  const timeParts = splitDeathTime(remainingTime);

  function startProfile(profile) {
    const currentTime = Date.now();
    setSelectedProfile(profile);
    setBaseMs(profile.initialMs);
    setStartedAt(currentTime);
    setNow(currentTime);
    setLoginError("");
    setStage("loading");
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    const profile = findHorrorProfile(profileInput);

    if (!profile) {
      setLoginError("Access denied. Profile not found.");
      return;
    }

    startProfile(profile);
  }

  function returnToHiddenEntry() {
    setSelectedProfile(null);
    setBaseMs(0);
    setProfileInput("");
    setLoginError("");
    setStage("login");
    onExit?.();
  }

  function openSecretMenu() {
    setSettingsValues(timePartsToFormValues(timeParts));
    setDeathTapCount(0);
    setStage("settings");
  }

  function handleDeathTimeTap() {
    const nextCount = deathTapCount + 1;

    if (nextCount >= 3) {
      openSecretMenu();
      return;
    }

    setDeathTapCount(nextCount);
  }

  function updateSettingsValue(key, value) {
    const cleanedValue = value.replace(/[^\d]/g, "").slice(0, 4);

    setSettingsValues((currentValues) => ({
      ...currentValues,
      [key]: cleanedValue,
    }));
  }

  function applySecretTime(event) {
    event.preventDefault();

    const nextBaseMs = formValuesToMilliseconds(settingsValues);
    const currentTime = Date.now();

    setBaseMs(nextBaseMs);
    setStartedAt(currentTime);
    setNow(currentTime);
    setStage("result");
  }

  return (
    <main className="min-h-[100dvh] bg-black text-stone-100">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-stretch justify-center">
        <div
          className="relative min-h-[100dvh] w-full overflow-hidden bg-[#030303] sm:border-x sm:border-red-950/70"
          style={{ boxShadow: "0 0 70px rgba(127, 29, 29, 0.38)" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at top, #250808 0%, #050505 44%, #000000 100%)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-red-950/35 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative flex min-h-[100dvh] flex-col px-5 py-6">
            {stage === "login" && (
              <div className="flex flex-1 flex-col justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-900/80 bg-black text-red-200">
                    <Eye size={30} />
                  </div>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.38em] text-red-300/80">
                    Mortalis
                  </p>
                  <h2 className="mt-3 text-4xl font-black uppercase text-stone-100">
                    Enter
                  </h2>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-stone-400">
                    Identity scan required before the estimate can be opened.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="mt-10 space-y-4">
                  <div>
                    <label htmlFor="mortalis-profile" className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">
                      Profile
                    </label>
                    <input
                      id="mortalis-profile"
                      type="text"
                      value={profileInput}
                      onChange={(event) => {
                        setProfileInput(event.target.value);
                        setLoginError("");
                      }}
                      autoComplete="off"
                      autoCapitalize="words"
                      className="mt-2 h-14 w-full rounded-md border border-red-950 bg-black/80 px-4 text-base font-semibold text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-red-700 focus:ring-4 focus:ring-red-950/40"
                      placeholder="Enter profile name"
                    />
                  </div>

                  {loginError && (
                    <p className="rounded-md border border-red-900/80 bg-red-950/35 px-4 py-3 text-sm text-red-100">
                      {loginError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-md border border-red-700 bg-red-900 px-5 text-sm font-black uppercase tracking-[0.28em] text-white transition hover:bg-red-800"
                    style={{ boxShadow: "0 0 34px rgba(185, 28, 28, 0.55)" }}
                  >
                    <LogIn size={18} />
                    Enter
                  </button>
                </form>
              </div>
            )}

            {stage === "loading" && selectedProfile && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div
                  className="relative flex h-32 w-32 items-center justify-center rounded-full border border-red-800/70 bg-black"
                  style={{ boxShadow: "0 0 54px rgba(185, 28, 28, 0.45)" }}
                >
                  <div className="absolute inset-3 animate-spin rounded-full border border-transparent border-t-red-400" />
                  <Skull size={46} className="text-red-100" />
                </div>
                <h2 className="mt-8 text-4xl font-black uppercase tracking-[0.16em] text-stone-100">
                  Mortalis
                </h2>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-300">
                  Access Granted
                </p>
                <p className="mt-8 text-sm leading-6 text-stone-400">
                  Reading pulse. Matching records. Opening final estimate.
                </p>
              </div>
            )}

            {stage === "intro" && selectedProfile && (
              <div className="flex flex-1 flex-col justify-between">
                <div className="pt-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-md border border-red-900 bg-red-950/30 text-red-200">
                    <Hourglass size={28} />
                  </div>
                  <p className="mt-10 text-xs font-semibold uppercase tracking-[0.34em] text-red-300">
                    Life Audit Complete
                  </p>
                  <h2 className="mt-5 text-4xl font-black uppercase leading-tight text-stone-100">
                    Your clock was already running.
                  </h2>
                  <p className="mt-5 text-base leading-7 text-stone-300">
                    The system found a final timestamp linked to this device. Once revealed,
                    the countdown cannot be hidden.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStage("result")}
                  className="mb-4 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-red-100"
                >
                  <Eye size={18} />
                  Reveal Time of Death
                </button>
              </div>
            )}

            {stage === "result" && selectedProfile && (
              <div className="flex flex-1 flex-col">
                <div className="pt-12 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.38em] text-red-300">
                    Final Estimate
                  </p>
                  <h2
                    onClick={handleDeathTimeTap}
                    className="mt-4 select-none text-5xl font-black uppercase leading-none text-stone-100"
                  >
                    Death Time
                  </h2>
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-stone-500">
                    Remaining lifetime
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-3" aria-live="polite">
                  {timeParts.map((part) => (
                    <div
                      key={part.label}
                      className={`rounded-md border px-3 py-4 text-center ${
                        selectedProfile.id === "friend-1"
                          ? "border-red-800 bg-red-950/25"
                          : "border-stone-800 bg-stone-950/80"
                      }`}
                      style={
                        selectedProfile.id === "friend-1"
                          ? { boxShadow: "0 0 28px rgba(185, 28, 28, 0.23)" }
                          : undefined
                      }
                    >
                      <p className="font-mono text-4xl font-black leading-none text-stone-100">
                        {formatClockValue(part.value)}
                      </p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                        {part.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-md border border-red-950/80 bg-black/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300">
                    System Message
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-300">
                    Do not close the application. The countdown will continue.
                  </p>
                </div>
              </div>
            )}

            {stage === "settings" && selectedProfile && (
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={returnToHiddenEntry}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-900/60 bg-black/55 text-red-100 transition hover:bg-red-950/40"
                    aria-label="Return"
                    title="Return"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-300">
                    Override
                  </p>
                </div>

                <form onSubmit={applySecretTime} className="mt-10 flex flex-1 flex-col">
                  <div className="grid grid-cols-2 gap-3">
                    {deathTimeFields.map((field) => (
                      <label
                        key={field.key}
                        className="rounded-md border border-stone-800 bg-black/70 p-3"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                          {field.label}
                        </span>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={settingsValues[field.key]}
                          onChange={(event) => updateSettingsValue(field.key, event.target.value)}
                          className="mt-2 h-12 w-full border-0 bg-transparent p-0 font-mono text-3xl font-black text-stone-100 outline-none"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="mt-auto space-y-3 pb-4 pt-8">
                    <button
                      type="button"
                      onClick={() => setStage("result")}
                      className="flex h-12 w-full items-center justify-center rounded-md border border-stone-800 bg-black text-sm font-bold uppercase tracking-[0.18em] text-stone-300 transition hover:border-red-800 hover:text-red-100"
                    >
                      Return
                    </button>
                    <button
                      type="submit"
                      className="flex h-14 w-full items-center justify-center rounded-md bg-stone-100 px-4 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-red-100"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
