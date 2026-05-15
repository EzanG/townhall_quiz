import layout from "@/data/seats.layout.json";

export type SeatDef = {
  id: string;
  row: number;
  col: number;
  block: string;
  x: number;
  y: number;
  r: number;
};

export type SeatsLayout = {
  viewBox: string;
  stageLabel: string;
  seats: SeatDef[];
};

export const seatsLayout = layout as SeatsLayout;

export function getSeat(id: string): SeatDef | undefined {
  return seatsLayout.seats.find((s) => s.id === id);
}
