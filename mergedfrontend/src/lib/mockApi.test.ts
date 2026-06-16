import { describe, it, expect } from "vitest";
import {
  ApiError,
  saveRace,
  saveTournament,
  saveRegistration,
  saveInvitation,
  saveResult,
  saveAward,
  canPlaceBet,
  assertCanPlaceBet,
  canTransitionRace,
  transitionRace,
} from "./mockApi";

// ============================================================
// Race
// ============================================================
describe("saveRace", () => {
  const tournamentIds = ["T1", "T2"];
  const existing = [{ id: "R1" }, { id: "R2" }];

  it("returns input when valid", async () => {
    const out = await saveRace(
      { id: "R3", tournamentId: "T1" },
      { existing, tournamentIds }
    );
    expect(out.id).toBe("R3");
  });

  it("rejects missing id", async () => {
    await expect(
      saveRace({ id: "", tournamentId: "T1" }, { existing, tournamentIds })
    ).rejects.toMatchObject({
      name: "ApiError",
      fieldErrors: { id: expect.stringContaining("bắt buộc") },
    });
  });

  it("rejects duplicate id when creating", async () => {
    try {
      await saveRace({ id: "R1", tournamentId: "T1" }, { existing, tournamentIds });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).fieldErrors.id).toMatch(/đã tồn tại/);
      expect((e as ApiError).status).toBe(422);
    }
  });

  it("allows same id when editing", async () => {
    const out = await saveRace(
      { id: "R1", tournamentId: "T1" },
      { existing, tournamentIds, editingId: "R1" }
    );
    expect(out.id).toBe("R1");
  });

  it("rejects unknown tournamentId", async () => {
    await expect(
      saveRace({ id: "R9", tournamentId: "T99" }, { existing, tournamentIds })
    ).rejects.toMatchObject({
      fieldErrors: { tournamentId: expect.stringContaining("không tồn tại") },
    });
  });

  it("accumulates multiple field errors", async () => {
    try {
      await saveRace({ id: "", tournamentId: "" }, { existing, tournamentIds });
    } catch (e) {
      const err = e as ApiError;
      expect(Object.keys(err.fieldErrors).sort()).toEqual(["id", "tournamentId"]);
    }
  });
});

// ============================================================
// Tournament
// ============================================================
describe("saveTournament", () => {
  const existing = [{ id: "T1" }, { id: "T2" }];

  it("returns input when valid", async () => {
    const out = await saveTournament({ id: "T3" }, { existing });
    expect(out.id).toBe("T3");
  });

  it("rejects duplicate id when creating", async () => {
    await expect(saveTournament({ id: "T1" }, { existing })).rejects.toBeInstanceOf(ApiError);
  });

  it("allows duplicate id when editing same record", async () => {
    const out = await saveTournament({ id: "T1" }, { existing, editingId: "T1" });
    expect(out.id).toBe("T1");
  });

  it("rejects missing id", async () => {
    await expect(saveTournament({ id: "" }, { existing })).rejects.toMatchObject({
      fieldErrors: { id: expect.stringContaining("bắt buộc") },
    });
  });
});

// ============================================================
// Race state machine
// ============================================================
describe("Race state machine", () => {
  it("allows draft → open", () => {
    expect(canTransitionRace("draft", "open")).toBe(true);
    expect(transitionRace("draft", "open")).toBe("open");
  });

  it("blocks invalid jumps", () => {
    expect(canTransitionRace("draft", "ongoing")).toBe(false);
    expect(() => transitionRace("draft", "ongoing")).toThrow(ApiError);
  });

  it("blocks transitions from published (terminal)", () => {
    expect(canTransitionRace("published", "open")).toBe(false);
  });

  it("follows full happy path", () => {
    const path = ["draft", "open", "closed_registration", "ongoing", "finished", "published"] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransitionRace(path[i], path[i + 1])).toBe(true);
    }
  });
});

// ============================================================
// Registration
// ============================================================
describe("saveRegistration", () => {
  const base = {
    id: "REG1",
    raceId: "R1",
    horseId: "H1",
    ownerId: "O1",
  };

  it("accepts valid registration when race is open", async () => {
    const out = await saveRegistration(base, { existing: [], raceState: "open" });
    expect(out.id).toBe("REG1");
  });

  it("rejects when race is not open", async () => {
    await expect(
      saveRegistration(base, { existing: [], raceState: "ongoing" })
    ).rejects.toMatchObject({
      fieldErrors: { raceId: expect.stringContaining("không nhận đăng ký") },
    });
  });

  it("rejects duplicate horse in same race", async () => {
    await expect(
      saveRegistration(base, {
        existing: [{ id: "REG0", raceId: "R1", horseId: "H1", status: "approved" }],
        raceState: "open",
      })
    ).rejects.toMatchObject({
      fieldErrors: { horseId: expect.stringContaining("đã được đăng ký") },
    });
  });

  it("allows re-registration if previous was rejected", async () => {
    const out = await saveRegistration(base, {
      existing: [{ id: "REG0", raceId: "R1", horseId: "H1", status: "rejected" }],
      raceState: "open",
    });
    expect(out.id).toBe("REG1");
  });

  it("rejects missing required fields", async () => {
    try {
      await saveRegistration(
        { id: "", raceId: "", horseId: "", ownerId: "" },
        { existing: [], raceState: "open" }
      );
    } catch (e) {
      const err = e as ApiError;
      expect(Object.keys(err.fieldErrors).sort()).toEqual(
        ["horseId", "id", "ownerId", "raceId"]
      );
    }
  });
});

