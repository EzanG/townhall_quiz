"use client";

import { useMemo } from "react";
import { useSeatsLayout } from "@/hooks/useSeatsLayout";
import type { SeatDef, SeatsLayout } from "@/lib/seats";
import type { PlayerPublic } from "@/lib/game";
import { isAnswerPhase } from "@/lib/gamePhase";
import type { GamePhase } from "@/lib/schema";
import { zh } from "@/lib/zh";

type Props = {
  players: PlayerPublic[];
  phase?: GamePhase;
  selectedSeatId?: string | null;
  onSelectSeat?: (seatId: string) => void;
  interactive?: boolean;
  compact?: boolean;
  /** 外部传入布局（如设置页预览）；默认从 /api/seats 加载 */
  layoutOverride?: SeatsLayout | null;
};

function seatColor(
  seat: SeatDef,
  player: PlayerPublic | undefined,
  phase: GamePhase | undefined,
  selected: boolean
): string {
  if (selected) return "#3b82f6";
  if (!player) return "#6b7280";
  if (player.status === "out") return "#ef4444";
  if (isAnswerPhase(phase) && !player.submittedThisRound) return "#86efac";
  return "#22c55e";
}

function buildAxisLabels(seats: SeatDef[]) {
  const rowMap = new Map<number, { x: number; y: number }>();
  const colMap = new Map<number, { x: number; y: number }>();

  for (const seat of seats) {
    const rowCur = rowMap.get(seat.row);
    if (!rowCur || seat.x < rowCur.x) {
      rowMap.set(seat.row, { x: seat.x, y: seat.y });
    }
    const colCur = colMap.get(seat.col);
    if (!colCur || seat.y > colCur.y) {
      colMap.set(seat.col, { x: seat.x, y: seat.y });
    }
  }

  const rowLabels = [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, pos]) => ({ n, x: pos.x, y: pos.y }));
  const colLabels = [...colMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, pos]) => ({ n, x: pos.x, y: pos.y }));

  return { rowLabels, colLabels };
}

export function SeatMap({
  players,
  phase,
  selectedSeatId,
  onSelectSeat,
  interactive = false,
  compact = false,
  layoutOverride,
}: Props) {
  const { layout: fetched, loading } = useSeatsLayout({
    enabled: layoutOverride === undefined,
  });
  const layout = layoutOverride ?? fetched;
  const playerMap = new Map(players.map((p) => [p.seatId, p]));

  const padL = layout?.labelPadLeft ?? 32;
  const axis = useMemo(
    () => (layout ? buildAxisLabels(layout.seats) : { rowLabels: [], colLabels: [] }),
    [layout]
  );

  if (!layout) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        {loading ? zh.loading : zh.seatMapLoadFail}
      </div>
    );
  }

  const seatXs = layout.seats.map((s) => s.x);
  const stageX =
    seatXs.length > 0
      ? (Math.min(...seatXs) + Math.max(...seatXs)) / 2
      : 400;
  const labelSize = compact ? 10 : 12;
  const rowLabelX = padL * 0.45;
  const maxSeatBottom = layout.seats.reduce(
    (m, s) => Math.max(m, s.y + s.r),
    0
  );
  const colLabelGap = compact ? 14 : 18;
  const colLabelY = maxSeatBottom + colLabelGap;

  return (
    <div className={compact ? "w-full overflow-auto" : "w-full"}>
      <svg
        viewBox={layout.viewBox}
        className="mx-auto h-auto w-full max-h-[70vh]"
        role="img"
        aria-label={zh.seatMapAria}
      >
        <text
          x={stageX}
          y={28}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={compact ? 12 : 16}
        >
          {layout.stageLabel}
        </text>

        {axis.rowLabels.map(({ n, y }) => (
          <text
            key={`row-${n}`}
            x={rowLabelX}
            y={y + 4}
            textAnchor="middle"
            fill="#64748b"
            fontSize={labelSize}
            fontWeight="600"
          >
            {n}
          </text>
        ))}

        {axis.colLabels.map(({ n, x }) => (
          <text
            key={`col-${n}`}
            x={x}
            y={colLabelY}
            textAnchor="middle"
            fill="#64748b"
            fontSize={labelSize}
            fontWeight="600"
          >
            {n}
          </text>
        ))}

        {layout.seats.map((seat) => {
          const p = playerMap.get(seat.id);
          const taken = !!p;
          const canSelect = interactive && !taken;
          const fill = seatColor(
            seat,
            p,
            phase,
            selectedSeatId === seat.id
          );

          return (
            <g
              key={seat.id}
              className={canSelect ? "cursor-pointer" : undefined}
              onClick={() => canSelect && onSelectSeat?.(seat.id)}
            >
              <circle
                cx={seat.x}
                cy={seat.y}
                r={seat.r}
                fill={fill}
                stroke={selectedSeatId === seat.id ? "#fff" : "#1e293b"}
                strokeWidth={selectedSeatId === seat.id ? 2 : 0.5}
              />
              {p && (
                <text
                  x={seat.x}
                  y={seat.y + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={compact ? 8 : 9}
                  fontWeight="bold"
                >
                  {p.correctCount > 0 ? p.correctCount : zh.seatDot}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
