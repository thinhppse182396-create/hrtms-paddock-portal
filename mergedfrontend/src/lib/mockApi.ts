// Lightweight mock "server" that mimics async API responses with structured
// validation errors. Throw `ApiError` with `fieldErrors` so the FormModal can
// map them onto the right input.

export class ApiError extends Error {
  fieldErrors: Record<string, string>;
  status: number;
  constructor(message: string, fieldErrors: Record<string, string> = {}, status = 400) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

const delay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

const fail = (msg: string, fieldErrors: Record<string, string>, status = 422): never => {
  throw new ApiError(msg, fieldErrors, status);
};

type RaceInput = { id: string; tournamentId: string };
type TournamentInput = { id: string };
type WithId = { id: string };

// ============================================================
// Race state machine
// ============================================================
export type RaceState =
  | "draft"
  | "open"
  | "closed_registration"
  | "ongoing"
  | "finished"
  | "published";

const RACE_TRANSITIONS: Record<RaceState, RaceState[]> = {
  draft: ["open"],
  open: ["closed_registration", "draft"],
  closed_registration: ["ongoing", "open"],
  ongoing: ["finished"],
  finished: ["published"],
  published: [],
};

export function canTransitionRace(from: RaceState, to: RaceState): boolean {
  return RACE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionRace(from: RaceState, to: RaceState): RaceState {
  if (!canTransitionRace(from, to)) {
    throw new ApiError(
      `Không thể chuyển trạng thái Race từ "${from}" sang "${to}"`,
      { state: `Chuyển trạng thái không hợp lệ: ${from} → ${to}` },
      409
    );
  }
  return to;
}

// ============================================================
// Race CRUD
// ============================================================
export async function saveRace<T extends RaceInput>(
  input: T,
  opts: { existing: WithId[]; tournamentIds: string[]; editingId?: string }
): Promise<T> {
  await delay();
  const fieldErrors: Record<string, string> = {};

  if (!input.id) {
    fieldErrors.id = "Race ID là bắt buộc";
  } else if (!opts.editingId && opts.existing.some(r => r.id === input.id)) {
    fieldErrors.id = `Race ID "${input.id}" đã tồn tại trên server`;
  }

  if (!input.tournamentId) {
    fieldErrors.tournamentId = "Tournament là bắt buộc";
  } else if (!opts.tournamentIds.includes(input.tournamentId)) {
    fieldErrors.tournamentId = `Tournament "${input.tournamentId}" không tồn tại`;
  }

  if (Object.keys(fieldErrors).length) {
    fail("Server từ chối lưu Race do dữ liệu không hợp lệ", fieldErrors);
  }
  return input;
}

export async function saveTournament<T extends TournamentInput>(
  input: T,
  opts: { existing: WithId[]; editingId?: string }
): Promise<T> {
  await delay();
  const fieldErrors: Record<string, string> = {};

  if (!input.id) {
    fieldErrors.id = "Tournament ID là bắt buộc";
  } else if (!opts.editingId && opts.existing.some(t => t.id === input.id)) {
    fieldErrors.id = `Tournament ID "${input.id}" đã tồn tại trên server`;
  }

  if (Object.keys(fieldErrors).length) {
    fail("Server từ chối lưu Tournament do dữ liệu không hợp lệ", fieldErrors);
  }
  return input;
}

// ============================================================
// Registration (Owner đăng ký ngựa vào Race)
// ============================================================
export type RegistrationInput = {
  id: string;
  raceId: string;
  horseId: string;
  ownerId: string;
};

export type ExistingRegistration = {
  id: string;
  raceId: string;
  horseId: string;
  status: "pending" | "approved" | "rejected";
};

export async function saveRegistration(
  input: RegistrationInput,
  opts: {
    existing: ExistingRegistration[];
    raceState: RaceState;
    editingId?: string;
  }
): Promise<RegistrationInput> {
  await delay();
  const fieldErrors: Record<string, string> = {};

  if (!input.id) fieldErrors.id = "Registration ID là bắt buộc";
  if (!input.raceId) fieldErrors.raceId = "Race là bắt buộc";
  if (!input.horseId) fieldErrors.horseId = "Horse là bắt buộc";
  if (!input.ownerId) fieldErrors.ownerId = "Owner là bắt buộc";

  if (!opts.editingId && opts.existing.some(r => r.id === input.id)) {
    fieldErrors.id = `Registration "${input.id}" đã tồn tại`;
  }

  // Race phải đang nhận đăng ký
  if (opts.raceState !== "open") {
    fieldErrors.raceId = `Race đang ở trạng thái "${opts.raceState}", không nhận đăng ký`;
  }

  // Một ngựa chỉ được đăng ký 1 lần / race (trừ bản thân khi edit)
  const dup = opts.existing.find(
    r =>
      r.raceId === input.raceId &&
      r.horseId === input.horseId &&
      r.status !== "rejected" &&
      r.id !== opts.editingId
  );
  if (dup) {
    fieldErrors.horseId = `Ngựa "${input.horseId}" đã được đăng ký vào race này`;
  }

  if (Object.keys(fieldErrors).length) {
    fail("Server từ chối lưu Registration", fieldErrors);
  }
  return input;
}

// ============================================================
// Invitation (Owner mời Jockey) — chỉ khi Registration approved
// ============================================================
export type InvitationInput = {
  id: string;
  registrationId: string;
  jockeyId: string;
};

export async function saveInvitation(
  input: InvitationInput,
  opts: {
    existing: WithId[];
    registration?: { id: string; status: "pending" | "approved" | "rejected" };
    editingId?: string;
  }
): Promise<InvitationInput> {
  await delay();
  const fieldErrors: Record<string, string> = {};

  if (!input.id) fieldErrors.id = "Invitation ID là bắt buộc";
  if (!input.registrationId) fieldErrors.registrationId = "Registration là bắt buộc";
  if (!input.jockeyId) fieldErrors.jockeyId = "Jockey là bắt buộc";

  if (!opts.editingId && opts.existing.some(i => i.id === input.id)) {
    fieldErrors.id = `Invitation "${input.id}" đã tồn tại`;
  }

  if (!opts.registration) {
    fieldErrors.registrationId = `Registration "${input.registrationId}" không tồn tại`;
  } else if (opts.registration.status !== "approved") {
    fieldErrors.registrationId = `Chỉ được mời jockey khi registration đã approved (hiện tại: ${opts.registration.status})`;
  }

  if (Object.keys(fieldErrors).length) {
    fail("Server từ chối lưu Invitation", fieldErrors);
  }
  return input;
}

// ============================================================
// Result (Referee ghi nhận) — yêu cầu pre-race check pass
// ============================================================
export type ResultInput = {
  id: string;
  raceId: string;
  rankings: Array<{ horseId: string; position: number }>;
};

export async function saveResult(
  input: ResultInput,
  opts: {
    raceState: RaceState;
    preRaceCheckPassed: boolean;
    approvedHorseIds: string[];
  }
): Promise<ResultInput> {
  await delay();
  const fieldErrors: Record<string, string> = {};

  if (!input.id) fieldErrors.id = "Result ID là bắt buộc";
  if (!input.raceId) fieldErrors.raceId = "Race là bắt buộc";

  if (opts.raceState !== "ongoing" && opts.raceState !== "finished") {
    fieldErrors.raceId = `Chỉ ghi kết quả khi race đang/đã diễn ra (state hiện tại: ${opts.raceState})`;
  }
  if (!opts.preRaceCheckPassed) {
    fieldErrors.raceId = "Pre-race check chưa pass";
  }

  if (!input.rankings?.length) {
    fieldErrors.rankings = "Phải có ít nhất 1 thứ hạng";
  } else {
    // mỗi ngựa phải thuộc danh sách approved
    const invalid = input.rankings.find(r => !opts.approvedHorseIds.includes(r.horseId));
    if (invalid) {
      fieldErrors.rankings = `Ngựa "${invalid.horseId}" không có trong danh sách approved`;
    }
    // position phải duy nhất và >= 1
    const positions = input.rankings.map(r => r.position);
    if (positions.some(p => p < 1)) {
      fieldErrors.rankings = "Position phải >= 1";
    } else if (new Set(positions).size !== positions.length) {
      fieldErrors.rankings = "Position bị trùng";
    }
  }

  if (Object.keys(fieldErrors).length) {
    fail("Server từ chối lưu Result", fieldErrors);
  }
  return input;
}

// ============================================================
// Award (Admin cấu hình prize cho race)
// ============================================================
export type AwardInput = {
  id: string;
  raceId: string;
  first: number;
  second: number;
  third: number;
};

export async function saveAward(
  input: AwardInput,
  opts: { existing: WithId[]; raceIds: string[]; editingId?: string }
): Promise<AwardInput & { total: number }> {
  await delay();
  const fieldErrors: Record<string, string> = {};

  if (!input.id) fieldErrors.id = "Award ID là bắt buộc";
  if (!input.raceId) fieldErrors.raceId = "Race là bắt buộc";
  else if (!opts.raceIds.includes(input.raceId)) {
    fieldErrors.raceId = `Race "${input.raceId}" không tồn tại`;
  }

  if (!opts.editingId && opts.existing.some(a => a.id === input.id)) {
    fieldErrors.id = `Award "${input.id}" đã tồn tại`;
  }

  for (const k of ["first", "second", "third"] as const) {
    if (typeof input[k] !== "number" || input[k] < 0) {
      fieldErrors[k] = `${k} phải là số >= 0`;
    }
  }
  if (
    !fieldErrors.first &&
    !fieldErrors.second &&
    !fieldErrors.third &&
    !(input.first >= input.second && input.second >= input.third)
  ) {
    fieldErrors.first = "Thứ tự phải: first >= second >= third";
  }

  if (Object.keys(fieldErrors).length) {
    fail("Server từ chối lưu Award", fieldErrors);
  }
  return { ...input, total: input.first + input.second + input.third };
}

// ============================================================
// Betting (Spectator) — chỉ mở khi race chưa ongoing
// ============================================================
export function canPlaceBet(raceState: RaceState): boolean {
  return raceState === "open" || raceState === "closed_registration";
}

export function assertCanPlaceBet(raceState: RaceState): void {
  if (!canPlaceBet(raceState)) {
    throw new ApiError(
      "Không thể đặt cược lúc này",
      { raceState: `Race đang ở "${raceState}", đã khoá cược` },
      409
    );
  }
}

// ============================================================
// #99 — GET /races/published (mock)
// ============================================================
import { raceResults, races, type Race } from "@/data/mockData";

export type PublishedRace = Race & { results: typeof raceResults };

export async function getPublishedRaces(): Promise<PublishedRace[]> {
  await delay();
  const publishedRaceIds = new Set(
    raceResults.filter(r => r.published).map(r => r.raceId)
  );
  return races
    .filter(r => publishedRaceIds.has(r.id))
    .map(r => ({ ...r, results: raceResults.filter(res => res.raceId === r.id && res.published) }));
}