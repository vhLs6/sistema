"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LockKeyhole,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

const minPlayers = 2;
const maxPlayers = 12;
const secretLevels = ["Light", "Medium", "Final"];

const challengeLadder = [
  {
    level: "Light",
    reward: 2,
    text: "Tell the group one harmless secret about yourself.",
  },
  {
    level: "Light",
    reward: 3,
    text: "Do a dramatic movie trailer voice for 20 seconds.",
  },
  {
    level: "Medium",
    reward: 5,
    text: "Let the group choose one sentence for you to say with full confidence.",
  },
  {
    level: "Medium",
    reward: 7,
    text: "Give a serious award speech for a random object nearby.",
  },
  {
    level: "Medium",
    reward: 10,
    text: "Let the group pick a nickname you must answer to until your next turn.",
  },
  {
    level: "Final",
    reward: 15,
    text: "Let the group vote on a bold but safe challenge for you.",
  },
  {
    level: "Final",
    reward: 20,
    text: "Perform a one-minute talent show with no preparation.",
  },
  {
    level: "Final",
    reward: 25,
    text: "Let the group create the final challenge, then do it with no extra negotiation.",
  },
];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function clampPlayerCount(value) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return minPlayers;
  return Math.min(maxPlayers, Math.max(minPlayers, parsedValue));
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0);
}

function buildStandardChallenge(roundIndex, players) {
  const ladderIndex = Math.min(roundIndex, challengeLadder.length - 1);
  const challenge = challengeLadder[ladderIndex];
  const player = players[roundIndex % players.length];

  return {
    id: `round-${roundIndex}`,
    source: "standard",
    playerId: player?.id || "",
    round: roundIndex + 1,
    name: player?.name || "Player",
    text: challenge.text,
    reward: challenge.reward,
    level: challenge.level,
  };
}

function normalizeMoney(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function halveMoney(value) {
  return Math.round((Number(value) || 0) * 50) / 100;
}

function enterFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;

  document.documentElement.requestFullscreen().catch(() => {});
}

