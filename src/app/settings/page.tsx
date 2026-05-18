"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_KEY_STORAGE,
  getStoredAdminKey,
  setStoredAdminKey,
} from "@/lib/admin-client";
import { SeatMap } from "@/components/SeatMap";
import { useSeatsLayout } from "@/hooks/useSeatsLayout";
import {
  isEliminationSoundEnabled,
  setEliminationSoundEnabled,
} from "@/lib/elimination-sound";
import { STORAGE_PUBLIC_URL } from "@/lib/playUrl";
import { zh } from "@/lib/zh";

const STORAGE_TIMER_DEFAULT = "quiz_timer_default";

export default function SettingsPage() {
  const [publicUrl, setPublicUrl] = useState("");
  const [timerDefault, setTimerDefault] = useState("30");
  const [adminKey, setAdminKey] = useState("");
  const [eliminationSound, setEliminationSound] = useState(true);
  const [debugReregister, setDebugReregister] = useState(false);
  const [questionsJson, setQuestionsJson] = useState("");
  const [saved, setSaved] = useState(false);
  const [adminKeyError, setAdminKeyError] = useState("");
  const [questionsMsg, setQuestionsMsg] = useState("");
  const [seatRows, setSeatRows] = useState("14");
  const [seatCols, setSeatCols] = useState("20");
  const [seatsMsg, setSeatsMsg] = useState("");
  const { layout: seatsPreview, reload: reloadSeats } = useSeatsLayout();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPublicUrl(localStorage.getItem(STORAGE_PUBLIC_URL) || "");
    setTimerDefault(localStorage.getItem(STORAGE_TIMER_DEFAULT) || "30");
    setAdminKey(localStorage.getItem(ADMIN_KEY_STORAGE) || "");
    setEliminationSound(isEliminationSoundEnabled());
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { debugReregister?: boolean } | null) => {
        if (data && typeof data.debugReregister === "boolean") {
          setDebugReregister(data.debugReregister);
        }
      })
      .catch(() => {});
  }, []);

  const getKey = useCallback(
    () => adminKey.trim() || getStoredAdminKey(),
    [adminKey]
  );

  async function handleSaveConnection() {
    if (typeof window === "undefined") return;
    setAdminKeyError("");
    localStorage.setItem(STORAGE_PUBLIC_URL, publicUrl.trim());
    localStorage.setItem(STORAGE_TIMER_DEFAULT, timerDefault.trim());
    setStoredAdminKey(adminKey);
    setEliminationSoundEnabled(eliminationSound);

    const sec = parseInt(timerDefault.trim(), 10);
    const key = getKey();
    if (key) {
      const debugRes = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify({
          action: "set-debug-reregister",
          enabled: debugReregister,
        }),
      });
      if (debugRes.status === 403) {
        setAdminKeyError(zh.settingsAdminKeyForbidden);
        return;
      }
    }

    if (!Number.isNaN(sec) && sec >= 5 && sec <= 600) {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify({ action: "set-timer", timerSec: sec }),
      });
      if (res.status === 403) {
        setAdminKeyError(zh.settingsAdminKeyForbidden);
        return;
      }
    } else if (key) {
      const probe = await fetch("/api/admin", {
        method: "HEAD",
        headers: { "x-admin-key": key },
      });
      if (probe.status === 403) {
        setAdminKeyError(zh.settingsAdminKeyForbidden);
        return;
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function loadQuestions() {
    setQuestionsMsg("");
    const key = getKey();
    const res = await fetch("/api/questions", {
      headers: { "x-admin-key": key },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err =
        res.status === 403
          ? zh.settingsAdminKeyForbidden
          : typeof data.error === "string"
            ? data.error
            : zh.settingsQuestionsInvalid;
      setQuestionsMsg(err);
      return;
    }
    setQuestionsJson(JSON.stringify(data, null, 2));
  }

  async function saveQuestions() {
    setQuestionsMsg("");
    const key = getKey();
    const res = await fetch("/api/questions", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key,
      },
      body: JSON.stringify({ raw: questionsJson }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const base =
        res.status === 403
          ? zh.settingsAdminKeyForbidden
          : typeof data.error === "string"
            ? data.error
            : zh.settingsQuestionsInvalid;
      const detail = data.code ? ` (${data.code})` : "";
      setQuestionsMsg(base + detail);
      return;
    }
    setQuestionsMsg(zh.settingsQuestionsSaved);
  }

  async function loadSeats() {
    setSeatsMsg("");
    const res = await fetch("/api/seats");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSeatsMsg(zh.seatMapLoadFail);
      return;
    }
    if (typeof data.rows === "number") setSeatRows(String(data.rows));
    if (typeof data.cols === "number") setSeatCols(String(data.cols));
    await reloadSeats();
  }

  async function saveSeats() {
    setSeatsMsg("");
    const key = getKey();
    const rows = parseInt(seatRows.trim(), 10);
    const cols = parseInt(seatCols.trim(), 10);
    const res = await fetch("/api/seats", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key,
      },
      body: JSON.stringify({ rows, cols }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const base =
        res.status === 403
          ? zh.settingsAdminKeyForbidden
          : typeof data.error === "string"
            ? data.error
            : zh.settingsSeatsInvalid;
      const detail = data.code ? ` (${data.code})` : "";
      setSeatsMsg(base + detail);
      return;
    }
    setSeatsMsg(zh.settingsSeatsSaved);
    await reloadSeats();
  }

  useEffect(() => {
    loadSeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.settingsTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          {zh.settingsIntro}
        </p>
      </div>

      <p className="mb-6 text-sm text-slate-400">{zh.settingsPublicUrlHint}</p>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {zh.settingsSectionConn}
          </h2>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">{zh.settingsPublicUrlLabel}</span>
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="http://192.168.1.10:3000/play"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">{zh.settingsTimerDefault}</span>
            <input
              type="number"
              min={5}
              max={600}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
              value={timerDefault}
              onChange={(e) => setTimerDefault(e.target.value)}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-600"
              checked={eliminationSound}
              onChange={(e) => setEliminationSound(e.target.checked)}
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-slate-300">
                {zh.settingsEliminationSound}
              </span>
              <span className="text-xs text-slate-500">
                {zh.settingsEliminationSoundHint}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-600"
              checked={debugReregister}
              onChange={(e) => setDebugReregister(e.target.checked)}
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-amber-200/90">
                {zh.settingsDebugReregister}
              </span>
              <span className="text-xs text-slate-500">
                {zh.settingsDebugReregisterHint}
              </span>
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">{zh.settingsAdminKeyLabel}</span>
            <p className="text-xs text-slate-500">{zh.settingsAdminKeyHint}</p>
            <input
              type="password"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              autoComplete="off"
            />
          </label>
          {adminKeyError && (
            <p className="text-sm text-amber-400">{adminKeyError}</p>
          )}

          <button
            type="button"
            onClick={handleSaveConnection}
            className="rounded-lg bg-emerald-600 py-3 font-medium hover:bg-emerald-500"
          >
            {zh.settingsSave}
          </button>
          {saved && (
            <p className="text-center text-sm text-emerald-400">{zh.settingsSaved}</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {zh.settingsSectionSeats}
          </h2>
          <p className="text-sm text-slate-400">{zh.settingsSeatsHint}</p>
          <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">{zh.settingsSeatsRows}</span>
              <input
                type="number"
                min={1}
                max={40}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                value={seatRows}
                onChange={(e) => setSeatRows(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">{zh.settingsSeatsCols}</span>
              <input
                type="number"
                min={1}
                max={40}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                value={seatCols}
                onChange={(e) => setSeatCols(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadSeats}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
            >
              {zh.settingsSeatsLoad}
            </button>
            <button
              type="button"
              onClick={saveSeats}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
            >
              {zh.settingsSeatsSave}
            </button>
          </div>
          {seatsMsg && <p className="text-sm text-slate-400">{seatsMsg}</p>}
          {seatsPreview && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
              <SeatMap
                players={[]}
                layoutOverride={seatsPreview}
                compact
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {zh.settingsSectionQuestions}
          </h2>
          <p className="text-sm text-slate-400">{zh.settingsQuestionsHint}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadQuestions}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
            >
              {zh.settingsQuestionsLoad}
            </button>
            <button
              type="button"
              onClick={saveQuestions}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
            >
              {zh.settingsQuestionsSave}
            </button>
          </div>
          <textarea
            className="min-h-[280px] w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-200"
            spellCheck={false}
            value={questionsJson}
            onChange={(e) => setQuestionsJson(e.target.value)}
            placeholder="[]"
          />
          {questionsMsg && (
            <p className="text-sm text-slate-400">{questionsMsg}</p>
          )}
        </section>
      </div>
    </main>
  );
}
