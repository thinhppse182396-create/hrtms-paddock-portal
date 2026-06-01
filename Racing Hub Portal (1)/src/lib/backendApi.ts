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

const apiUrl = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const isBackendEnabled = () => apiUrl.length > 0;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiUrl) {
    throw new ApiError("Backend API is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`Cannot connect to backend API at ${apiUrl}.`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload.message ?? `API request failed (${response.status}).`, {}, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface BackendLoginResponse {
  accountId: string;
  username: string;
  fullName: string;
  roleCode: "ADMIN" | "REFEREE" | "JOCKEY" | "HORSE_OWNER" | "SPECTATOR";
}

export const loginWithBackend = (username: string, password: string) =>
  request<BackendLoginResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export async function syncTrack(track: {
  id: string;
  name: string;
  lengthMeters: number;
  widthMeters: number;
  distances: Array<{ meters: number }>;
  maxLanes: number;
}, editing: boolean) {
  await request(`/api/tracks${editing ? `/${track.id}` : ""}`, {
    method: editing ? "PUT" : "POST",
    body: JSON.stringify({
      trackId: track.id,
      trackName: track.name,
      length: String(track.lengthMeters),
      width: String(track.widthMeters),
      maxLanes: track.maxLanes,
      availableDistances: track.distances.map(distance => distance.meters).join(","),
    }),
  });
}

export const deleteTrack = (id: string) => request<void>(`/api/tracks/${id}`, { method: "DELETE" });

const TOURNAMENT_STATUS: Record<string, string> = {
  Draft: "DRAFT",
  Open: "OPEN",
  Closed: "CLOSED",
  Completed: "COMPLETED",
};

export async function syncTournament(tournament: {
  id: string;
  name: string;
  trackId?: string;
  startDate: string;
  endDate: string;
  status: string;
}, editing: boolean) {
  await request(`/api/tournaments${editing ? `/${tournament.id}` : ""}`, {
    method: editing ? "PUT" : "POST",
    body: JSON.stringify({
      tournamentId: tournament.id,
      name: tournament.name,
      trackId: tournament.trackId,
      start: tournament.startDate,
      end: tournament.endDate,
      statusCode: TOURNAMENT_STATUS[tournament.status] ?? tournament.status,
    }),
  });
}

export const deleteTournament = (id: string) => request<void>(`/api/tournaments/${id}`, { method: "DELETE" });

const RACE_STATUS: Record<string, string> = {
  Scheduled: "SCHEDULED",
  Ongoing: "ONGOING",
  Completed: "FINISHED",
  Cancelled: "CANCELLED",
};

export async function syncRace(race: {
  id: string;
  tournamentId: string;
  track: string;
  distance: number;
  lanes: number;
  status: string;
}, editing: boolean) {
  await request(`/api/races${editing ? `/${race.id}` : ""}`, {
    method: editing ? "PUT" : "POST",
    body: JSON.stringify({
      raceId: race.id,
      tournamentId: race.tournamentId,
      raceName: `${race.id} - ${race.track}`,
      distance: String(race.distance),
      lanes: race.lanes,
      statusCode: RACE_STATUS[race.status] ?? race.status,
    }),
  });
}

export const deleteRace = (id: string) => request<void>(`/api/races/${id}`, { method: "DELETE" });

export const syncRegistration = (registration: {
  id: string;
  raceId: string;
  horseId: string;
  jockeyId: string;
  backupJockeyId?: string;
}) => request("/api/registrations", {
  method: "POST",
  body: JSON.stringify({
    registrationId: registration.id,
    raceId: registration.raceId,
    horseId: registration.horseId,
    jockeyId: registration.jockeyId,
    backupJockeyId: registration.backupJockeyId || null,
  }),
});

export const updateRegistrationStatus = (id: string, status: string) =>
  request(`/api/registrations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ statusCode: status.toUpperCase() }),
  });

export const publishRace = (id: string) =>
  request(`/api/races/${id}/publish`, { method: "PATCH" });
