import { describe, it, expect } from "vitest";
import { auditLog } from "./auditLog";

describe("auditLog", () => {
  it("seeds with initial entries", () => {
    expect(auditLog.list().length).toBeGreaterThan(0);
  });

  it("prepends new entries with generated id + timestamp", () => {
    const before = auditLog.list().length;
    auditLog.add({ actor: "Tester", action: "UNIT_TEST", target: "X1", details: "hello" });
    const after = auditLog.list();
    expect(after.length).toBe(before + 1);
    expect(after[0]).toMatchObject({ actor: "Tester", action: "UNIT_TEST", target: "X1" });
    expect(after[0].id).toMatch(/^A\d{3,}$/);
    expect(after[0].at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it("notifies subscribers on add and unsubscribes cleanly", () => {
    let calls = 0;
    const unsubscribe = auditLog.subscribe(() => { calls += 1; });
    auditLog.add({ actor: "Tester", action: "EVT_1", target: "Y" });
    auditLog.add({ actor: "Tester", action: "EVT_2", target: "Y" });
    expect(calls).toBe(2);
    unsubscribe();
    auditLog.add({ actor: "Tester", action: "EVT_3", target: "Y" });
    expect(calls).toBe(2);
  });

  it("assigns unique ids across multiple adds", () => {
    auditLog.add({ actor: "Tester", action: "U1", target: "Z" });
    auditLog.add({ actor: "Tester", action: "U2", target: "Z" });
    const ids = auditLog.list().slice(0, 2).map(e => e.id);
    expect(new Set(ids).size).toBe(2);
  });
});
