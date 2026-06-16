// ============================================================
// Mock domain data for Horse Racing Tournament Management System
// ============================================================

export interface RaceEligibility {
  minAge: number;
  maxAge: number;
  minWeight: number;
  maxWeight: number;
  allowedBreeds: string[];
  requiresValidHealthCert: boolean;
}

export interface RacePrize {
  rank: number;
  money: number;       // USD
  trophy: string;      // trophy / medal / item label
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
  status: "Scheduled" | "Ongoing" | "Completed" | "Finished" | "Published" | "Cancelled";
  raceState?: "draft" | "open" | "closed_registration" | "ongoing" | "finished" | "published";
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
  // Bio / racing-horse profile
  sire?: string;          // father
  dam?: string;           // mother
  color?: string;
  microchipId?: string;
  trainer?: string;
  bio?: string;
  documents: HorseDocument[];
}

export const tournaments = [
  { id: "T001", name: "Spring Classic 2026", season: "Spring", startDate: "2026-04-10", endDate: "2026-04-20", status: "Open" },
  { id: "T002", name: "Summer Grand Prix", season: "Summer", startDate: "2026-06-12", endDate: "2026-06-25", status: "Draft" },
  { id: "T003", name: "Autumn Cup", season: "Autumn", startDate: "2025-10-01", endDate: "2025-10-12", status: "Completed" },
  { id: "T004", name: "Winter Derby", season: "Winter", startDate: "2026-01-15", endDate: "2026-01-28", status: "Closed" },
];

export const races: Race[] = [
  {
    id: "R001", tournamentId: "T001", round: 1, date: "2026-04-10", time: "14:00",
    track: "Track A", distance: 1600, lanes: 8, status: "Scheduled", raceState: "open",
    eligibility: { minAge: 3, maxAge: 7, minWeight: 450, maxWeight: 510, allowedBreeds: ["Thoroughbred", "Arabian"], requiresValidHealthCert: true },
    prizes: [
      { rank: 1, money: 50000, trophy: "Spring Classic Gold Cup" },
      { rank: 2, money: 20000, trophy: "Silver Medal" },
      { rank: 3, money: 10000, trophy: "Bronze Medal" },
    ],
  },
  {
    id: "R002", tournamentId: "T001", round: 2, date: "2026-04-12", time: "15:30",
    track: "Track B", distance: 2000, lanes: 6, status: "Scheduled", raceState: "open",
    eligibility: { minAge: 4, maxAge: 8, minWeight: 460, maxWeight: 520, allowedBreeds: ["Thoroughbred", "Arabian", "Quarter Horse"], requiresValidHealthCert: true },
    prizes: [
      { rank: 1, money: 75000, trophy: "Endurance Trophy" },
      { rank: 2, money: 30000, trophy: "Silver Medal" },
      { rank: 3, money: 15000, trophy: "Bronze Medal" },
    ],
  },
  {
    id: "R003", tournamentId: "T003", round: 1, date: "2025-10-02", time: "10:00",
    track: "Track A", distance: 1200, lanes: 8, status: "Completed",
    eligibility: { minAge: 3, maxAge: 6, minWeight: 440, maxWeight: 500, allowedBreeds: ["Thoroughbred", "Arabian"], requiresValidHealthCert: true },
    prizes: [
      { rank: 1, money: 40000, trophy: "Autumn Cup" },
      { rank: 2, money: 15000, trophy: "Silver Medal" },
      { rank: 3, money: 7500, trophy: "Bronze Medal" },
    ],
  },
  {
    id: "R004", tournamentId: "T001", round: 3, date: "2026-04-15", time: "16:00",
    track: "Track C", distance: 2400, lanes: 10, status: "Ongoing",
    eligibility: { minAge: 4, maxAge: 9, minWeight: 470, maxWeight: 530, allowedBreeds: ["Thoroughbred"], requiresValidHealthCert: true },
    prizes: [
      { rank: 1, money: 100000, trophy: "Grand Champion Cup" },
      { rank: 2, money: 40000, trophy: "Silver Trophy" },
      { rank: 3, money: 20000, trophy: "Bronze Trophy" },
    ],
  },
];

