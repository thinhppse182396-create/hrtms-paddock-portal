// Lightweight in-memory audit log with pub-sub for UI subscriptions.
import { useEffect, useState } from "react";
import { toLocalDateTimeString } from "./dateTime";

export interface AuditEntry {
  id: string;
  at: string;          // ISO timestamp
  actor: string;       // user name / role
  action: string;      // e.g. "PUBLISH_RESULT"
  target: string;      // entity id / label
  details?: string;
}

const seed: AuditEntry[] = [
  { id: "A001", at: "2026-03-25 09:12", actor: "System Admin", action: "CREATE_RACE", target: "R004", details: "Track C • 2400m" },
  { id: "A002", at: "2026-03-25 10:00", actor: "Sarah Referee", action: "SUBMIT_REPORT", target: "R003", details: "Status: Confirmed" },
  { id: "A003", at: "2026-03-25 10:05", actor: "System Admin", action: "PUBLISH_RESULT", target: "R003" },
  { id: "A004", at: "2026-03-25 11:22", actor: "Wayne Owner", action: "REGISTER_HORSE", target: "RG005", details: "Thunder Bolt → R004" },
];

let entries: AuditEntry[] = [...seed];
const listeners = new Set<() => void>();

export const auditLog = {
  list: () => entries,
  add(entry: Omit<AuditEntry, "id" | "at">) {
    const e: AuditEntry = {
      ...entry,
      id: `A${String(entries.length + 1).padStart(3, "0")}`,
      at: toLocalDateTimeString(),
    };
    entries = [e, ...entries];
    listeners.forEach(fn => fn());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

export function useAuditLog() {
  const [, force] = useState(0);
  useEffect(() => auditLog.subscribe(() => force(n => n + 1)), []);
  return auditLog.list();
}
