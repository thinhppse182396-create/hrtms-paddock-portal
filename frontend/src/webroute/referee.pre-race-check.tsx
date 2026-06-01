// src/routes/referee/pre-race-check.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { CheckCircle, RotateCcw } from "lucide-react";
import {
  races, registrations,
  getRace, getHorse, getJockey,
} from "@/data/mockData";

// Cập nhật đúng đường dẫn route yêu cầu
export const Route = createFileRoute("/referee/pre-race-check")({ component: PreRaceCheck });

interface CheckInRecord {
  raceId: string;
  ranks: Record<string, number | "">; // key = registrationId (raceId-horseId)
  checkedInAt?: string;
}

const STORAGE_KEY = "preRaceCheckIn";

function loadCheckInRecords(): Record<string, CheckInRecord> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function PreRaceCheck() {
  const [hydrated, setHydrated] = useState(false);
  const [allRecords, setAllRecords] = useState<Record<string, CheckInRecord>>({});
  const [raceId, setRaceId] = useState("");

  useEffect(() => { setAllRecords(loadCheckInRecords()); setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords)); } catch {}
  }, [allRecords, hydrated]);

  // Lấy danh sách các Race có ngựa đã được duyệt (Approved)
  const eligibleRaces = useMemo(
    () => races.filter(r => registrations.some(reg => reg.raceId === r.id && reg.status === "Approved")),
    []
  );

  useEffect(() => {
    if (!raceId && eligibleRaces.length) setRaceId(eligibleRaces[0].id);
  }, [raceId, eligibleRaces]);

  const race = raceId ? getRace(raceId) : null;
  const currentRecord: CheckInRecord = allRecords[raceId] ?? { raceId, ranks: {} };
  const isCheckedIn = !!currentRecord.checkedInAt;

  // Danh sách ngựa đã duyệt (Approved) thuộc Race hiện tại
  const approvedHorses = useMemo(() => {
    if (!raceId) return [];
    return registrations
      .filter(r => r.raceId === raceId && r.status === "Approved")
      .map(r => ({ regId: `${r.raceId}-${r.horseId}`, horseId: r.horseId, jockeyId: r.jockeyId }));
  }, [raceId]);

  const totalHorses = approvedHorses.length;

  // Logic phát hiện trùng Rank
  const rankCounts = useMemo(() => {
    const map: Record<number, number> = {};
    Object.values(currentRecord.ranks).forEach(v => {
      if (typeof v === "number" && v >= 1) map[v] = (map[v] ?? 0) + 1;
    });
    return map;
  }, [currentRecord.ranks]);

  const duplicateRanks = Object.entries(rankCounts)
    .filter(([, count]) => count > 1)
    .map(([rank]) => Number(rank));

  const filledHorses = approvedHorses.filter(a => {
    const v = currentRecord.ranks[a.regId];
    return typeof v === "number" && v >= 1 && v <= totalHorses;
  });

  const isOutOfRange = approvedHorses.some(a => {
    const v = currentRecord.ranks[a.regId];
    return typeof v === "number" && (v < 1 || v > totalHorses);
  });

  // Kiểm tra tính liên tiếp từ 1 đến N
  const sortedRanks = filledHorses.map(a => currentRecord.ranks[a.regId] as number).sort((x, y) => x - y);
  const isConsecutive =
    filledHorses.length === totalHorses &&
    sortedRanks.every((v, i) => v === i + 1);

  // Mảng chứa các thông báo lỗi hiển thị lên giao diện
  const errors: string[] = [];
  if (duplicateRanks.length) errors.push(`Lỗi: Trùng thứ tự Rank: ${duplicateRanks.join(", ")}`);
  if (isOutOfRange) errors.push(`Lỗi: Rank phải nằm trong khoảng từ 1 đến ${totalHorses}`);
  if (filledHorses.length === totalHorses && !duplicateRanks.length && !isOutOfRange && !isConsecutive) {
    errors.push(`Lỗi: Rank nhập vào phải liên tiếp từ 1 đến ${totalHorses}`);
  }

  const canSaveCheckIn = !isCheckedIn && totalHorses > 0 && filledHorses.length === totalHorses && errors.length === 0;

  const handleSetRank = (regId: string, rawValue: string) => {
    const v = rawValue === "" ? "" : Number(rawValue);
    setAllRecords(prev => ({
      ...prev,
      [raceId]: {
        ...currentRecord,
        ranks: { 
          ...currentRecord.ranks, 
          [regId]: Number.isFinite(v as number) ? (v as number) : "" 
        },
      },
    }));
  };

  const handleConfirmCheckIn = () => {
    if (!canSaveCheckIn) return;
    setAllRecords(prev => ({ 
      ...prev, 
      [raceId]: { ...currentRecord, checkedInAt: new Date().toISOString() } 
    }));
    toast.success("Xác nhận kiểm tra Pre-Race thành công!", { description: `Race: ${race?.id} · ${totalHorses} ngựa sẵn sàng.` });
  };

  const handleReset = () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hết dữ liệu Rank của race này?")) return;
    setAllRecords(prev => { 
      const updated = { ...prev }; 
      delete updated[raceId]; 
      return updated; 
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Pre-Race Checking" subtitle="Kiểm tra thông tin và nhập số thứ tự xuất phát (Rank) cho các ngựa đã duyệt" />

      {/* Bộ chọn trận đấu */}
      <div className="flex flex-wrap items-center gap-3 bg-secondary/20 p-3 rounded-lg border">
        <label className="text-sm font-semibold text-card-foreground">Chọn Trận Đấu (Race):</label>
        <select
          className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          value={raceId}
          onChange={e => setRaceId(e.target.value)}
        >
          {eligibleRaces.length === 0 && <option value="">— Không có trận đấu nào có ngựa đã duyệt —</option>}
          {eligibleRaces.map(r => (
            <option key={r.id} value={r.id}>
              {r.id} · Sân: {r.track} · {r.date} ({r.time})
            </option>
          ))}
        </select>
        
        {race && <span className="text-sm font-medium text-muted-foreground">Tổng số: {totalHorses} ngựa đã duyệt</span>}
        
        {isCheckedIn && (
          <span className="text-sm font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
            ✓ Đã xác nhận check-in lúc {new Date(currentRecord.checkedInAt!).toLocaleString()}
          </span>
        )}
      </div>

      {race && totalHorses > 0 && (
        <>
          {/* Vùng hiển thị thông báo lỗi nếu nhập trùng hoặc sai luật */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-1 font-medium shadow-sm animate-in fade-in-50">
              {errors.map((error, index) => <div key={index}>• {error}</div>)}
            </div>
          )}

          {/* Bảng danh sách Horse đã duyệt và Input nhập Rank */}
          <DataTable
            columns={[
              { 
                key: "horse", 
                header: "Tên Ngựa (Horse)", 
                render: r => {
                  const h = getHorse(r.horseId);
                  return <span className="font-medium">{h?.name ?? r.horseId}</span>;
                }
              },
              { 
                key: "jockey", 
                header: "Nài Ngựa (Jockey)", 
                render: r => {
                  const j = getJockey(r.jockeyId);
                  return <span className="text-muted-foreground">{j?.name ?? r.jockeyId}</span>;
                }
              },
              { 
                key: "rank", 
                header: `Nhập Thứ Tự Rank (1..${totalHorses})`, 
                render: r => {
                  const v = currentRecord.ranks[r.regId] ?? "";
                  const isDuplicate = typeof v === "number" && (rankCounts[v] ?? 0) > 1;
                  const isOut = typeof v === "number" && (v < 1 || v > totalHorses);
                  
                  return (
                    <input
                      type="number"
                      min={1}
                      max={totalHorses}
                      disabled={isCheckedIn}
                      value={v}
                      onChange={e => handleSetRank(r.regId, e.target.value)}
                      placeholder="Nhập..."
                      className={`w-24 border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 transition-colors ${
                        isDuplicate || isOut 
                          ? "border-red-500 bg-red-50 text-red-900 focus:ring-red-400" 
                          : "border-input bg-background focus:ring-primary"
                      }`}
                    />
                  );
                }
              },
            ]}
            rows={approvedHorses}
          />

          {/* Nhóm nút hành động */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleConfirmCheckIn} disabled={!canSaveCheckIn}>
              <CheckCircle className="w-4 h-4 mr-1" /> Xác nhận Pre-Race Check
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Làm mới dữ liệu (Reset)
            </Button>
          </div>
        </>
      )}

      {/* Trường hợp trận đấu được chọn chưa có ngựa hợp lệ */}
      {race && totalHorses === 0 && (
        <div className="text-sm p-8 text-center border border-dashed rounded-lg text-muted-foreground">
          Trận đấu này hiện chưa có ngựa đua nào được chuyển trạng thái sang "Approved".
        </div>
      )}
    </div>
  );
}