using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepo;

        public ViolationService(IViolationRepository violationRepo)
        {
            _violationRepo = violationRepo;
        }

        public async Task<IEnumerable<Violation>> GetAllViolationsAsync()
        {
            return await _violationRepo.GetAllAsync();
        }

        public async Task<Violation?> GetViolationByIdAsync(int id)
        {
            return await _violationRepo.GetByIdAsync(id);
        }

        public async Task<Violation> CreateViolationAsync(Violation violation)
        {
            return await _violationRepo.AddAsync(violation);
        }

        public async Task<Violation> UpdateViolationAsync(int id, Violation updatedViolation)
        {
            var existingViolation = await _violationRepo.GetByIdAsync(id);
            if (existingViolation == null)
            {
                throw new Exception($"Không tìm thấy biên bản vi phạm mang mã số {id}!");
            }

            // Map chuẩn xác từng trường theo Model Violation.cs của ông
            existingViolation.RaceId = updatedViolation.RaceId;
            existingViolation.HorseId = updatedViolation.HorseId;
            existingViolation.JockeyId = updatedViolation.JockeyId;
            existingViolation.ViolationType = updatedViolation.ViolationType; // Loại vi phạm
            existingViolation.Severity = updatedViolation.Severity;           // Mức độ nghiêm trọng
            existingViolation.Description = updatedViolation.Description;     // Mô tả

            return await _violationRepo.UpdateAsync(existingViolation);
        }

        public async Task DeleteViolationAsync(int id)
        {
            var existingViolation = await _violationRepo.GetByIdAsync(id);
            if (existingViolation == null)
            {
                throw new Exception($"Không tìm thấy biên bản vi phạm mang mã số {id} để xóa!");
            }
            await _violationRepo.DeleteAsync(id);
        }
    }
}