export default function Home() {
  const [stage, setStage] = useState("setup");
  const [playerCount, setPlayerCount] = useState(4);
  const [nameInputs, setNameInputs] = useState(["", "", "", ""]);
  const [players, setPlayers] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [manualChallenge, setManualChallenge] = useState(null);
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [secretOpen, setSecretOpen] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [lastEvent, setLastEvent] = useState("");
  const [secretForm, setSecretForm] = useState({
    name: "",
    challenge: "",
    reward: "",
    level: "Light",
  });

  useEffect(() => {
    const savedGame = window.localStorage.getItem("challenge-rounds-game");
    if (!savedGame) return;

    try {
      const parsedGame = JSON.parse(savedGame);
      if (!Array.isArray(parsedGame.players) || parsedGame.players.length < minPlayers) return;

      setPlayers(parsedGame.players);
      setPlayerCount(parsedGame.players.length);
      setNameInputs(parsedGame.players.map((player) => player.name));
      setRoundIndex(Number(parsedGame.roundIndex) || 0);
      setLastEvent(parsedGame.lastEvent || "");
      setStage("game");
    } catch {
      window.localStorage.removeItem("challenge-rounds-game");
    }
  }, []);

  useEffect(() => {
    if (stage !== "game") return;

    window.localStorage.setItem(
      "challenge-rounds-game",
      JSON.stringify({
        players,
        roundIndex,
        lastEvent,
      })
    );
  }, [players, roundIndex, lastEvent, stage]);

  useEffect(() => {
    if (secretTapCount === 0) return;

    const timeoutId = window.setTimeout(() => {
      setSecretTapCount(0);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [secretTapCount]);

  const activeChallenge = useMemo(() => {
    if (manualChallenge) return manualChallenge;
    if (!players.length) return null;
    return buildStandardChallenge(roundIndex, players);
  }, [manualChallenge, players, roundIndex]);

  const totalPaid = useMemo(
    () => players.reduce((total, player) => total + player.balance, 0),
    [players]
  );

  function updatePlayerCount(nextCount) {
    const count = clampPlayerCount(nextCount);
    setPlayerCount(count);
    setSetupError("");
    setNameInputs((currentNames) =>
      Array.from({ length: count }, (_, index) => currentNames[index] || "")
    );
  }

  function updateName(index, value) {
    setSetupError("");
    setNameInputs((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? value : currentName
      )
    );
  }

  function startGame(event) {
    event.preventDefault();
    enterFullscreen();

    const cleanNames = nameInputs.map((name) => name.trim()).filter(Boolean);
    if (cleanNames.length !== playerCount) {
      setSetupError("Fill in every player name before starting.");
      return;
    }

    const uniqueNames = new Set(cleanNames.map((name) => name.toLowerCase()));
    if (uniqueNames.size !== cleanNames.length) {
      setSetupError("Use different names so the scoreboard stays clear.");
      return;
    }

    setPlayers(
      cleanNames.map((name, index) => ({
        id: `${Date.now()}-${index}`,
        name,
        balance: 0,
        completed: 0,
      }))
    );
    setRoundIndex(0);
    setManualChallenge(null);
    setLastEvent("");
    setStage("game");
  }

  function handleSecretTap() {
    const nextCount = secretTapCount + 1;

    if (nextCount >= 3) {
      setSecretTapCount(0);
      setSecretForm({
        name: players[roundIndex % players.length]?.name || "",
        challenge: "",
        reward: "",
        level: activeChallenge?.level || "Light",
      });
      setSecretOpen(true);
      return;
    }

    setSecretTapCount(nextCount);
  }

  function completeChallenge() {
    if (!activeChallenge) return;

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === activeChallenge.playerId
          ? {
              ...player,
              balance: player.balance + activeChallenge.reward,
              completed: player.completed + 1,
            }
          : player
      )
    );
    setLastEvent(`${activeChallenge.name} earned ${formatMoney(activeChallenge.reward)}.`);
    setManualChallenge(null);
    setRoundIndex((currentRound) => currentRound + 1);
  }

  function skipChallenge() {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => ({
        ...player,
        balance: halveMoney(player.balance),
      }))
    );
    setLastEvent("Challenge skipped. Everyone lost 50% of their cash.");
    setManualChallenge(null);
    setRoundIndex((currentRound) => currentRound + 1);
  }

  function resetGame() {
    window.localStorage.removeItem("challenge-rounds-game");
    window.localStorage.removeItem("rodadas-game");
    setStage("setup");
    setPlayers([]);
    setRoundIndex(0);
    setManualChallenge(null);
    setSecretOpen(false);
    setLastEvent("");
  }

  function submitSecretChallenge(event) {
    event.preventDefault();

    const reward = normalizeMoney(secretForm.reward);
    const selectedLevel = secretLevels.includes(secretForm.level) ? secretForm.level : "Light";
    if (!secretForm.name.trim() || !secretForm.challenge.trim() || reward <= 0) return;

    const playerName = secretForm.name.trim();
    const existingPlayer = players.find(
      (player) => player.name.toLowerCase() === playerName.toLowerCase()
    );
    const playerId = existingPlayer?.id || `${Date.now()}-secret`;

    if (!existingPlayer) {
      setPlayers((currentPlayers) => [
        ...currentPlayers,
        {
          id: playerId,
          name: playerName,
          balance: 0,
          completed: 0,
        },
      ]);
    }

    setManualChallenge({
      id: `secret-${Date.now()}`,
      source: "secret",
      playerId,
      round: roundIndex + 1,
      name: existingPlayer?.name || playerName,
      text: secretForm.challenge.trim(),
      reward,
      level: selectedLevel,
    });
    setLastEvent("Secret challenge loaded.");
    setSecretOpen(false);
  }

  if (stage === "setup") {
    return (
      <main className="h-screen overflow-hidden bg-[#f5f1e8] text-zinc-950">
        <section
          className="flex h-full w-full flex-col overflow-y-auto px-4 pb-5 pt-4 sm:px-6 lg:justify-center lg:overflow-hidden lg:p-6"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="grid min-h-full gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-56 flex-col justify-between rounded-lg bg-zinc-950 p-5 text-white shadow-sm sm:min-h-72 sm:p-8 lg:min-h-full">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-400 text-zinc-950">
                  <Users size={25} />
                </div>
                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                  Challenge Rounds
                </p>
                <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                  Build the group
                </h1>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white/10 px-2 py-3 sm:px-3 sm:py-4">
                  <p className="text-2xl font-black">{playerCount}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Players
                  </p>
                </div>
                <div className="rounded-md bg-white/10 px-2 py-3 sm:px-3 sm:py-4">
                  <p className="text-2xl font-black">3</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Levels
                  </p>
                </div>
                <div className="rounded-md bg-white/10 px-2 py-3 sm:px-3 sm:py-4">
                  <p className="text-2xl font-black">3</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Taps
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={startGame} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:flex lg:min-h-full lg:flex-col lg:justify-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-600">
                    Setup
                  </p>
                  <h2 className="mt-2 text-2xl font-black">How many friends?</h2>
                </div>

                <div className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 p-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => updatePlayerCount(playerCount - 1)}
                    className="flex h-11 w-11 items-center justify-center rounded text-zinc-700 transition hover:bg-white"
                    aria-label="Decrease player count"
                    title="Decrease"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <input
                    type="number"
                    min={minPlayers}
                    max={maxPlayers}
                    value={playerCount}
                    onChange={(event) => updatePlayerCount(event.target.value)}
                    className="h-11 w-16 border-0 bg-transparent text-center text-xl font-black outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updatePlayerCount(playerCount + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded text-zinc-700 transition hover:bg-white"
                    aria-label="Increase player count"
                    title="Increase"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {nameInputs.map((name, index) => (
                  <label key={index} className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                      Player {index + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => updateName(index, event.target.value)}
                      className="mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-4 font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Name"
                    />
                  </label>
                ))}
              </div>

              {setupError && (
                <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {setupError}
                </p>
              )}

              <button
                type="submit"
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:bg-emerald-400"
              >
                <Sparkles size={18} />
                Start rounds
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#101113] text-white">
      <section
        className="grid h-full w-full gap-0 overflow-y-auto lg:grid-cols-[1fr_360px] lg:overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex min-h-screen flex-col bg-[#191b1f] p-4 shadow-sm sm:p-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:border-r lg:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetGame}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
              aria-label="Reset game"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={handleSecretTap}
              className="min-w-24 rounded-md px-3 py-2 text-center transition hover:bg-white/5"
              aria-label="Round"
              title="Triple tap for secret access"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                Round
              </p>
              <p className="mt-1 text-2xl font-black">{roundIndex + 1}</p>
            </button>

            <div className="flex h-11 min-w-20 shrink-0 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 text-sm font-black text-emerald-200">
              {formatMoney(totalPaid)}
            </div>
          </div>

          {lastEvent && (
            <p className="mt-4 rounded-md border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
              {lastEvent}
            </p>
          )}

          {activeChallenge && (
            <div className="flex flex-1 flex-col justify-center py-5 sm:py-8 lg:min-h-0">
              <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-950">
                    {activeChallenge.level}
                  </span>
                  {activeChallenge.source === "secret" && (
                    <span className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-rose-200">
                      Secret
                    </span>
                  )}
                </div>

                <h1 className="mt-5 break-words text-[clamp(2.75rem,14vw,4.5rem)] font-black leading-none sm:mt-6 sm:text-7xl">
                  {activeChallenge.name}
                </h1>

                <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:mt-7 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                    Challenge
                  </p>
                  <p className="mt-4 text-[clamp(1.35rem,6vw,2rem)] font-bold leading-snug sm:text-3xl">
                    {activeChallenge.text}
                  </p>
                </div>

                <p className="mt-4 rounded-md border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                  Skip penalty: everyone loses half of their current cash.
                </p>

                <div className="mt-4 grid gap-3 sm:mt-5 xl:grid-cols-[1fr_auto]">
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-100">
                    <CircleDollarSign size={28} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                        Reward
                      </p>
                      <p className="text-3xl font-black">{formatMoney(activeChallenge.reward)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg xl:w-80">
                    <button
                      type="button"
                      onClick={skipChallenge}
                      className="flex h-16 items-center justify-center rounded-md border border-rose-400/40 bg-rose-500/10 px-4 text-sm font-black uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-500/20"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={completeChallenge}
                      className="flex h-16 items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-black uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-emerald-300"
                    >
                      <CheckCircle2 size={18} />
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-[#f7f3e9] p-4 text-zinc-950 sm:p-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-600">
                Scoreboard
              </p>
              <h2 className="mt-1 text-2xl font-black">Cash</h2>
            </div>
            <Trophy size={28} className="text-amber-500" />
          </div>

          <div className="mt-5 grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-1 lg:pr-0">
            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-black">{player.name}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                      {player.completed} done
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-black text-emerald-700">
                    {formatMoney(player.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {secretOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <form
            onSubmit={submitSecretChallenge}
            className="max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-lg border border-rose-500/30 bg-zinc-950 p-5 text-white shadow-2xl sm:max-w-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-rose-500 text-white">
                  <LockKeyhole size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">
                    Secret access
                  </p>
                  <h2 className="text-xl font-black">New challenge</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSecretOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
                aria-label="Close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Player
                </span>
                <input
                  list="players-list"
                  type="text"
                  value={secretForm.name}
                  onChange={(event) =>
                    setSecretForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black px-4 font-semibold text-white outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-950"
                  placeholder="Name"
                />
                <datalist id="players-list">
                  {players.map((player) => (
                    <option key={player.id} value={player.name} />
                  ))}
                </datalist>
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Level
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {secretLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setSecretForm((currentForm) => ({
                          ...currentForm,
                          level,
                        }))
                      }
                      className={`h-11 rounded-md border text-xs font-black uppercase tracking-[0.12em] transition ${
                        secretForm.level === level
                          ? "border-amber-300 bg-amber-300 text-zinc-950"
                          : "border-white/10 bg-black text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Challenge
                </span>
                <textarea
                  value={secretForm.challenge}
                  onChange={(event) =>
                    setSecretForm((currentForm) => ({
                      ...currentForm,
                      challenge: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-28 w-full resize-none rounded-md border border-white/10 bg-black px-4 py-3 font-semibold text-white outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-950"
                  placeholder="Write the challenge"
                />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Money
                </span>
                <div className="mt-2 flex h-12 items-center rounded-md border border-white/10 bg-black px-4 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-950">
                  <Banknote size={18} className="mr-3 text-emerald-300" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={secretForm.reward}
                    onChange={(event) =>
                      setSecretForm((currentForm) => ({
                        ...currentForm,
                        reward: event.target.value,
                      }))
                    }
                    className="h-full w-full border-0 bg-transparent font-semibold text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-rose-500 px-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-rose-400"
            >
              <Plus size={18} />
              Launch challenge
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
