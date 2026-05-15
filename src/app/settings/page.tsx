"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_PUBLIC_URL } from "@/lib/playUrl";
import { zh } from "@/lib/zh";

const STORAGE_TIMER_DEFAULT = "quiz_timer_default";
const ADMIN_KEY_STORAGE = "quiz_admin_key";

export default function SettingsPage() {
  const [publicUrl, setPublicUrl] = useState("");
  const [timerDefault, setTimerDefault] = useState("30");
  const [adminKey, setAdminKey] = useState("");
  const [questionsJson, setQuestionsJson] = useState("");
  const [saved, setSaved] = useState(false);
  const [questionsMsg, setQuestionsMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPublicUrl(localStorage.getItem(STORAGE_PUBLIC_URL) || "");
    setTimerDefault(localStorage.getItem(STORAGE_TIMER_DEFAULT) || "30");
    setAdminKey(localStorage.getItem(ADMIN_KEY_STORAGE) || "");
  }, []);

  const getKey = useCallback(
    () => adminKey.trim() || (typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY_STORAGE)?.trim() ?? "" : ""),
    [adminKey]
  );

  async function handleSaveConnection() {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_PUBLIC_URL, publicUrl.trim());
    localStorage.setItem(STORAGE_TIMER_DEFAULT, timerDefault.trim());
    localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);

    const sec = parseInt(timerDefault.trim(), 10);
    const key = getKey();
    if (!Number.isNaN(sec) && sec >= 5 && sec <= 600) {
      await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify({ action: "set-timer", timerSec: sec }),
      });
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
      setQuestionsMsg(
        typeof data.error === "string" ? data.error : zh.settingsQuestionsInvalid
      );
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
        typeof data.error === "string" ? data.error : zh.settingsQuestionsInvalid;
      const detail = data.code ? ` (${data.code})` : "";
      setQuestionsMsg(base + detail);
      return;
    }
    setQuestionsMsg(zh.settingsQuestionsSaved);
  }

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

          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">{zh.settingsAdminKeyLabel}</span>
            <input
              type="password"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              autoComplete="off"
            />
          </label>

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
