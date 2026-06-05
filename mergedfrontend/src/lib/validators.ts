// Pure validation helpers extracted so they can be unit-tested in isolation.
// Mirrors the inline rules used in admin.races and admin.tournaments.

export const RACE_ID_RE = /^R\d{3,}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidRaceId(id: string): boolean {
  return RACE_ID_RE.test(id);
}

export function isValidTime24h(t: string): boolean {
  return TIME_RE.test(t);
}

export function isValidDate(d: string): boolean {
  return DATE_RE.test(d);
}

export function parseBreeds(input: string): string[] {
  return input.split(",").map(s => s.trim()).filter(Boolean);
}

/** Returns the list of duplicate breed labels (case-insensitive). */
export function findDuplicateBreeds(input: string): string[] {
  const breeds = parseBreeds(input);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const b of breeds) {
    const lower = b.toLowerCase();
    if (seen.has(lower)) dupes.add(b);
    else seen.add(lower);
  }
  return Array.from(dupes);
}

export interface DateWindow { startDate: string; endDate: string }

export function isDateInWindow(date: string, w: DateWindow): boolean {
  return date >= w.startDate && date <= w.endDate;
}

export function isTournamentWindowValid(startDate: string, endDate: string): boolean {
  return Boolean(startDate) && Boolean(endDate) && startDate <= endDate;
}

export interface RaceSlot { id: string; tournamentId: string; date: string; time: string }

/** Returns the colliding race (if any) for a date+time slot inside a tournament. */
export function findSlotConflict(
  rows: RaceSlot[],
  candidate: RaceSlot,
  editingId?: string
): RaceSlot | null {
  return (
    rows.find(
      r =>
        r.id !== (editingId ?? "") &&
        r.tournamentId === candidate.tournamentId &&
        r.date === candidate.date &&
        r.time === candidate.time
    ) ?? null
  );
}

export interface AgeWeightRange {
  minAge?: number | string;
  maxAge?: number | string;
  minWeight?: number | string;
  maxWeight?: number | string;
}

export function validateRangeErrors(v: AgeWeightRange): Record<string, string> {
  const e: Record<string, string> = {};
  const minA = Number(v.minAge), maxA = Number(v.maxAge);
  const minW = Number(v.minWeight), maxW = Number(v.maxWeight);
  if (minA < 0) e.minAge = "Min age cannot be negative";
  if (maxA < 0) e.maxAge = "Max age cannot be negative";
  if (minA && maxA && minA > maxA) e.maxAge = `Max age (${maxA}) must be ≥ min age (${minA})`;
  if (minW < 0) e.minWeight = "Min weight cannot be negative";
  if (maxW < 0) e.maxWeight = "Max weight cannot be negative";
  if (minW && maxW && minW > maxW) e.maxWeight = `Max weight (${maxW}kg) must be ≥ min weight (${minW}kg)`;
  return e;
}
