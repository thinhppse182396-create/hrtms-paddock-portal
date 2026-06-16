// src/service/awardAPI.ts
// Award service - calls real backend API (HRTMS §7)
// Uses the shared axios instance from src/api.ts

import api from '../api';

/**
 * Lấy thông tin quỹ thưởng của một trận đấu theo HRTMS §7
 * GET /awards/{raceId}
 */
export async function getRaceAwards(raceId: string) {
  return api.get(`/awards/${raceId}`);
}

/**
 * Lưu/cập nhật dữ liệu race lên server
 * POST /races  hoặc  PUT /races/:id
 */
export async function saveRaceToServer(raceData: Record<string, unknown>, isEdit: boolean) {
  if (isEdit) {
    return api.put(`/races/${raceData.id}`, raceData);
  }
  return api.post('/races', raceData);
}
