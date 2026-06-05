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

function resolveApiUrl() {
  const configuredUrl = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  if (!configuredUrl || typeof window === "undefined") return configuredUrl;

  try {
    const api = new URL(configuredUrl);
    const currentHost = window.location.hostname;
    const isLocalApiHost = api.hostname === "localhost" || api.hostname === "127.0.0.1";
    const isLocalPageHost = currentHost === "localhost" || currentHost === "127.0.0.1";

    if (isLocalApiHost && !isLocalPageHost) {
      api.hostname = currentHost;
      return api.toString().replace(/\/+$/, "");
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
}

const apiUrl = resolveApiUrl();

export const isBackendEnabled = () => apiUrl.length > 0;

export async function request<T>(path: string, init?: RequestInit, refreshDatabase = true): Promise<T> {
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

  if (response.status === 204) {
    if (refreshDatabase && init?.method && init.method !== "GET") {
      window.dispatchEvent(new Event("hrtms:database-changed"));
    }
    return undefined as T;
  }

  const payload = await response.json() as T;
  if (refreshDatabase && init?.method && init.method !== "GET") {
    window.dispatchEvent(new Event("hrtms:database-changed"));
  }
  return payload;
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

export const registerSpectatorWithBackend = (username: string, password: string, fullName: string) =>
  request<BackendLoginResponse>("/api/register/spectator", {
    method: "POST",
    body: JSON.stringify({ username, password, fullName }),
  });

export const changePasswordWithBackend = (username: string, currentPassword: string, newPassword: string) =>
  request<void>("/api/password", {
    method: "PATCH",
    body: JSON.stringify({ username, currentPassword, newPassword }),
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
  date: string;
  time: string;
  track: string;
  distance: number;
  lanes: number;
  status: string;
  round: number;
  eligibility: {
    minAge: number;
    maxAge: number;
    minWeight: number;
    maxWeight: number;
    allowedBreeds: string[];
    requiresValidHealthCert: boolean;
  };
}, editing: boolean) {
  await request(`/api/races${editing ? `/${race.id}` : ""}`, {
    method: editing ? "PUT" : "POST",
    body: JSON.stringify({
      raceId: race.id,
      tournamentId: race.tournamentId,
      raceName: `${race.id} - ${race.track}`,
      scheduledAt: `${race.date}T${race.time}:00`,
      distance: String(race.distance),
      lanes: race.lanes,
      statusCode: RACE_STATUS[race.status] ?? race.status,
      roundNumber: race.round,
      minAge: race.eligibility.minAge,
      maxAge: race.eligibility.maxAge,
      minWeight: race.eligibility.minWeight,
      maxWeight: race.eligibility.maxWeight,
      allowedBreeds: race.eligibility.allowedBreeds.join(","),
      requiresValidHealthCert: race.eligibility.requiresValidHealthCert,
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

export const updateRegistrationJockey = (id: string, jockeyId: string, backupJockeyId?: string) =>
  request(`/api/registrations/${id}/jockey`, {
    method: "PATCH",
    body: JSON.stringify({ jockeyId, backupJockeyId: backupJockeyId || null }),
  });

export const deleteRegistration = (id: string) =>
  request<void>(`/api/registrations/${id}`, { method: "DELETE" });

export const publishRace = (id: string) =>
  request(`/api/races/${id}/publish`, { method: "PATCH" });

export interface BackendRoundResponse {
  roundId: number;
  raceId: string;
  roundName: string;
  startTime: string;
}

export const syncRound = (round: {
  backendId?: number;
  raceId: string;
  type: string;
  startTime: string;
}, raceDate: string) => request<BackendRoundResponse>(`/api/rounds${round.backendId ? `/${round.backendId}` : ""}`, {
  method: round.backendId ? "PUT" : "POST",
  body: JSON.stringify({
    raceId: round.raceId,
    roundName: round.type,
    startTime: `${raceDate}T${round.startTime}:00`,
  }),
});

export const deleteRound = (backendId: number) =>
  request<void>(`/api/rounds/${backendId}`, { method: "DELETE" });

export const syncRefereePanel = (panel: {
  backendId?: string;
  raceId: string;
  members: Array<{ refereeId: string; role: "Lead" | "Member" }>;
}) => {
  const lead = panel.members.find(member => member.role === "Lead");
  const members = panel.members.filter(member => member.role === "Member");
  const body = {
    raceId: panel.raceId,
    leadId: lead?.refereeId,
    member1Id: members[0]?.refereeId,
    member2Id: members[1]?.refereeId,
  };

  return request(`/api/referee-panels${panel.backendId ? `/${panel.backendId}` : ""}`, {
    method: panel.backendId ? "PUT" : "POST",
    body: JSON.stringify(panel.backendId ? body : {
      refereePanelId: `RP-${panel.raceId}`,
      ...body,
    }),
  });
};

export const getPreRaceCheck = async <T,>(raceId: string): Promise<T | null> => {
  try {
    return await request<T>(`/api/pre-race-checks/${raceId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const savePreRaceCheck = <T,>(raceId: string, data: T) =>
  request<void>(`/api/pre-race-checks/${raceId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, false);

export const getRaceControlState = async <T,>(raceId: string): Promise<T | null> => {
  try {
    return await request<T>(`/api/race-control/${raceId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const saveRaceControlState = <T,>(raceId: string, data: T) =>
  request<void>(`/api/race-control/${raceId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, false);

export const createPrediction = (prediction: {
  accountId: string;
  raceId: string;
  horseId: string;
  predictedRank: number;
}) => request("/api/predictions", {
  method: "POST",
  body: JSON.stringify(prediction),
});

export const updateJockeyProfile = (jockeyId: string, profile: { weight: number; contact: string }) =>
  request<void>(`/api/jockeys/${jockeyId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });

export const syncHorse = (horse: {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  ownerId: string;
  documents: Array<{ number: string }>;
  healthCertExpiry: string;
  status: string;
}, editing = false) => request(`/api/horses${editing ? `/${horse.id}` : ""}`, {
  method: editing ? "PUT" : "POST",
  body: JSON.stringify({
    horseId: horse.id,
    horseName: horse.name,
    breed: horse.breed,
    age: horse.age,
    weight: horse.weight,
    ownerId: horse.ownerId,
    documents: horse.documents.map(document => document.number).join(",") || `HC-${horse.id}`,
    healthCertExpiry: horse.healthCertExpiry,
    statusCode: horse.status === "Ineligible" ? "INJURED" : horse.status.toUpperCase(),
  }),
});

export const deleteHorse = (id: string) =>
  request<void>(`/api/horses/${id}`, { method: "DELETE" });

export const syncViolation = (violation: {
  id: string;
  raceId: string;
  horseId: string;
  jockeyId: string;
  type: string;
  severity: string;
  description: string;
}, editing = false) => request(`/api/violations${editing ? `/${violation.id}` : ""}`, {
  method: editing ? "PUT" : "POST",
  body: JSON.stringify(violation),
});

export const deleteViolation = (id: string) =>
  request<void>(`/api/violations/${id}`, { method: "DELETE" });

export const syncRefereeReport = (report: {
  id: string;
  raceId: string;
  refereeId: string;
  status: string;
  notes: string;
}) => request(`/api/referee-reports/${report.id}`, {
  method: "PUT",
  body: JSON.stringify(report),
});

export const syncAwardCeremony = (ceremony: {
  raceId: string;
  scheduledAt: string;
  status: string;
  venue: string;
  notes?: string;
}, editing = false) => request(`/api/award-ceremonies${editing ? `/${ceremony.raceId}` : ""}`, {
  method: editing ? "PUT" : "POST",
  body: JSON.stringify(ceremony),
});

export const deleteAwardCeremony = (raceId: string) =>
  request<void>(`/api/award-ceremonies/${raceId}`, { method: "DELETE" });

export const syncAward = (raceId: string, rank: number, money: number, backendId?: number) =>
  request(`/api/awards${backendId ? `/${backendId}` : ""}`, {
    method: backendId ? "PUT" : "POST",
    body: JSON.stringify(backendId ? { priceMoney: money } : { raceId, rank, priceMoney: money }),
  });

export const syncRaceResult = (result: {
  backendId?: number;
  raceId: string;
  horseId: string;
  jockeyId: string;
  rank: number;
  finishTime: string;
  disqualified: boolean;
  published: boolean;
}) => request(`/api/race-results${result.backendId ? `/${result.backendId}` : ""}`, {
  method: result.backendId ? "PUT" : "POST",
  body: JSON.stringify(result),
});

export const deleteRaceResult = (backendId: number) =>
  request<void>(`/api/race-results/${backendId}`, { method: "DELETE" });

export const createJockeyInvitations = (registrationId: string) =>
  request("/api/jockey-invitations", {
    method: "POST",
    body: JSON.stringify({ registrationId }),
  });

export const acceptJockeyInvitation = (backendId: number) =>
  request(`/api/jockey-invitations/${backendId}/accept`, { method: "PATCH" });

const USER_ROLE: Record<string, string> = { OWNER: "HORSE_OWNER" };

export const syncUser = (user: {
  id?: string;
  username: string;
  password?: string;
  name: string;
  role: string;
  status: string;
}, editing = false) => request(`/api/users${editing ? `/${user.id}` : ""}`, {
  method: editing ? "PUT" : "POST",
  body: JSON.stringify(editing ? {
    fullName: user.name,
    roleCode: USER_ROLE[user.role] ?? user.role,
    statusCode: user.status.toUpperCase(),
  } : {
    username: user.username,
    password: user.password,
    fullName: user.name,
    roleCode: USER_ROLE[user.role] ?? user.role,
  }),
});

export const updateUserStatus = (id: string, status: string) =>
  request(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ statusCode: status.toUpperCase() }),
  });

export const resetUserPassword = (id: string, adminAccountId: string, adminPassword: string, newPassword: string) =>
  request<void>(`/api/users/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify({ adminAccountId, adminPassword, newPassword }),
  });

export const deleteUser = (id: string) =>
  request<void>(`/api/users/${id}`, { method: "DELETE" });

export const syncReferee = (referee: {
  id: string;
  accountId: string;
  name: string;
  licenseNo: string;
}, editing = false) => request(`/api/referees${editing ? `/${referee.id}` : ""}`, {
  method: editing ? "PUT" : "POST",
  body: JSON.stringify({
    refereeId: referee.id,
    accountId: referee.accountId,
    name: referee.name,
    licenseNo: referee.licenseNo,
  }),
});

export const deleteReferee = (id: string) =>
  request<void>(`/api/referees/${id}`, { method: "DELETE" });
