/** 淘汰音效（localStorage 开关；同时淘汰合并为一次，串行播放不重叠） */

export const STORAGE_ELIMINATION_SOUND = "quiz_elimination_sound";

const AUDIO_URL = "/audio/eliminated.mp3";
/** 同一批淘汰合并窗口（ms 内多次触发只响 1 次） */
const COALESCE_MS = 500;
/** 相邻两次播放的最短间隔 */
const MIN_GAP_MS = 900;
/** 单段最长占用时间（避免 onended 缺失阻塞队列） */
const MAX_CLIP_MS = 2200;
/** 短时间内的最多播放次数（防止连续多批拖太长） */
const MAX_BURST_PLAYS = 2;
const BURST_WINDOW_MS = 4000;

let audio: HTMLAudioElement | null = null;
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;
let playChain: Promise<void> = Promise.resolve();
let lastPlayEndedAt = 0;
let burstPlayCount = 0;
let burstWindowStart = 0;

export function isEliminationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_ELIMINATION_SOUND) !== "false";
}

export function setEliminationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ELIMINATION_SOUND, enabled ? "true" : "false");
}

export function playEliminationSound(): void {
  if (typeof window === "undefined" || !isEliminationSoundEnabled()) return;

  if (!coalesceTimer) {
    coalesceTimer = setTimeout(flushCoalesced, COALESCE_MS);
  }
}

function flushCoalesced(): void {
  coalesceTimer = null;

  const now = Date.now();
  if (now - burstWindowStart > BURST_WINDOW_MS) {
    burstWindowStart = now;
    burstPlayCount = 0;
  }
  if (burstPlayCount >= MAX_BURST_PLAYS) return;

  burstPlayCount++;
  playChain = playChain.then(() => playOneClip());
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function playOneClip(): Promise<void> {
  if (!isEliminationSoundEnabled()) return;

  const gap = MIN_GAP_MS - (Date.now() - lastPlayEndedAt);
  if (gap > 0) await sleep(gap);

  try {
    if (!audio) audio = new Audio(AUDIO_URL);
    audio.currentTime = 0;

    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        audio!.onended = null;
        lastPlayEndedAt = Date.now();
        resolve();
      };
      audio!.onended = finish;
      window.setTimeout(finish, MAX_CLIP_MS);
      void audio!.play().catch(finish);
    });
  } catch {
    lastPlayEndedAt = Date.now();
  }
}
