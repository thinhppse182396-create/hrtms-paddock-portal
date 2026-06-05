using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class RaceResultService : IRaceResultService
    {
        private readonly IRaceResultRepository _resultRepo;

        public RaceResultService(IRaceResultRepository resultRepo)
        {
            _resultRepo = resultRepo;
        }

        public async Task<IEnumerable<RaceResult>> GetAllResultsAsync()
        {
            return await _resultRepo.GetAllAsync();
        }

        public async Task<RaceResult?> GetResultByIdAsync(int id)
        {
            return await _resultRepo.GetByIdAsync(id);
        }

        public async Task<RaceResult> CreateResultAsync(RaceResult result)
        {
            return await _resultRepo.AddAsync(result);
        }

        public async Task<RaceResult> UpdateResultAsync(int id, RaceResult updatedResult)
        {
            var existingResult = await _resultRepo.GetByIdAsync(id);
            if (existingResult == null)
            {
                throw new Exception($"Không tìm thấy bản ghi kết quả mang mã số {id}!");
            }

            // Đổ chuẩn xác dữ liệu theo file Model
            existingResult.RaceId = updatedResult.RaceId;
            existingResult.HorseId = updatedResult.HorseId;
            existingResult.JockeyId = updatedResult.JockeyId;

            existingResult.FinishTime = updatedResult.FinishTime;   // Thời gian về đích
            existingResult.Rank = updatedResult.Rank;               // Hạng
            existingResult.Disqualified = updatedResult.Disqualified; // Có bị hủy kết quả không?
            existingResult.Published = updatedResult.Published;       // Đã công bố chưa?
            existingResult.PrizeMoney = updatedResult.PrizeMoney;     // Tiền thưởng

            return await _resultRepo.UpdateAsync(existingResult);
        }

        public async Task DeleteResultAsync(int id)
        {
            var existingResult = await _resultRepo.GetByIdAsync(id);
            if (existingResult == null)
            {
                throw new Exception($"Không tìm thấy kết quả mang mã số {id} để xóa!");
            }
            await _resultRepo.DeleteAsync(id);
        }
    }
}