using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class JockeyService : IJockeyService
    {
        private readonly IJockeyRepository _jockeyRepo;

        public JockeyService(IJockeyRepository jockeyRepo)
        {
            _jockeyRepo = jockeyRepo;
        }

        public async Task<IEnumerable<Jockey>> GetAllJockeysAsync()
        {
            return await _jockeyRepo.GetAllAsync();
        }

        public async Task<Jockey?> GetJockeyByIdAsync(int id)
        {
            return await _jockeyRepo.GetByIdAsync(id);
        }

        public async Task<Jockey> CreateJockeyAsync(Jockey jockey)
        {
            return await _jockeyRepo.AddAsync(jockey);
        }

        public async Task<Jockey> UpdateJockeyAsync(int id, Jockey updatedJockey)
        {
            var existingJockey = await _jockeyRepo.GetByIdAsync(id);
            if (existingJockey == null)
            {
                throw new Exception($"Không tìm thấy kỵ sĩ mang mã số {id} để cập nhật!");
            }

            // Map chuẩn xác từng trường theo đúng File Model của ông
            existingJockey.Name = updatedJockey.Name;
            existingJockey.LicenseNo = updatedJockey.LicenseNo; // Số giấy phép
            existingJockey.Weight = updatedJockey.Weight;       // Cân nặng
            existingJockey.Ranking = updatedJockey.Ranking;     // Thứ hạng
            existingJockey.Status = updatedJockey.Status;       // Trạng thái

            return await _jockeyRepo.UpdateAsync(existingJockey);
        }

        public async Task DeleteJockeyAsync(int id)
        {
            var existingJockey = await _jockeyRepo.GetByIdAsync(id);
            if (existingJockey == null)
            {
                throw new Exception($"Không tìm thấy kỵ sĩ mang mã số {id} để xóa!");
            }
            await _jockeyRepo.DeleteAsync(id);
        }
    }
}