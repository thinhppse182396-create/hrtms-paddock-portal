using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class RegistrationService : IRegistrationService
    {
        private readonly IRegistrationRepository _registrationRepo;
        private readonly IRaceRepository _raceRepo; // Cần cái này để check giải đua

        public RegistrationService(IRegistrationRepository registrationRepo, IRaceRepository raceRepo)
        {
            _registrationRepo = registrationRepo;
            _raceRepo = raceRepo;
        }

        public async Task<IEnumerable<Registration>> GetAllRegistrationsAsync() => await _registrationRepo.GetAllAsync();

        public async Task<IEnumerable<Registration>> GetRegistrationsByOwnerAsync(int ownerId) => await _registrationRepo.GetByOwnerIdAsync(ownerId);

        public async Task<Registration?> GetRegistrationByIdAsync(int id) => await _registrationRepo.GetByIdAsync(id);

        public async Task<Registration> RegisterHorseAsync(Registration registration)
        {
            // 1. Kiểm tra giải đua hợp lệ
            if (registration.RaceId.HasValue)
            {
                var race = await _raceRepo.GetByIdAsync(registration.RaceId.Value);
                if (race == null) throw new Exception("Giải đua này không tồn tại!");

                if (race.Status == "Closed" || race.Status == "Completed")
                {
                    throw new Exception("Không thể đăng ký! Giải đua này đã đóng hoặc đã kết thúc.");
                }
            }

            // 2. Gán các giá trị mặc định cho Đơn đăng ký mới
            registration.Status = "Pending"; // Mặc định là Chờ duyệt
            registration.SubmittedAt = DateOnly.FromDateTime(DateTime.Now); // Ngày nộp là ngày hiện tại

            return await _registrationRepo.AddAsync(registration);
        }

        public async Task<Registration> UpdateStatusAsync(int id, string status, string? reason)
        {
            var existingReg = await _registrationRepo.GetByIdAsync(id);
            if (existingReg == null) throw new Exception($"Không tìm thấy đơn đăng ký mã {id}");

            // Cập nhật trạng thái (Approved/Rejected) và lý do (nếu có)
            existingReg.Status = status;
            existingReg.Reason = reason;

            return await _registrationRepo.UpdateAsync(existingReg);
        }

        public async Task DeleteRegistrationAsync(int id)
        {
            await _registrationRepo.DeleteAsync(id);
        }
    }
}