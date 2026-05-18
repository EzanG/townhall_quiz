import { getSeatFromLayout, type SeatDef } from "@/lib/seats";
import { getSeatsLayout } from "@/lib/seats-layout";

export function getSeat(id: string): SeatDef | undefined {
  return getSeatFromLayout(getSeatsLayout(), id);
}
