"use client";

import { useState } from "react";
import { zh } from "@/lib/zh";

const ADMIN_KEY_STORAGE = "quiz_admin_key";

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
  return res.json();
}

type Props = {
  /** rail：右侧栏纵向全宽按钮 */
  layout?: "horizontal" | "rail";
};

export function HostControls({ layout = "horizontal" }: Props) {
  const [msg, setMsg] = useState("");
  const rail = layout === "rail";

  function getKey() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ADMIN_KEY_STORAGE) || "";
  }

  async function run(action: string, extra?: { timerSec?: number }) {
    const data = await admin(getKey(), action, extra);
    setMsg(typeof data.error === "string" ? data.error : zh.hostDone(action));
  }

  const btn = rail
    ? "w-full justify-center rounded-md px-3 py-2 text-sm"
    : "rounded-md px-3 py-1.5 text-sm";

  return (
    <div
      className={
        rail
          ? "flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3"
          : "flex flex-wrap items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2"
      }
    >
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
          if (window.confirm(zh.hostConfirmReset)) run("reset-players");
        }}
        className={`${btn} bg-red-900 hover:bg-red-800`}
      >
        {zh.hostReset}
      </button>
      {msg && (
        <span
          className={rail ? "text-center text-xs text-slate-500" : "w-full text-xs text-slate-500 sm:w-auto sm:pl-2"}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