export const horses: Horse[] = [
  {
    id: "H001", name: "Thunder Bolt", breed: "Thoroughbred", age: 5, weight: 480, ownerId: "O001",
    healthCertExpiry: "2026-12-01", status: "Eligible",
    sire: "Storm King", dam: "Lightning Mare", color: "Bay", microchipId: "MC-TB-001",
    trainer: "Coach Reynolds",
    bio: "A proven middle-distance racer with 14 career starts and 5 podium finishes. Specialises in 1400-1800m turf events.",
    documents: [
      { type: "Health Certificate", number: "HC-2025-0481", issuedBy: "National Equine Vet Board", issuedDate: "2025-12-01", expiryDate: "2026-12-01" },
      { type: "Registration Paper", number: "REG-TB-2021-228", issuedBy: "Jockey Club Registry", issuedDate: "2021-03-12" },
      { type: "Vaccination Record", number: "VC-2025-882", issuedBy: "National Equine Vet Board", issuedDate: "2025-09-10", expiryDate: "2026-09-10" },
      { type: "Pedigree", number: "PD-TB-001", issuedBy: "Thoroughbred Stud Book", issuedDate: "2021-03-12" },
    ],
  },
  {
    id: "H002", name: "Silver Arrow", breed: "Arabian", age: 4, weight: 460, ownerId: "O001",
    healthCertExpiry: "2026-08-15", status: "Eligible",
    sire: "Desert Wind", dam: "Silver Moon", color: "Grey", microchipId: "MC-SA-002",
    trainer: "Coach Reynolds",
    bio: "Up-and-coming Arabian racer known for explosive starts. 8 career starts, 2 wins.",
    documents: [
      { type: "Health Certificate", number: "HC-2025-0512", issuedBy: "National Equine Vet Board", issuedDate: "2025-08-15", expiryDate: "2026-08-15" },
      { type: "Registration Paper", number: "REG-AR-2022-104", issuedBy: "Jockey Club Registry", issuedDate: "2022-05-01" },
      { type: "Vaccination Record", number: "VC-2025-901", issuedBy: "National Equine Vet Board", issuedDate: "2025-09-12", expiryDate: "2026-09-12" },
    ],
  },
  {
    id: "H003", name: "Midnight Star", breed: "Quarter Horse", age: 6, weight: 500, ownerId: "O002",
    healthCertExpiry: "2025-11-01", status: "Ineligible",
    sire: "Night Runner", dam: "Star Dust", color: "Black", microchipId: "MC-MS-003",
    trainer: "Coach Diaz",
    bio: "Quarter Horse with strong short-distance record. Health certificate currently expired — pending renewal.",
    documents: [
      { type: "Health Certificate", number: "HC-2024-0192", issuedBy: "National Equine Vet Board", issuedDate: "2024-11-01", expiryDate: "2025-11-01" },
      { type: "Registration Paper", number: "REG-QH-2020-077", issuedBy: "Jockey Club Registry", issuedDate: "2020-04-22" },
    ],
  },
  {
    id: "H004", name: "Golden Mane", breed: "Thoroughbred", age: 7, weight: 510, ownerId: "O001",
    healthCertExpiry: "2026-05-20", status: "Suspended",
    sire: "Gold Standard", dam: "Mane Event", color: "Chestnut", microchipId: "MC-GM-004",
    trainer: "Coach Reynolds",
    bio: "Veteran racer currently suspended after a violation review.",
    documents: [
      { type: "Health Certificate", number: "HC-2025-0388", issuedBy: "National Equine Vet Board", issuedDate: "2025-05-20", expiryDate: "2026-05-20" },
      { type: "Registration Paper", number: "REG-TB-2019-301", issuedBy: "Jockey Club Registry", issuedDate: "2019-02-18" },
    ],
  },
  {
    id: "H005", name: "Royal Wind", breed: "Arabian", age: 5, weight: 470, ownerId: "O003",
    healthCertExpiry: "2027-01-10", status: "Eligible",
    sire: "Royal Stallion", dam: "Windrunner", color: "Bay", microchipId: "MC-RW-005",
    trainer: "Coach Patel",
    bio: "Consistent top-3 finisher in mid-distance Arabian races.",
    documents: [
      { type: "Health Certificate", number: "HC-2026-0011", issuedBy: "National Equine Vet Board", issuedDate: "2026-01-10", expiryDate: "2027-01-10" },
      { type: "Registration Paper", number: "REG-AR-2021-188", issuedBy: "Jockey Club Registry", issuedDate: "2021-06-14" },
      { type: "Insurance", number: "INS-2026-RW", issuedBy: "Equine Insurance Co.", issuedDate: "2026-01-15", expiryDate: "2027-01-15" },
    ],
  },
];

