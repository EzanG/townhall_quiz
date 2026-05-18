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
  rows?: number;
  cols?: number;
  viewBox: string;
  stageLabel: string;
  labelPadLeft?: number;
  labelPadBottom?: number;
  seats: SeatDef[];
};

/** 构建时默认布局（客户端首屏）；运行中 SeatMap 以 /api/seats 为准 */
export const seatsLayout = layout as SeatsLayout;

export function getSeatFromLayout(
  layoutData: SeatsLayout,
  id: string
): SeatDef | undefined {
  return layoutData.seats.find((s) => s.id === id);
}
