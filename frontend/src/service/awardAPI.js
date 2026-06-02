// src/service/awardService.js

/**
 * Hàm mô phỏng tính toán cấu hình tiền thưởng theo HRTMS §7
 * Hàm này tính toán và trả về đúng cấu trúc để hiển thị lên giao diện AdminAwards
 * 
 * @param {Object} race - Đối tượng Race từ mockData hoặc API
 * @param {number} confirmedCount - Số lượng ngựa đã Approved trong trận
 * @returns {Object} Đối tượng chứa toàn bộ thông tin tài chính hiện có của trận đấu
 */
// src/service/awardService.js

const API_BASE_URL = import.meta.env?.VITE_API_URL || process.env?.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Lấy thông tin quỹ thưởng thực tế thu về của một trận đấu theo HRTMS §7
 * GET /awards/{raceId}
 * * @param {string} raceId - ID của trận đấu cần lấy thông tin
 * @returns {Promise<Object>} Trả về Object chứa thông tin: pool, guaranteed, fromBets, confirmed, breakdown...
 */
export async function getRaceAwards(raceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/awards/${raceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Không thể tải dữ liệu giải thưởng trận ${raceId}. Mã lỗi: ${response.status}`);
    }

    // Server sẽ tính toán sẵn các trường dựa trên HRTMS §7 và trả về JSON
    return await response.json();
  } catch (error) {
    console.error(`❌ [API Error] Lỗi khi gọi GET /awards/${raceId}:`, error.message);
    throw error;
  }
}
const API_BASE_URL = import.meta.env?.VITE_API_URL || process.env?.REACT_APP_API_URL || 'http://localhost:3000/api';
export async function saveRaceToServer(raceData, isEdit) {
  try {
    // Tùy biến endpoint nếu cần, ví dụ tạo mới là POST /races, cập nhật có thể là PUT /races/:id
    // Ở đây dùng chung POST /races theo logic gốc của bạn
    const url = isEdit ? `${API_BASE_URL}/races/${raceData.id}` : `${API_BASE_URL}/races`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(raceData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Lỗi lưu trữ dữ liệu! Mã HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ [API Error] Lỗi khi đồng bộ Race:", error.message);
    throw error;
  }
}
