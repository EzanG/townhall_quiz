"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAdminKey } from "@/lib/admin-client";
import { zh } from "@/lib/zh";

type AdminAuthStatus = { strict: boolean; keyConfigured: boolean };

async function admin(
  key: string,
  action: string,
  extra?: { timerSec?: number }
) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": key,
    },
    body: JSON.stringify({ action, ...extra }),
  });
  return { status: res.status, data: await res.json() };
}

type Props = {
  /** rail：右侧栏纵向全宽按钮 */
  layout?: "horizontal" | "rail";
};

export function HostControls({ layout = "horizontal" }: Props) {
  const [msg, setMsg] = useState("");
  const [msgIsError, setMsgIsError] = useState(false);
  const [auth, setAuth] = useState<AdminAuthStatus | null>(null);
  const rail = layout === "rail";

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((data: AdminAuthStatus) => setAuth(data))
      .catch(() => setAuth(null));
  }, []);

  const needsKey =
    auth?.strict === true && auth.keyConfigured && !getStoredAdminKey();

  async function run(
    action: string,
    extra?: { timerSec?: number },
    successMsg?: string
  ) {
    const key = getStoredAdminKey();
    if (auth?.strict && auth.keyConfigured && !key) {
      setMsgIsError(true);
      setMsg(zh.hostAdminKeyMissing);
      return;
    }

    const { status, data } = await admin(key, action, extra);
    if (status === 403 || data.error === zh.apiForbidden) {
      setMsgIsError(true);
      setMsg(zh.hostAdminKeyForbidden);
      return;
    }
    setMsgIsError(typeof data.error === "string");
    setMsg(
      typeof data.error === "string"
        ? data.error
        : (successMsg ?? zh.hostDone(action))
    );
  }

  const btn = rail
    ? "w-full justify-center rounded-md px-3 py-2 text-sm"
    : "rounded-md px-3 py-1.5 text-sm";

  const msgClass = msgIsError ? "text-amber-400" : "text-slate-500";

  return (
    <div
      className={
        rail
          ? "flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3"
          : "flex flex-wrap items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2"
      }
    >
      {needsKey && (
        <p className={`text-xs text-amber-400 ${rail ? "text-center" : "w-full"}`}>
          {zh.hostAdminKeyMissing}{" "}
          <Link href="/settings" className="underline hover:text-amber-300">
            {zh.settingsTitle}
          </Link>
        </p>
      )}
      <button
        type="button"
        onClick={() => run("lobby")}
        className={`${btn} bg-slate-700 hover:bg-slate-600`}
      >
        {zh.hostLobby}
      </button>
      <button
        type="button"
        onClick={() => run("open")}
        className={`${btn} bg-emerald-600 hover:bg-emerald-500`}
      >
        {zh.hostOpen}
      </button>
      <button
        type="button"
        onClick={() => run("next-question")}
        className={`${btn} bg-indigo-600 hover:bg-indigo-500`}
      >
        {zh.hostNext}
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm(zh.hostConfirmResetQuestions)) {
            run("reset-questions", undefined, zh.hostResetQuestionsDone);
          }
        }}
        className={`${btn} bg-amber-800 hover:bg-amber-700`}
      >
        {zh.hostResetQuestions}
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm(zh.hostConfirmReset)) run("reset-players");
        }}
        className={`${btn} bg-red-900 hover:bg-red-800`}
      >
        {zh.hostReset}
      </button>
      {msg && (
        <span
          className={
            rail
              ? `text-center text-xs ${msgClass}`
              : `w-full text-xs sm:w-auto sm:pl-2 ${msgClass}`
          }
        >
          {msg}
          {msgIsError && (
            <>
              {" "}
              <Link href="/settings" className="underline hover:text-amber-300">
                {zh.settingsTitle}
              </Link>
            </>
          )}
        </span>
      )}
    </div>
  );
}