export const jockeys = [
  { id: "J001", name: "Smith Jockey", licenseNo: "JK-2024-001", weight: 56, ranking: 3, status: "Active" },
  { id: "J002", name: "Maria Lopez", licenseNo: "JK-2024-002", weight: 54, ranking: 1, status: "Active" },
  { id: "J003", name: "David Chen", licenseNo: "JK-2023-045", weight: 55, ranking: 7, status: "Active" },
  { id: "J004", name: "Anna Park", licenseNo: "JK-2024-010", weight: 53, ranking: 12, status: "Inactive" },
];

export const owners = [
  { id: "O001", name: "Wayne Owner", stable: "Wayne Stables", contact: "wayne@stables.com" },
  { id: "O002", name: "Helena Cross", stable: "Crossfield Ranch", contact: "helena@cross.com" },
  { id: "O003", name: "Marcus Reid", stable: "Reid Equestrian", contact: "marcus@reid.com" },
];

export const referees = [
  { id: "RF001", name: "Sarah Referee", licenseNo: "RF-2022-005", experience: "8 years", status: "Active" },
  { id: "RF002", name: "Tom Blake", licenseNo: "RF-2021-002", experience: "12 years", status: "Active" },
  { id: "RF003", name: "Priya Nair", licenseNo: "RF-2023-008", experience: "5 years", status: "Active" },
];

export const registrations = [
  { id: "RG001", raceId: "R001", horseId: "H001", jockeyId: "J001", ownerId: "O001", status: "Approved", submittedAt: "2026-03-20" },
  { id: "RG002", raceId: "R001", horseId: "H002", jockeyId: "J002", ownerId: "O001", status: "Pending", submittedAt: "2026-03-22" },
  { id: "RG003", raceId: "R002", horseId: "H005", jockeyId: "J003", ownerId: "O003", status: "Approved", submittedAt: "2026-03-21" },
  { id: "RG004", raceId: "R002", horseId: "H003", jockeyId: "J001", ownerId: "O002", status: "Rejected", submittedAt: "2026-03-19", reason: "Health certificate expired" },
  { id: "RG005", raceId: "R004", horseId: "H001", jockeyId: "J001", ownerId: "O001", status: "Pending", submittedAt: "2026-03-25" },
];

export const refereeAssignments = [
  { raceId: "R001", refereeId: "RF001" },
  { raceId: "R002", refereeId: "RF001" },
  { raceId: "R003", refereeId: "RF002" },
  { raceId: "R004", refereeId: "RF001" },
];

export const refereeReports = [
  { id: "RR001", raceId: "R003", refereeId: "RF002", status: "Confirmed", notes: "Race completed without incident" },
  { id: "RR002", raceId: "R001", refereeId: "RF001", status: "Draft", notes: "" },
];

export const violations = [
  { id: "V001", raceId: "R003", horseId: "H001", jockeyId: "J001", type: "Overuse of Whip", severity: "Minor", description: "Used whip more than allowed in final stretch" },
  { id: "V002", raceId: "R003", horseId: "H005", jockeyId: "J003", type: "Lane Interference", severity: "Major", description: "Crossed into lane 4 affecting another horse" },
];

export const raceResults = [
  { raceId: "R003", horseId: "H001", jockeyId: "J001", finishTime: "1:22.34", rank: 1, disqualified: false, published: true },
  { raceId: "R003", horseId: "H005", jockeyId: "J003", finishTime: "1:23.10", rank: 2, disqualified: false, published: true },
  { raceId: "R003", horseId: "H002", jockeyId: "J002", finishTime: "1:23.88", rank: 3, disqualified: false, published: true },
];

