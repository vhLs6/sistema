"use client";

import { useEffect, useState } from "react";
import { LogIn, Moon, Sun, UserPlus } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState("login");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_420px]">
          <div className="flex min-h-80 flex-col justify-between bg-[#17324d] p-8 text-white md:p-10">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-cyan-200">
                Sistema básico
              </p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight md:text-5xl">
                Login real com cadastro salvo no SQLite
              </h1>
            </div>
            <p className="mt-10 max-w-sm text-sm leading-6 text-slate-200">
              Crie um usuário, volte para entrar e acesse a área interna.
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
                  ? "Use o nome, a matricula e a senha que você cadastrou."
                  : "Informe um nome de usuário, matricula e senha para salvar no banco."}
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
          </div>
        </div>
      </section>
    </main>
  );
}
