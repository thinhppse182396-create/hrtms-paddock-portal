// Persisted state shared between Admin Race Control and Spectator Race page.
import type { SimResult } from "@/lib/racing";

export type ControlPhase = "PreRace" | "InProgress" | "Provisional" | "Official";

export interface RaceControlState {
  raceId: string;
  phase: ControlPhase;
  reviewStep: number;        // 0..5 (5 = all confirmed → Official)
  panelSignedCount: number;  // 0..3
  simResult?: SimResult;
  updatedAt: string;
}

const KEY = (raceId: string) => `raceControl:${raceId}`;

export function loadRaceControl(raceId: string): RaceControlState | null {
  try {
    const raw = localStorage.getItem(KEY(raceId));
    return raw ? (JSON.parse(raw) as RaceControlState) : null;
  } catch { return null; }
}

export function saveRaceControl(state: RaceControlState) {
  try { localStorage.setItem(KEY(state.raceId), JSON.stringify({ ...state, updatedAt: new Date().toISOString() })); } catch {}
  try { window.dispatchEvent(new CustomEvent("raceControl:update", { detail: state.raceId })); } catch {}
}
