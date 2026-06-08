import {
  races as databaseRaces,
  refereePanels as databasePanels,
  rounds as databaseRounds,
  tracks as databaseTracks,
  type DatabasePanel,
  type DatabaseRound,
  type DatabaseTrack,
  type Race,
} from "@/data/databaseData";
import { calendarDaysBetween, toLocalDateString } from "@/lib/dateTime";

export type Track = DatabaseTrack;
export type RaceRound = DatabaseRound;
export type RefereePanel = DatabasePanel;

export interface TrackReservation {
  trackId: string;
  start: string;
  end: string;
}

export interface RaceDayEntry {
  raceId: string;
  date: string;
  startTime: string;
  trackId: string;
  horseId: string;
  jockeyId: string;
}

export interface ConstraintIssue {
  level: "error" | "warning";
  message: string;
}

export interface SimulationEntry {
  horseId: string;
  jockeyId: string;
  baseSpeed: number;
  jockeyBonus: number;
}

export interface SimulationResult {
  trajectory: Array<{ elapsedSeconds: number; positions: Array<{ horseId: string; distance: number }> }>;
  results: Array<{ horseId: string; jockeyId: string; rank: number; finishSeconds: number }>;
}

export type SimResult = SimulationResult;

export interface Commitment {
  organizerAddedMoney: number;
  sponsorshipAmount: number;
  entryFeePerHorse: number;
}

export const tracks: Track[] = databaseTracks;
export const seedRounds: RaceRound[] = databaseRounds;
export const seedPanels: RefereePanel[] = databasePanels;

export function maxLanesForWidth(widthMeters: number) {
  return Math.max(1, Math.floor(widthMeters / 1.5));
}

export function trackHasConflict(candidate: TrackReservation, reservations: TrackReservation[]) {
  return reservations.find(
    reservation =>
      reservation.trackId === candidate.trackId &&
      candidate.start <= reservation.end &&
      candidate.end >= reservation.start,
  );
}

export function checkRegistrationDeadline(raceDate: string, now = new Date()): ConstraintIssue[] {
  const days = calendarDaysBetween(toLocalDateString(now), raceDate);
  return days >= 5
    ? []
    : [{ level: "error", message: "Registration must be submitted at least 5 days before race day." }];
}

export function checkHorseRest(horseId: string, raceDate: string, entries: RaceDayEntry[]): ConstraintIssue[] {
  const tooClose = entries.find(entry =>
    entry.horseId === horseId &&
    Math.abs(calendarDaysBetween(entry.date, raceDate)) < 6,
  );
  return tooClose
    ? [{ level: "error", message: `Horse needs at least 6 rest days after race ${tooClose.raceId}.` }]
    : [];
}

export function checkJockeyDailyEntries(jockeyId: string, raceDate: string, entries: RaceDayEntry[]): ConstraintIssue[] {
  const count = entries.filter(entry => entry.jockeyId === jockeyId && entry.date === raceDate).length;
  return count >= 3
    ? [{ level: "error", message: "A jockey may ride at most 3 horses per race day." }]
    : [];
}

export function checkJockeySwapLock(raceStart: Date, now = new Date()): ConstraintIssue[] {
  return raceStart.getTime() - now.getTime() < 2 * 60 * 60 * 1000
    ? [{ level: "warning", message: "Jockey changes are locked within 2 hours of race start." }]
    : [];
}

export function validateRoundSchedule(rounds: RaceRound[]) {
  const sorted = [...rounds].sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = timeToMinutes(sorted[index - 1].startTime);
    const current = timeToMinutes(sorted[index].startTime);
    if (current - previous < 40) return "Rounds need at least 40 minutes of recovery time.";
  }
  return null;
}

export function validatePanel(panel: RefereePanel) {
  const ids = panel.members.map(member => member.refereeId).filter(Boolean);
  if (ids.length !== 3) return "Select exactly 3 referees.";
  if (new Set(ids).size !== ids.length) return "Each panel member must be a different referee.";
  if (panel.members.filter(member => member.role === "Lead").length !== 1) return "Select exactly one lead referee.";
  return null;
}

export function panelSigned(panel?: RefereePanel) {
  return Boolean(panel && !validatePanel(panel) && panel.members.every(member => member.signed));
}

export function simulateRace(distanceMeters: number, entries: SimulationEntry[]): SimulationResult {
  const results = entries
    .map(entry => ({
      horseId: entry.horseId,
      jockeyId: entry.jockeyId,
      finishSeconds: distanceMeters / Math.max(1, entry.baseSpeed * (1 + entry.jockeyBonus)),
    }))
    .sort((a, b) => a.finishSeconds - b.finishSeconds)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const duration = Math.ceil(results.at(-1)?.finishSeconds ?? 0);
  const trajectory = Array.from({ length: duration + 1 }, (_, elapsedSeconds) => ({
    elapsedSeconds,
    positions: results.map(result => ({
      horseId: result.horseId,
      distance: Math.min(distanceMeters, distanceMeters * elapsedSeconds / result.finishSeconds),
    })),
  }));
  return { trajectory, results };
}

export function getCommitment(raceId: string): Commitment {
  const configuredPrizePool =
    databaseRaces
      .find(race => race.id === raceId)
      ?.prizes.reduce((sum, prize) => sum + prize.money, 0) ?? 0;
  return {
    organizerAddedMoney: configuredPrizePool,
    sponsorshipAmount: 0,
    entryFeePerHorse: 0,
  };
}

export function guaranteedMinimum(commitment: Commitment, confirmedHorses = 0) {
  return commitment.organizerAddedMoney +
    commitment.sponsorshipAmount +
    commitment.entryFeePerHorse * confirmedHorses;
}

export function bettingContribution(totalHandle: number) {
  return totalHandle * 0.2 * 0.4;
}

export function actualPrizePool(commitment: Commitment, confirmedHorses = 0, totalHandle = 0) {
  return guaranteedMinimum(commitment, confirmedHorses) + bettingContribution(totalHandle);
}

export function prizeBreakdown(total: number, confirmedHorses = 3) {
  const percentages = [0.6, 0.2, 0.1, 0.05, 0.03, 0.02];
  return percentages.slice(0, Math.max(0, Math.min(confirmedHorses, percentages.length))).map((percentage, index) => {
    const amount = total * percentage;
    return {
      rank: index + 1,
      total: amount,
      owner: amount * 0.8,
      jockey: amount * 0.1,
      management: amount * 0.1,
    };
  });
}

export function racePhase(race: Race, panel?: RefereePanel) {
  if (race.status === "Completed") return panelSigned(panel) ? "Official" : "Provisional";
  if (race.status === "Ongoing") return "InProgress";
  return "PreRace";
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}
