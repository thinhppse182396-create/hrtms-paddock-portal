// ============================================================
// HRTMS extended domain — Tracks, Rounds, Referee Panel,
// Prize pool, Race constraints & Simulation engine.
//
// Per research_report_hrtms_24_05_26: Domain rules from
// IFHA / Nevada / Queensland Racing / BHA / Nghị định 06/2017.
// ============================================================

import type { Race } from "@/data/mockData";

// ----------------------------- TRACKS -----------------------------

export interface TrackDistance {
  meters: number;
  chuteLabel: string; // physical chute / starting gate built for that distance
}

export interface Track {
  id: string;
  name: string;
  lengthMeters: number;
  widthMeters: number;       // determines maxLanes via Nevada 1.5m/horse formula
  distances: TrackDistance[];
}

export const tracks: Track[] = [
  {
    id: "TRK-A", name: "Track A — Đại Nam Main",
    lengthMeters: 1600, widthMeters: 16,
    distances: [
      { meters: 1200, chuteLabel: "1200m Chute" },
      { meters: 1400, chuteLabel: "1400m Chute" },
      { meters: 1600, chuteLabel: "1600m Full Loop" },
    ],
  },
  {
    id: "TRK-B", name: "Track B — Sprint Oval",
    lengthMeters: 1200, widthMeters: 20,
    distances: [
      { meters: 800,  chuteLabel: "800m Sprint Chute" },
      { meters: 1000, chuteLabel: "1000m Chute" },
      { meters: 1200, chuteLabel: "1200m Full Loop" },
    ],
  },
  {
    id: "TRK-C", name: "Track C — Endurance Loop",
    lengthMeters: 2000, widthMeters: 18,
    distances: [
      { meters: 1600, chuteLabel: "1600m Chute" },
      { meters: 1800, chuteLabel: "1800m Chute" },
      { meters: 2000, chuteLabel: "2000m Full Loop" },
      { meters: 2400, chuteLabel: "2400m Extended Chute" },
    ],
  },
];

/** Nevada standard — 1.5m of track width required per horse. */
export const maxLanesForWidth = (widthMeters: number) => Math.floor(widthMeters / 1.5);

export const getTrack = (id: string) => tracks.find(t => t.id === id);

// --------------------------- ROUNDS -------------------------------

export type RoundType = "Heat" | "Semi-Final" | "Final";

export interface RaceRound {
  id: string;
  raceId: string;
  type: RoundType;
  startTime: string;   // HH:MM same day as race
  status: "Scheduled" | "InProgress" | "Provisional" | "Official" | "Cancelled";
}

/** IFHA / Ontario standard — ≥ 40 minutes rest between rounds same day. */
export const ROUND_REST_MIN = 40;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function validateRoundSchedule(rounds: RaceRound[]): string | null {
  const sorted = [...rounds].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    const gap = toMin(sorted[i].startTime) - toMin(sorted[i - 1].startTime);
    if (gap < ROUND_REST_MIN) {
      return `Round ${sorted[i].type} (${sorted[i].startTime}) chỉ cách ${sorted[i - 1].type} ${gap} phút — yêu cầu tối thiểu ${ROUND_REST_MIN} phút.`;
    }
  }
  return null;
}

// ------------------------ REFEREE PANEL ---------------------------

export type RefereeRole = "Lead" | "Member";
export type LicenseLevel = "Junior" | "Senior" | "International";

export interface PanelMember {
  refereeId: string;
  role: RefereeRole;
  signed: boolean;     // true once they co-sign RefereeReport
  signedAt?: string;
}

export interface RefereePanel {
  raceId: string;
  members: PanelMember[];     // must be exactly 3 (1 Lead + 2 Members)
}

export function validatePanel(panel: RefereePanel): string | null {
  if (panel.members.length !== 3) return "Panel phải có đúng 3 trọng tài.";
  const leads = panel.members.filter(m => m.role === "Lead").length;
  if (leads !== 1) return "Panel phải có đúng 1 Lead Referee.";
  const ids = new Set(panel.members.map(m => m.refereeId));
  if (ids.size !== 3) return "Trọng tài không được trùng nhau.";
  return null;
}

export const panelSigned = (p: RefereePanel) =>
  p.members.length === 3 && p.members.every(m => m.signed);

// --------------------------- PRIZE POOL ---------------------------

export interface OrganizerCommitment {
  organizerAddedMoney: number;
  entryFeePerHorse: number;
  sponsorshipAmount: number;
}

// Industry pari-mutuel split (research report §7.2)
export const TAKEOUT_RATE = 0.20;
export const PURSE_CONTRIBUTION_RATE = 0.40;

// Position % of pool (§7.5)
export const POSITION_DISTRIBUTION = [0.60, 0.20, 0.10, 0.05, 0.03, 0.02];

// Per-position split between stakeholders
export const STAKEHOLDER_SPLIT = { owner: 0.80, jockey: 0.10, management: 0.10 };

