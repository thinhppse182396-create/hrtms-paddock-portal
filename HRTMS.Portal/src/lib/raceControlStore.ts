import { getRaceControlState, saveRaceControlState } from "@/lib/backendApi";
import type { RefereePanel, SimResult } from "@/lib/racing";

export type ControlPhase = "PreRace" | "InProgress" | "Provisional" | "Official";

export interface RaceControlState {
  raceId: string;
  phase: ControlPhase;
  reviewStep: number;
  panelSignedCount: number;
  panel?: RefereePanel;
  simResult?: SimResult;
  updatedAt: string;
}

export function loadRaceControl(raceId: string) {
  return getRaceControlState<RaceControlState>(raceId);
}

export async function saveRaceControl(state: RaceControlState) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  await saveRaceControlState(state.raceId, next);
  window.dispatchEvent(new CustomEvent("raceControl:update", { detail: state.raceId }));
}
