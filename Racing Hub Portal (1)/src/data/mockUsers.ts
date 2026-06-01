export type Role = "ADMIN" | "REFEREE" | "OWNER" | "JOCKEY" | "SPECTATOR";

export interface MockUser {
  username: string;
  password: string;
  role: Role;
  name: string;
}

export const mockUsers: MockUser[] = [
  { username: "admin_super", password: "admin123", role: "ADMIN", name: "System Admin" },
  { username: "ref_sarah", password: "referee123", role: "REFEREE", name: "Sarah Referee" },
  { username: "owner_wayne", password: "owner123", role: "OWNER", name: "Wayne Owner" },
  { username: "jockey_smith", password: "jockey123", role: "JOCKEY", name: "Smith Jockey" },
  { username: "fan_alex", password: "spectator123", role: "SPECTATOR", name: "Alex Spectator" },
];
