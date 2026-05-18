"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Countdown } from "@/components/Countdown";
import { useAppState } from "@/hooks/useAppState";
import type { PlayerPublic } from "@/lib/game";
import { isAnswerPhase } from "@/lib/gamePhase";
import { useSeatsLayout } from "@/hooks/useSeatsLayout";
import { getSeatFromLayout } from "@/lib/seats";
import { useEliminationSoundOnSelf } from "@/hooks/useEliminationSound";
import { normalizeSeatId } from "@/lib/normalizeSeat";
import { zh } from "@/lib/zh";

const TOKEN_KEY = "quiz_token";
const SEAT_KEY = "quiz_seat";

type Me = {
  seatId: string;
  name: string;
  correctCount: number;
  status: string;
  submittedThisRound: boolean;
};

function quizStarted(game: { currentQ: number; phase: string } | undefined) {
  return !!game && game.currentQ >= 1 && game.phase !== "lobby";
}

export default function ParticipantPage() {
  const { state } = useAppState();
  const { layout: seatsLayout } = useSeatsLayout();
  const [token, setToken] = useState<string | null>(null);
  const [seatIdInput, setSeatIdInput] = useState("");
  const [name, setName] = useState("");
  const [seatId, setSeatId] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "err">("ok");
  const [submitting, setSubmitting] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  useEffect(() => {
    setSelectedChoice(null);
  }, [state?.game.currentQ]);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const s = localStorage.getItem(SEAT_KEY);
    setToken(t);
    setSeatId(s);
    if (s) setSeatIdInput(s);
    if (!t) return;
    fetch("/api/me?token=" + encodeURIComponent(t))
      .then((r) => r.json())
      .then((data) => {
        if (data.seatId) {
          setMe(data);
          setSeatId(data.seatId);
          setSeatIdInput(data.seatId);
          localStorage.setItem(SEAT_KEY, data.seatId);
        }
      })
      .catch(() => {});
  }, [state?.players.length, state?.game.currentQ, state?.game.phase]);

  const playerFromState = state?.players.find((p) => p.seatId === seatId);
  const player: PlayerPublic | null =
    playerFromState ??
    (me
      ? {
          seatId: me.seatId,
          name: me.name,
          employeeId: null,
          correctCount: me.correctCount,
          status: me.status,
          submittedThisRound: me.submittedThisRound,
        }
      : null);

  const game = state?.game;
  const question = state?.question;
  const phase = game?.phase;
  const started = quizStarted(game);
  const canAnswer =
    !!token &&
    started &&
    isAnswerPhase(phase) &&
    player?.status === "live" &&
    !player?.submittedThisRound;

  useEliminationSoundOnSelf(player);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const sid = normalizeSeatId(seatIdInput);
    if (!name.trim()) {
      setError(zh.apiNeedNameSeat);
      return;
    }
    if (!sid) {
      setError(zh.errSeatRequired);
      return;
    }
    if (!seatsLayout || !getSeatFromLayout(seatsLayout, sid)) {
      setError(zh.errInvalidSeatClient);
      return;
    }
    setLoginLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatId: sid, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? zh.errLoginFail);
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SEAT_KEY, data.seatId);
      setToken(data.token);
      setSeatId(data.seatId);
      setSeatIdInput(data.seatId);
      const meRes = await fetch(
        "/api/me?token=" + encodeURIComponent(data.token)
      );
      if (meRes.ok) {
        const m = await meRes.json();
        if (m.seatId) setMe(m);
      }
    } finally {
      setLoginLoading(false);
    }
  }

  const allowReregister = state?.game.debugReregister === true;

  async function handleLogout() {
    if (!allowReregister) return;
    if (token) {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch {
        /* 仍清除本机登录态 */
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SEAT_KEY);
    setToken(null);
    setSeatId(null);
    setMe(null);
    setMessage("");
    setMessageTone("ok");
    setError("");
  }

  async function submitAnswer() {
    if (!token) return;
    if (!selectedChoice) {
      setMessageTone("err");
      setMessage(zh.playPickOptionFirst);
      return;
    }
    const choice = selectedChoice;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, choice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageTone("err");
        setMessage(data.error ?? zh.errSubmitFail);
        return;
      }
      setSelectedChoice(null);
      if (data.eliminated) {
        setMessageTone("err");
        setMessage(zh.msgWrongOut(data.correctCount));
      } else {
        setMessageTone("ok");
        setMessage(zh.msgRight(data.correctCount));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto min-h-dvh max-w-md px-4 py-8 pb-10">
        <h1 className="text-xl font-bold sm:text-2xl">{zh.playRegisterTitle}</h1>
        <form
          onSubmit={handleLogin}
          className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
        >
          <p className="text-sm text-slate-400">{zh.participantFormHint}</p>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">{zh.labelName}</span>
            <input
              className="min-h-12 rounded-lg border border-slate-700 bg-slate-950 px-4 text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">{zh.labelSeatNumber}</span>
            <input
              className="min-h-12 rounded-lg border border-slate-700 bg-slate-950 px-4 text-base font-mono"
              value={seatIdInput}
              onChange={(e) => setSeatIdInput(e.target.value)}
              placeholder={zh.placeholderSeatExample}
              inputMode="text"
              autoCapitalize="none"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loginLoading}
            className="min-h-12 rounded-lg bg-emerald-600 text-base font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {loginLoading ? zh.btnSubmitting : zh.btnEnterQuiz}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6 pb-28 sm:pb-32">
      <h1 className="text-xl font-bold sm:text-2xl">{zh.playTitle}</h1>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-400">
            {zh.playSeat} {player?.seatId} {zh.playDot} {player?.name}
            {player?.status === "out" && (
              <span className="ml-2 text-red-400">{zh.playEliminated}</span>
            )}
            {player?.status === "live" && (
              <span className="ml-2 text-emerald-400">
                {zh.playCorrectCount} {player?.correctCount}{" "}
                {zh.playQuestionsUnit}
              </span>
            )}
          </p>
          {allowReregister && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-sm text-amber-400 underline"
            >
              {zh.btnLeaveRebind}
            </button>
          )}
        </div>

        {!started && (
          <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-slate-300">
            {zh.playWaitHost}
          </p>
        )}

        {started && (
          <>
            <p className="text-xs leading-relaxed text-slate-500">
              {zh.playRulesHint}
            </p>

            {!!game?.countdownEnd && (
              <div className="flex justify-center">
                <Countdown endsAt={game.countdownEnd} />
              </div>
            )}

            <p className="text-sm text-amber-400/90">
              {zh.playPhase}
              {zh.playDash}
              {phase ?? zh.playDash} {zh.playDot} {zh.playQuestionNum}{" "}
              {game?.currentQ ?? 0} {zh.playQuestionSuffix}
            </p>

            {player?.status === "out" && (
              <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm">
                {zh.playEliminatedBox}{" "}
                <strong>{player.correctCount}</strong> {zh.playQuestionsUnit}
              </div>
            )}

            {phase === "countdown" && (
              <p className="text-slate-400">{zh.playWaitOpen}</p>
            )}

            {question && player?.status === "live" && (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="mb-4 text-base font-medium">{question.stem}</p>
                {phase === "closed" && (
                  <p className="mb-3 text-sm text-amber-400/90">
                    {zh.playCountdownEnded}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(question.options).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={!canAnswer || submitting}
                      onClick={() =>
                        setSelectedChoice((prev) =>
                          prev === key ? null : key
                        )
                      }
                      className={`min-h-14 rounded-lg border px-4 py-3 text-left text-base disabled:opacity-40 ${
                        selectedChoice === key
                          ? "border-emerald-400 bg-emerald-950/50 ring-2 ring-emerald-500"
                          : "border-slate-600 hover:border-emerald-500"
                      }`}
                    >
                      <span className="font-bold">{key}.</span> {label}
                    </button>
                  ))}
                </div>
                {isAnswerPhase(phase) && (
                  <>
                    {!player.submittedThisRound ? (
                      <button
                        type="button"
                        disabled={!selectedChoice || submitting}
                        onClick={() => void submitAnswer()}
                        className="mt-4 w-full min-h-14 shrink-0 rounded-lg bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
                      >
                        {submitting ? zh.btnSubmitting : zh.playBtnSubmit}
                      </button>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">
                        {zh.playSubmittedWait}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {message && (
          <p
            className={
              messageTone === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"
            }
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