export const jockeyInvitations = [
  { id: "INV001", jockeyId: "J001", ownerId: "O001", horseId: "H001", raceId: "R001", status: "Accepted", sentAt: "2026-03-18", note: "Please ride Thunder Bolt — strong middle-distance form." },
  { id: "INV002", jockeyId: "J001", ownerId: "O002", horseId: "H003", raceId: "R002", status: "Waiting", sentAt: "2026-03-24", note: "Looking for experienced jockey for endurance race." },
  { id: "INV003", jockeyId: "J001", ownerId: "O003", horseId: "H005", raceId: "R004", status: "Waiting", sentAt: "2026-03-25", note: "Top-3 finisher; targeting podium." },
  { id: "INV004", jockeyId: "J002", ownerId: "O001", horseId: "H002", raceId: "R001", status: "Accepted", sentAt: "2026-03-19", note: "Silver Arrow needs your explosive start." },
];

// Award ceremonies — derived/curated from results + race prizes
export interface AwardCeremony {
  raceId: string;
  scheduledAt: string;
  status: "Scheduled" | "Held" | "Cancelled";
  venue: string;
  notes?: string;
}

export const awardCeremonies: AwardCeremony[] = [
  { raceId: "R003", scheduledAt: "2025-10-03 18:00", status: "Held", venue: "Autumn Cup Pavilion", notes: "Trophy and prize money awarded to top 3." },
  { raceId: "R001", scheduledAt: "2026-04-10 19:00", status: "Scheduled", venue: "Spring Classic Grand Hall" },
  { raceId: "R002", scheduledAt: "2026-04-12 20:00", status: "Scheduled", venue: "Spring Classic Grand Hall" },
];

export const systemUsers = [
  { id: "U001", username: "admin_super", name: "System Admin", role: "ADMIN", status: "Active" },
  { id: "U002", username: "ref_sarah", name: "Sarah Referee", role: "REFEREE", status: "Active" },
  { id: "U003", username: "owner_wayne", name: "Wayne Owner", role: "OWNER", status: "Active" },
  { id: "U004", username: "jockey_smith", name: "Smith Jockey", role: "JOCKEY", status: "Active" },
  { id: "U005", username: "ref_tom", name: "Tom Blake", role: "REFEREE", status: "Active" },
  { id: "U006", username: "owner_helena", name: "Helena Cross", role: "OWNER", status: "Locked" },
  { id: "U007", username: "fan_alex", name: "Alex Spectator", role: "SPECTATOR", status: "Active" },
];

export const getTournament = (id: string) => tournaments.find(t => t.id === id);
export const getRace = (id: string) => races.find(r => r.id === id);
export const getHorse = (id: string) => horses.find(h => h.id === id);
export const getJockey = (id: string) => jockeys.find(j => j.id === id);
export const getOwner = (id: string) => owners.find(o => o.id === id);
export const getReferee = (id: string) => referees.find(r => r.id === id);
export const getCeremony = (raceId: string) => awardCeremonies.find(c => c.raceId === raceId);

// Eligibility helpers
export function isHorseEligibleForRace(horse: Horse, race: Race): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const e = race.eligibility;
  if (horse.status !== "Eligible") reasons.push(`Horse status is ${horse.status}`);
  if (horse.age < e.minAge || horse.age > e.maxAge) reasons.push(`Age ${horse.age} outside ${e.minAge}-${e.maxAge}`);
  if (horse.weight < e.minWeight || horse.weight > e.maxWeight) reasons.push(`Weight ${horse.weight}kg outside ${e.minWeight}-${e.maxWeight}kg`);
  if (!e.allowedBreeds.includes(horse.breed)) reasons.push(`Breed ${horse.breed} not allowed`);
  if (e.requiresValidHealthCert && new Date(horse.healthCertExpiry) < new Date()) reasons.push("Health certificate expired");
  return { ok: reasons.length === 0, reasons };
}