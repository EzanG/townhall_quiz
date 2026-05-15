"use client";

import { seatsLayout, type SeatDef } from "@/lib/seats";
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

export function SeatMap({
  players,
  phase,
  selectedSeatId,
  onSelectSeat,
  interactive = false,
  compact = false,
}: Props) {
  const playerMap = new Map(players.map((p) => [p.seatId, p]));

  return (
    <div className={compact ? "w-full overflow-auto" : "w-full"}>
      <svg
        viewBox={seatsLayout.viewBox}
        className="mx-auto h-auto w-full max-h-[70vh]"
        role="img"
        aria-label={zh.seatMapAria}
      >
        <text
          x={parseInt(seatsLayout.viewBox.split(" ")[2] ?? "400", 10) / 2}
          y={28}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={compact ? 12 : 16}
        >
          {seatsLayout.stageLabel}
        </text>
        {seatsLayout.seats.map((seat) => {
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
