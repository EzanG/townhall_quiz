"use client";
/* eslint-disable @next/next/no-img-element -- 二维码为运行时 data URL，不适用 next/image */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getPlayPageUrl, STORAGE_PUBLIC_URL } from "@/lib/playUrl";
import { zh } from "@/lib/zh";

type Props = {
  /** floating: 旧版固定角标；rail：右侧栏内嵌 */
  variant?: "floating" | "rail";
};

export function JoinQrCorner({ variant = "floating" }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const paint = () => {
      const u = getPlayPageUrl();
      setUrl(u);
      if (!u) {
        setQrDataUrl("");
        return;
      }
      QRCode.toDataURL(u, {
        width: 160,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    };

    paint();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_PUBLIC_URL || e.key === null) paint();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const rail =
    variant === "rail"
      ? "relative z-auto w-full max-w-none flex-col rounded-xl border border-slate-700/90 bg-slate-900/50 p-3 shadow-none backdrop-blur-none"
      : "pointer-events-none fixed top-4 right-4 z-30 max-w-[min(92vw,200px)] rounded-xl border border-slate-700/90 bg-slate-950/95 p-2.5 shadow-xl backdrop-blur-sm";

  return (
    <div className={`flex flex-col items-center ${rail}`}>
      <p className="mb-1.5 text-center text-[11px] font-medium text-slate-300">
        {zh.mainScreenJoinQr}
      </p>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt=""
          className={`rounded-lg bg-white p-1 ${variant === "rail" ? "h-32 w-32 max-w-full" : "pointer-events-auto h-28 w-28"}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-lg border border-dashed border-slate-600 text-center text-xs text-slate-500 ${variant === "rail" ? "h-32 w-32" : "h-28 w-28"}`}
        >
          …
        </div>
      )}
      <p className="mt-1.5 line-clamp-2 break-all text-center text-[9px] leading-tight text-slate-500">
        {url || "\u00a0"}
      </p>
    </div>
  );
}
