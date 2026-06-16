import { describe, it, expect } from "vitest";
import {
  isValidRaceId,
  isValidTime24h,
  isValidDate,
  parseBreeds,
  findDuplicateBreeds,
  isDateInWindow,
  isTournamentWindowValid,
  findSlotConflict,
  validateRangeErrors,
} from "./validators";

describe("isValidRaceId", () => {
  it.each(["R001", "R123", "R9999"])("accepts %s", id => {
    expect(isValidRaceId(id)).toBe(true);
  });
  it.each(["r001", "R01", "RACE001", "001", "", "R 001"])("rejects %s", id => {
    expect(isValidRaceId(id)).toBe(false);
  });
});

describe("isValidTime24h", () => {
  it.each(["00:00", "09:30", "14:00", "23:59"])("accepts %s", t => {
    expect(isValidTime24h(t)).toBe(true);
  });
  it.each(["24:00", "9:30", "12:60", "1430", "14:0", "", "ab:cd"])("rejects %s", t => {
    expect(isValidTime24h(t)).toBe(false);
  });
});

describe("isValidDate", () => {
  it.each(["2026-01-01", "2026-12-31"])("accepts %s", d => {
    expect(isValidDate(d)).toBe(true);
  });
  it.each(["2026-1-1", "26-01-01", "2026/01/01", "", "today"])("rejects %s", d => {
    expect(isValidDate(d)).toBe(false);
  });
});

describe("parseBreeds", () => {
  it("splits, trims and removes empties", () => {
    expect(parseBreeds(" Thoroughbred ,Arabian,,  Quarter ")).toEqual([
      "Thoroughbred",
      "Arabian",
      "Quarter",
    ]);
  });
  it("returns empty array for empty input", () => {
    expect(parseBreeds("")).toEqual([]);
    expect(parseBreeds("   ,, ,")).toEqual([]);
  });
});

describe("findDuplicateBreeds", () => {
  it("returns [] when unique", () => {
    expect(findDuplicateBreeds("Thoroughbred, Arabian")).toEqual([]);
  });
  it("detects exact duplicates", () => {
    expect(findDuplicateBreeds("Arabian, Arabian")).toEqual(["Arabian"]);
  });
  it("detects case-insensitive duplicates and preserves original casing", () => {
    expect(findDuplicateBreeds("Thoroughbred, thoroughbred")).toEqual(["thoroughbred"]);
  });
  it("handles multiple duplicate groups", () => {
    expect(findDuplicateBreeds("A, B, a, c, B")).toEqual(["a", "B"]);
  });
});

describe("isDateInWindow", () => {
  const w = { startDate: "2026-04-01", endDate: "2026-04-30" };
  it("includes boundary dates", () => {
    expect(isDateInWindow("2026-04-01", w)).toBe(true);
    expect(isDateInWindow("2026-04-30", w)).toBe(true);
  });
  it("excludes outside dates", () => {
    expect(isDateInWindow("2026-03-31", w)).toBe(false);
    expect(isDateInWindow("2026-05-01", w)).toBe(false);
  });
});

describe("isTournamentWindowValid", () => {
  it("accepts same-day window", () => {
    expect(isTournamentWindowValid("2026-04-10", "2026-04-10")).toBe(true);
  });
  it("accepts start before end", () => {
    expect(isTournamentWindowValid("2026-04-01", "2026-04-30")).toBe(true);
  });
  it("rejects start after end", () => {
    expect(isTournamentWindowValid("2026-05-01", "2026-04-01")).toBe(false);
  });
  it("rejects missing dates", () => {
    expect(isTournamentWindowValid("", "2026-04-30")).toBe(false);
    expect(isTournamentWindowValid("2026-04-01", "")).toBe(false);
  });
});

describe("findSlotConflict", () => {
  const rows = [
    { id: "R001", tournamentId: "T1", date: "2026-04-10", time: "09:30" },
    { id: "R002", tournamentId: "T1", date: "2026-04-10", time: "14:00" },
    { id: "R003", tournamentId: "T2", date: "2026-04-10", time: "09:30" },
  ];

  it("returns conflict when same tournament + date + time", () => {
    const c = findSlotConflict(rows, {
      id: "NEW", tournamentId: "T1", date: "2026-04-10", time: "09:30",
    });
    expect(c?.id).toBe("R001");
  });

  it("returns null when different tournament", () => {
    expect(
      findSlotConflict(rows, { id: "NEW", tournamentId: "T9", date: "2026-04-10", time: "09:30" })
    ).toBeNull();
  });

  it("returns null when different time", () => {
    expect(
      findSlotConflict(rows, { id: "NEW", tournamentId: "T1", date: "2026-04-10", time: "10:00" })
    ).toBeNull();
  });

  it("ignores the row currently being edited", () => {
    const c = findSlotConflict(
      rows,
      { id: "R001", tournamentId: "T1", date: "2026-04-10", time: "09:30" },
      "R001"
    );
    expect(c).toBeNull();
  });
});

describe("validateRangeErrors", () => {
  it("returns no errors for empty input", () => {
    expect(validateRangeErrors({})).toEqual({});
  });

  it("flags negative values", () => {
    const e = validateRangeErrors({ minAge: -1, maxAge: 5, minWeight: -3, maxWeight: 500 });
    expect(e.minAge).toMatch(/negative/);
    expect(e.minWeight).toMatch(/negative/);
    const e2 = validateRangeErrors({ maxAge: -2, maxWeight: -4 });
    expect(e2.maxAge).toMatch(/negative/);
    expect(e2.maxWeight).toMatch(/negative/);
  });


  it("flags min > max for age", () => {
    const e = validateRangeErrors({ minAge: 10, maxAge: 5 });
    expect(e.maxAge).toMatch(/≥ min age/);
  });

  it("flags min > max for weight", () => {
    const e = validateRangeErrors({ minWeight: 600, maxWeight: 500 });
    expect(e.maxWeight).toMatch(/≥ min weight/);
  });

  it("accepts valid ranges", () => {
    expect(validateRangeErrors({ minAge: 3, maxAge: 8, minWeight: 400, maxWeight: 600 })).toEqual({});
  });

  it("accepts coerced numeric strings", () => {
    expect(validateRangeErrors({ minAge: "3", maxAge: "8" })).toEqual({});
  });
});