export function guaranteedMinimum(commitment: OrganizerCommitment, confirmedRegistrations: number): number {
  return (
    commitment.organizerAddedMoney +
    commitment.sponsorshipAmount +
    confirmedRegistrations * commitment.entryFeePerHorse
  );
}

export function bettingContribution(totalHandle: number): number {
  return totalHandle * TAKEOUT_RATE * PURSE_CONTRIBUTION_RATE;
}

export function actualPrizePool(commitment: OrganizerCommitment, confirmedRegistrations: number, totalHandle: number): number {
  return Math.max(
    guaranteedMinimum(commitment, confirmedRegistrations),
    bettingContribution(totalHandle),
  );
}

export interface PrizeBreakdownRow {
  rank: number;
  total: number;
  owner: number;
  jockey: number;
  management: number;
}

export function prizeBreakdown(pool: number, confirmedHorses: number): PrizeBreakdownRow[] {
  const positions = Math.min(POSITION_DISTRIBUTION.length, confirmedHorses);
  const rows: PrizeBreakdownRow[] = [];
  for (let i = 0; i < positions; i++) {
    const total = pool * POSITION_DISTRIBUTION[i];
    rows.push({
      rank: i + 1,
      total,
      owner: total * STAKEHOLDER_SPLIT.owner,
      jockey: total * STAKEHOLDER_SPLIT.jockey,
      management: total * STAKEHOLDER_SPLIT.management,
    });
  }
  return rows;
}

// ------------------------ RACE CONSTRAINTS ------------------------

/** Jockey max 3 horses per calendar day (hard block). */
export const JOCKEY_DAILY_CAP = 3;

/** Horse min rest between race days, Queensland Racing standard (hard, no override). */
export const HORSE_REST_DAYS = 6;

/** Registration must close ≥ 5 days before race day. */
export const REGISTRATION_LEAD_DAYS = 5;

/** Swap jockey within 48h of race start = hard block. */
export const JOCKEY_SWAP_LOCK_HOURS = 48;

const dayDiff = (a: string, b: string) => Math.round((+new Date(b) - +new Date(a)) / 86400000);

export interface RaceDayEntry {
  raceId: string;
  date: string;     // YYYY-MM-DD
  startTime: string; // HH:MM
  trackId: string;
  jockeyId?: string;
  horseId?: string;
}

export interface ConstraintIssue { level: "error" | "warning"; message: string }

export function checkJockeyDailyEntries(jockeyId: string, raceDate: string, entries: RaceDayEntry[]): ConstraintIssue[] {
  const sameDay = entries.filter(e => e.jockeyId === jockeyId && e.date === raceDate);
  const issues: ConstraintIssue[] = [];
  if (sameDay.length >= JOCKEY_DAILY_CAP) {
    issues.push({ level: "error", message: `Jockey đã đạt giới hạn ${JOCKEY_DAILY_CAP} ngựa/ngày (${raceDate}).` });
  }
  for (let i = 0; i < sameDay.length; i++) {
    for (let j = i + 1; j < sameDay.length; j++) {
      const a = sameDay[i], b = sameDay[j];
      if (a.trackId !== b.trackId) {
        const gap = Math.abs(toMin(a.startTime) - toMin(b.startTime));
        if (gap === 0) issues.push({ level: "error", message: `Trùng giờ giữa 2 track khác nhau (${a.raceId} ↔ ${b.raceId}).` });
        else if (gap < 120) issues.push({ level: "warning", message: `Khoảng cách ${gap} phút giữa 2 track (<2h) — cần Admin xem xét.` });
      }
    }
  }
  return issues;
}

export function checkHorseRest(horseId: string, raceDate: string, entries: RaceDayEntry[]): ConstraintIssue[] {
  const past = entries.filter(e => e.horseId === horseId && e.date !== raceDate);
  for (const e of past) {
    const gap = Math.abs(dayDiff(e.date, raceDate));
    if (gap < HORSE_REST_DAYS) {
      return [{ level: "error", message: `Ngựa cần ≥ ${HORSE_REST_DAYS} ngày nghỉ — chỉ còn ${gap} ngày so với ${e.raceId} (${e.date}).` }];
    }
  }
  return [];
}

export function checkRegistrationDeadline(raceDate: string, today = new Date()): ConstraintIssue[] {
  const gap = dayDiff(today.toISOString().slice(0, 10), raceDate);
  if (gap < REGISTRATION_LEAD_DAYS) {
    return [{ level: "error", message: `Đăng ký phải hoàn tất ≥ ${REGISTRATION_LEAD_DAYS} ngày trước race day (còn ${gap} ngày).` }];
  }
  return [];
}

export function checkJockeySwapLock(raceDateTime: Date, now = new Date()): ConstraintIssue[] {
  const hours = (+raceDateTime - +now) / 3600000;
  if (hours < JOCKEY_SWAP_LOCK_HOURS) {
    return [{ level: "error", message: `Trong vòng ${JOCKEY_SWAP_LOCK_HOURS}h trước race — không thể thay jockey.` }];
  }
  return [];
}

// ---------------------- TOURNAMENT RESERVATION --------------------

