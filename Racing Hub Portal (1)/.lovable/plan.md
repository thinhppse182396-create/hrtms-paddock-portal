<!-- # Kế hoạch build HRTMS theo Research Report

Báo cáo định nghĩa lại domain model khá nhiều so với app hiện tại. Mình sẽ refactor mock data + UI để khớp, vẫn giữ frontend-only (localStorage, không backend).

## 1. Mock domain mới (`src/data/mockData.ts`)

**Track** (seed 3 cái, không CRUD trong SU26):
- A: 1.600m / 16m → maxLanes 10
- B: 1.200m / 20m → maxLanes 13
- C: 2.000m / 18m → maxLanes 12
- Mỗi track có `distances[]` (chute) — Race chọn từ dropdown

**Tournament**: `trackId`, `reservationStart/End` — validate không trùng track+thời gian, ownerAdminId

**Race**: thuộc tournament, `raceDate`, `distance` (lọc theo track), `laneCount ∈ [2, maxLanes]`, prize commitment (organizerAddedMoney, entryFeePerHorse, sponsorshipAmount), eligibility

**Round**: thuộc race, type Heat/Semi-Final/Final, startTime — validate ≥ 40 phút giữa các round

**RefereePanel**: 3 referee/race, 1 Lead + 2 Members, lưu signatures

**Constraints helpers**:
- Jockey: ≤3 ngựa/ngày, no time overlap (hard), <2h gap warn
- Horse: ≥6 ngày nghỉ (hard, no override)
- Đăng ký ≥5 ngày trước race day, swap jockey trong 48h = hard block

## 2. Prize pool model

```
guaranteedMinimum = organizerAddedMoney + sponsorshipAmount
                  + (confirmedRegistrations × entryFeePerHorse)
bettingContribution = totalHandle × 0.20 × 0.40
actualPrizePool   = MAX(guaranteedMinimum, bettingContribution)
```

Distribution: 60/20/10/5/3/2 % theo vị trí; mỗi vị trí chia 80% Owner / 10% Jockey / 10% Mgmt. DQ không redistribute.

## 3. Admin UI

- **Tracks** (read-only list) — `/admin/tracks`
- **Tournaments**: form thêm track + reservation window, validate overlap
- **Races**: chọn tournament → track auto, distance dropdown lọc theo track, laneCount slider [2..maxLanes], 3 trường organizer commitment
- **Rounds** manager trong race detail — thêm Heat/Semi/Final với check 40 phút
- **Referee Assignment**: filter eligible → chọn 3 → mark 1 Lead (warn nếu Junior)
- **Pending Approvals**: duyệt self-registration của Jockey/Referee
- **Result Review** (5 bước): completeness → consistency → violations → provisional flags → ranking confirm; show chuỗi thời gian 15min/2h/4h/24h
- **Prize Publication**: tính actualPrizePool, breakdown per position × stakeholder

## 4. Referee UI

- Lead nộp RefereeReport, 2 Members co-sign → report mới "signed"
- Pre-race check giữ flow loại đối tượng đã có
- Hard block UI cho license expired / suspended

## 5. Owner / Jockey

- Self-signup → Pending (Admin approve)
- Owner đăng ký race: check 5-day deadline, 6-day horse rest, jockey daily cap
- Jockey schedule: hiện constraint warnings

## 6. Spectator — 4 giai đoạn

Race detail page hiển thị theo `race.phase`:
- **Pre-race**: race card, countdown, live odds (mock tăng dần), guaranteed minimum, predict UI
- **In Progress**: timer, final odds locked, "đang chờ kết quả"
- **Provisional**: thứ tự tạm + violation flags, payout pending
- **Official**: kết quả + finish times + violation detail + prize breakdown + payout released

Predict giữ nguyên rule cũ (100% exact / 30% top3).

## 7. Race Simulation engine (`src/lib/raceSim.ts`)

`simulateRace(race, entries)` → `{ trajectoryData, resultData }`. Admin bấm "Run Simulation" trên race In Progress → inject như RefereeReport → downstream chạy bình thường. Trajectory chỉ release khi round chuyển sang In Progress (anti-cheat).

## 8. Phạm vi giữ nguyên / out-of-scope

Giữ: profile, auth localStorage, predict, audit log.
Out: Track Manager CRUD, document upload, email/license verification, Trainer role, real IoT.

## Files dự kiến

**Tạo mới**: `src/data/tracks.ts`, `src/lib/prizePool.ts`, `src/lib/constraints.ts`, `src/lib/raceSim.ts`, `src/routes/admin.tracks.tsx`, `src/routes/admin.pending-approvals.tsx`, `src/routes/admin.race.$raceId.tsx` (rounds + panel + review + simulate), `src/routes/spectator.race.$raceId.tsx` (4 phase view).

**Sửa**: `mockData.ts` (Track/Tournament/Race/Round/Panel + constraint funcs), `admin.tournaments.tsx` (reservation), `admin.races.tsx` (track/distance/lane/commitment), `admin.referees.tsx` → panel assignment, `admin.results.tsx` → 5-step review + chuỗi thời gian, `admin.awards.tsx` → actualPrizePool breakdown, `owner.race-registration.tsx` (deadline + rest check), `signup.tsx` (Pending state), `spectator.predictions.tsx` (link sang race detail mới), sidebar admin/spectator.

## Lưu ý

App khá lớn → mình sẽ ship theo thứ tự ưu tiên: (1) domain + tracks/tournament/race/round, (2) prize pool + review workflow, (3) spectator 4-phase + simulation, (4) constraints + pending approvals. Bạn duyệt plan thì mình bắt đầu từ (1). -->
