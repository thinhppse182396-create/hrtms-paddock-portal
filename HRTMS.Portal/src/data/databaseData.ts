import { request } from "@/lib/backendApi";

export interface RaceEligibility {
  minAge: number;
  maxAge: number;
  minWeight: number;
  maxWeight: number;
  allowedBreeds: string[];
  requiresValidHealthCert: boolean;
}

export interface RacePrize {
  backendId?: number;
  rank: number;
  money: number;
  trophy: string;
}

export interface Race {
  id: string;
  tournamentId: string;
  round: number;
  date: string;
  time: string;
  track: string;
  distance: number;
  lanes: number;
  status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";
  eligibility: RaceEligibility;
  prizes: RacePrize[];
}

export interface HorseDocument {
  type: "Health Certificate" | "Registration Paper" | "Vaccination Record" | "Pedigree" | "Insurance";
  number: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  fileUrl?: string;
}

export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  ownerId: string;
  healthCertExpiry: string;
  status: "Eligible" | "Ineligible" | "Suspended";
  sire?: string;
  dam?: string;
  color?: string;
  microchipId?: string;
  trainer?: string;
  bio?: string;
  documents: HorseDocument[];
}

export interface AwardCeremony {
  raceId: string;
  scheduledAt: string;
  status: "Scheduled" | "Held" | "Cancelled";
  venue: string;
  notes?: string;
}

export interface DatabaseTrack {
  id: string;
  name: string;
  lengthMeters: number;
  widthMeters: number;
  distances: Array<{ meters: number; chuteLabel: string }>;
}

export interface DatabaseRound {
  id: string;
  backendId?: number;
  raceId: string;
  type: "Heat" | "Semi-Final" | "Final";
  startTime: string;
  status: "Scheduled" | "InProgress" | "Provisional" | "Official" | "Cancelled";
}

export interface DatabasePanel {
  backendId?: string;
  raceId: string;
  members: Array<{
    refereeId: string;
    role: "Lead" | "Member";
    signed: boolean;
    signedAt?: string;
  }>;
}

interface PortalData {
  tracks: typeof tracks;
  tournaments: typeof tournaments;
  races: typeof races;
  horses: typeof horses;
  jockeys: typeof jockeys;
  owners: typeof owners;
  referees: typeof referees;
  registrations: typeof registrations;
  refereeAssignments: typeof refereeAssignments;
  refereePanels: typeof refereePanels;
  rounds: typeof rounds;
  raceResults: typeof raceResults;
  jockeyInvitations: typeof jockeyInvitations;
  violations: typeof violations;
  refereeReports: typeof refereeReports;
  awardCeremonies: typeof awardCeremonies;
  systemUsers: typeof systemUsers;
  predictions: typeof predictions;
}

export const tracks: DatabaseTrack[] = [];
export const tournaments: Array<{ id: string; name: string; season: string; trackId: string; startDate: string; endDate: string; status: string }> = [];
export const races: Race[] = [];
export const horses: Horse[] = [];
export const jockeys: Array<{ id: string; accountId: string; name: string; licenseNo: string; weight: number; ranking: number; status: string; contact?: string }> = [];
export const owners: Array<{ id: string; name: string; stable: string; contact: string }> = [];
export const referees: Array<{ id: string; accountId: string; name: string; licenseNo: string; experience: string; status: string }> = [];
export const registrations: Array<{ id: string; raceId: string; horseId: string; jockeyId: string; backupJockeyId?: string; ownerId: string; status: string; submittedAt: string; reason?: string }> = [];
export const refereeAssignments: Array<{ raceId: string; refereeId: string }> = [];
export const refereePanels: DatabasePanel[] = [];
export const rounds: DatabaseRound[] = [];
export const refereeReports: Array<{ id: string; raceId: string; refereeId: string; status: string; notes: string }> = [];
export const violations: Array<{ id: string; raceId: string; horseId: string; jockeyId: string; type: string; severity: string; description: string }> = [];
export const raceResults: Array<{ backendId?: number; raceId: string; horseId: string; jockeyId: string; finishTime: string; rank: number; disqualified: boolean; published: boolean }> = [];
export const jockeyInvitations: Array<{ id: string; backendId?: number; registrationId?: string; jockeyId: string; ownerId: string; horseId: string; raceId: string; status: string; sentAt: string; note?: string }> = [];
export const awardCeremonies: AwardCeremony[] = [];
export const systemUsers: Array<{ id: string; username: string; name: string; role: string; status: string }> = [];
export const predictions: Array<{ id: string; backendId: number; accountId: string; raceId: string; horseId: string; predictedRank: number; status: "Pending" | "Won" | "Lost"; payout: number; createdAt: string }> = [];

const replace = <T,>(target: T[], source: T[]) => {
  target.splice(0, target.length, ...source);
};

export async function loadDatabaseData() {
  const payload = await request<PortalData>("/api/portal-data");
  replace(tracks, payload.tracks);
  replace(tournaments, payload.tournaments);
  replace(races, payload.races);
  replace(horses, payload.horses);
  replace(jockeys, payload.jockeys);
  replace(owners, payload.owners);
  replace(referees, payload.referees);
  replace(registrations, payload.registrations);
  replace(refereeAssignments, payload.refereeAssignments);
  replace(refereePanels, payload.refereePanels);
  replace(rounds, payload.rounds);
  replace(raceResults, payload.raceResults);
  replace(jockeyInvitations, payload.jockeyInvitations);
  replace(violations, payload.violations);
  replace(refereeReports, payload.refereeReports);
  replace(awardCeremonies, payload.awardCeremonies);
  replace(systemUsers, payload.systemUsers);
  replace(predictions, payload.predictions);
  window.dispatchEvent(new Event("hrtms:database-data"));
}

export const getTournament = (id: string) => tournaments.find(item => item.id === id);
export const getRace = (id: string) => races.find(item => item.id === id);
export const getHorse = (id: string) => horses.find(item => item.id === id);
export const getJockey = (id: string) => jockeys.find(item => item.id === id);
export const getOwner = (id: string) => owners.find(item => item.id === id);
export const getReferee = (id: string) => referees.find(item => item.id === id);
export const getCeremony = (raceId: string) => awardCeremonies.find(item => item.raceId === raceId);

export function isHorseEligibleForRace(horse: Horse, race: Race): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const eligibility = race.eligibility;
  if (horse.status !== "Eligible") reasons.push(`Horse status is ${horse.status}`);
  if (horse.age < eligibility.minAge || horse.age > eligibility.maxAge) reasons.push(`Age ${horse.age} outside ${eligibility.minAge}-${eligibility.maxAge}`);
  if (horse.weight < eligibility.minWeight || horse.weight > eligibility.maxWeight) reasons.push(`Weight ${horse.weight}kg outside ${eligibility.minWeight}-${eligibility.maxWeight}kg`);
  if (eligibility.allowedBreeds.length > 0 && !eligibility.allowedBreeds.includes(horse.breed)) reasons.push(`Breed ${horse.breed} not allowed`);
  if (eligibility.requiresValidHealthCert && horse.healthCertExpiry < race.date) reasons.push("Health certificate expires before race day");
  return { ok: reasons.length === 0, reasons };
}