// ============================================================
// Invitation
// ============================================================
describe("saveInvitation", () => {
  const base = { id: "INV1", registrationId: "REG1", jockeyId: "J1" };

  it("accepts when registration is approved", async () => {
    const out = await saveInvitation(base, {
      existing: [],
      registration: { id: "REG1", status: "approved" },
    });
    expect(out.id).toBe("INV1");
  });

  it("rejects when registration is pending", async () => {
    await expect(
      saveInvitation(base, {
        existing: [],
        registration: { id: "REG1", status: "pending" },
      })
    ).rejects.toMatchObject({
      fieldErrors: { registrationId: expect.stringContaining("approved") },
    });
  });

  it("rejects when registration does not exist", async () => {
    await expect(
      saveInvitation(base, { existing: [], registration: undefined })
    ).rejects.toMatchObject({
      fieldErrors: { registrationId: expect.stringContaining("không tồn tại") },
    });
  });

  it("rejects duplicate invitation id", async () => {
    await expect(
      saveInvitation(base, {
        existing: [{ id: "INV1" }],
        registration: { id: "REG1", status: "approved" },
      })
    ).rejects.toMatchObject({
      fieldErrors: { id: expect.stringContaining("đã tồn tại") },
    });
  });
});

// ============================================================
// Result
// ============================================================
describe("saveResult", () => {
  const base = {
    id: "RES1",
    raceId: "R1",
    rankings: [
      { horseId: "H1", position: 1 },
      { horseId: "H2", position: 2 },
    ],
  };
  const ok = {
    raceState: "ongoing" as const,
    preRaceCheckPassed: true,
    approvedHorseIds: ["H1", "H2", "H3"],
  };

  it("accepts valid result", async () => {
    const out = await saveResult(base, ok);
    expect(out.rankings).toHaveLength(2);
  });

  it("rejects when race not started", async () => {
    await expect(
      saveResult(base, { ...ok, raceState: "open" })
    ).rejects.toMatchObject({
      fieldErrors: { raceId: expect.stringContaining("đang/đã diễn ra") },
    });
  });

  it("rejects when pre-race check not passed", async () => {
    await expect(
      saveResult(base, { ...ok, preRaceCheckPassed: false })
    ).rejects.toMatchObject({
      fieldErrors: { raceId: expect.stringContaining("Pre-race") },
    });
  });

  it("rejects duplicate positions", async () => {
    await expect(
      saveResult(
        {
          ...base,
          rankings: [
            { horseId: "H1", position: 1 },
            { horseId: "H2", position: 1 },
          ],
        },
        ok
      )
    ).rejects.toMatchObject({
      fieldErrors: { rankings: expect.stringContaining("trùng") },
    });
  });

  it("rejects unknown horse", async () => {
    await expect(
      saveResult(
        { ...base, rankings: [{ horseId: "H99", position: 1 }] },
        ok
      )
    ).rejects.toMatchObject({
      fieldErrors: { rankings: expect.stringContaining("approved") },
    });
  });
});

// ============================================================
// Award
// ============================================================
describe("saveAward", () => {
  const base = { id: "A1", raceId: "R1", first: 100, second: 50, third: 20 };

  it("returns total when valid", async () => {
    const out = await saveAward(base, { existing: [], raceIds: ["R1"] });
    expect(out.total).toBe(170);
  });

  it("rejects unknown race", async () => {
    await expect(
      saveAward(base, { existing: [], raceIds: ["R2"] })
    ).rejects.toMatchObject({
      fieldErrors: { raceId: expect.stringContaining("không tồn tại") },
    });
  });

  it("rejects negative prize", async () => {
    await expect(
      saveAward({ ...base, second: -1 }, { existing: [], raceIds: ["R1"] })
    ).rejects.toMatchObject({
      fieldErrors: { second: expect.stringContaining(">= 0") },
    });
  });

  it("rejects wrong prize ordering", async () => {
    await expect(
      saveAward(
        { ...base, first: 10, second: 50, third: 20 },
        { existing: [], raceIds: ["R1"] }
      )
    ).rejects.toMatchObject({
      fieldErrors: { first: expect.stringContaining("first >= second >= third") },
    });
  });

  it("rejects duplicate id when creating", async () => {
    await expect(
      saveAward(base, { existing: [{ id: "A1" }], raceIds: ["R1"] })
    ).rejects.toMatchObject({
      fieldErrors: { id: expect.stringContaining("đã tồn tại") },
    });
  });
});

// ============================================================
// Betting
// ============================================================
describe("canPlaceBet", () => {
  it("allows betting when race is open or closed_registration", () => {
    expect(canPlaceBet("open")).toBe(true);
    expect(canPlaceBet("closed_registration")).toBe(true);
  });

  it("blocks betting once race is ongoing or later", () => {
    expect(canPlaceBet("ongoing")).toBe(false);
    expect(canPlaceBet("finished")).toBe(false);
    expect(canPlaceBet("published")).toBe(false);
  });

  it("assertCanPlaceBet throws ApiError when blocked", () => {
    expect(() => assertCanPlaceBet("ongoing")).toThrow(ApiError);
  });
});

// ============================================================
// ApiError
// ============================================================
describe("ApiError", () => {
  it("defaults status to 400 and empty fieldErrors", () => {
    const e = new ApiError("oops");
    expect(e.status).toBe(400);
    expect(e.fieldErrors).toEqual({});
    expect(e.name).toBe("ApiError");
  });
});