export interface TrackReservation {
  trackId: string;
  start: string; // YYYY-MM-DD
  end: string;
}

export function trackHasConflict(candidate: TrackReservation, existing: TrackReservation[]): TrackReservation | null {
  for (const e of existing) {
    if (e.trackId !== candidate.trackId) continue;
    if (candidate.start <= e.end && e.start <= candidate.end) return e;
  }
  return null;
}

// ---------------------- RACE SIMULATION ENGINE --------------------
// §8.2 — Outputs trajectoryData + resultData in a single run so animation
// and official result are always consistent.

export interface SimEntry { horseId: string; jockeyId: string; baseSpeed: number; jockeyBonus: number }
export interface SimFrame { t: number; positions: Record<string, number> } // meters at time t
export interface SimResultRow { horseId: string; jockeyId: string; finishSeconds: number; rank: number }
export interface SimResult {
  trajectory: SimFrame[];
  results: SimResultRow[];
}

export function simulateRace(distanceMeters: number, entries: SimEntry[], seed = Date.now()): SimResult {
  // Deterministic-ish pseudo-random with seed so demo is reproducible per click.
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };

  const speeds = entries.map(e => {
    const variance = 1 + (rand() * 0.2 - 0.1); // ±10%
    return e.baseSpeed * (1 + e.jockeyBonus) * variance;
  });

  const finish = entries.map((e, i) => ({
    horseId: e.horseId,
    jockeyId: e.jockeyId,
    finishSeconds: distanceMeters / speeds[i],
  }));

  const ranked = [...finish].sort((a, b) => a.finishSeconds - b.finishSeconds);
  const results: SimResultRow[] = ranked.map((r, i) => ({ ...r, rank: i + 1 }));

  // Sample trajectory every 0.5s up to slowest finish.
  const slowest = ranked[ranked.length - 1].finishSeconds;
  const trajectory: SimFrame[] = [];
  for (let t = 0; t <= slowest; t += 0.5) {
    const positions: Record<string, number> = {};
    entries.forEach((e, i) => {
      positions[e.horseId] = Math.min(distanceMeters, t * speeds[i]);
    });
    trajectory.push({ t, positions });
  }
  return { trajectory, results };
}

// ---------------------- SEED ROUNDS + PANELS ----------------------

export const seedRounds: RaceRound[] = [
  { id: "RD-001-H", raceId: "R001", type: "Heat",        startTime: "14:00", status: "Scheduled" },
  { id: "RD-001-S", raceId: "R001", type: "Semi-Final",  startTime: "15:00", status: "Scheduled" },
  { id: "RD-001-F", raceId: "R001", type: "Final",       startTime: "16:00", status: "Scheduled" },
  { id: "RD-002-F", raceId: "R002", type: "Final",       startTime: "15:30", status: "Scheduled" },
  { id: "RD-003-F", raceId: "R003", type: "Final",       startTime: "10:00", status: "Official"  },
  { id: "RD-004-F", raceId: "R004", type: "Final",       startTime: "16:00", status: "InProgress" },
];

export const seedPanels: RefereePanel[] = [
  { raceId: "R001", members: [
    { refereeId: "RF001", role: "Lead",   signed: false },
    { refereeId: "RF002", role: "Member", signed: false },
    { refereeId: "RF003", role: "Member", signed: false },
  ]},
  { raceId: "R003", members: [
    { refereeId: "RF002", role: "Lead",   signed: true, signedAt: "2025-10-02 12:30" },
    { refereeId: "RF001", role: "Member", signed: true, signedAt: "2025-10-02 12:32" },
    { refereeId: "RF003", role: "Member", signed: true, signedAt: "2025-10-02 12:35" },
  ]},
];

// ---------------------- DEFAULT COMMITMENT PER RACE ----------------------

export const defaultCommitment: Record<string, OrganizerCommitment> = {
  R001: { organizerAddedMoney: 60000, entryFeePerHorse: 500, sponsorshipAmount: 10000 },
  R002: { organizerAddedMoney: 90000, entryFeePerHorse: 750, sponsorshipAmount: 5000  },
  R003: { organizerAddedMoney: 40000, entryFeePerHorse: 400, sponsorshipAmount: 0     },
  R004: { organizerAddedMoney: 120000, entryFeePerHorse: 1000, sponsorshipAmount: 25000 },
};

export function getCommitment(raceId: string): OrganizerCommitment {
  return defaultCommitment[raceId] ?? { organizerAddedMoney: 50000, entryFeePerHorse: 500, sponsorshipAmount: 0 };
}

// Race phase derived for spectator portal (§8.1).
export type RacePhase = "PreRace" | "InProgress" | "Provisional" | "Official";

export function racePhase(race: Race, panel?: RefereePanel): RacePhase {
  if (race.status === "Scheduled") return "PreRace";
  if (race.status === "Ongoing")   return "InProgress";
  if (race.status === "Completed") {
    if (panel && panelSigned(panel)) return "Official";
    return "Provisional";
  }
  return "PreRace";
}
