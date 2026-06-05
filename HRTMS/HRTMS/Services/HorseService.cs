using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class HorseService : IHorseService
    {
        private readonly IHorseRepository _horseRepo;

        public HorseService(IHorseRepository horseRepo)
        {
            _horseRepo = horseRepo;
        }

        public async Task<IEnumerable<Horse>> GetAllHorsesAsync()
        {
            return await _horseRepo.GetAllAsync();
        }

        public async Task<IEnumerable<Horse>> GetHorsesByOwnerAsync(int ownerId)
        {
            return await _horseRepo.GetByOwnerIdAsync(ownerId);
        }

        public async Task<Horse?> GetHorseByIdAsync(int id)
        {
            return await _horseRepo.GetByIdAsync(id);
        }

        public async Task<Horse> CreateHorseAsync(Horse horse)
        {
            return await _horseRepo.AddAsync(horse);
        }

        // --- HÀM CẬP NHẬT: MAP CHUẨN CÁC TRƯỜNG TỪ LOVABLE ---
        public async Task<Horse> UpdateHorseAsync(int id, Horse updatedHorse)
        {
            var existingHorse = await _horseRepo.GetByIdAsync(id);
            if (existingHorse == null)
            {
                throw new Exception($"Không tìm thấy ngựa mang mã số {id} để cập nhật!");
            }

            // Đổ dữ liệu mới vào dữ liệu cũ
            existingHorse.Name = updatedHorse.Name;
            existingHorse.Breed = updatedHorse.Breed;
            existingHorse.Age = updatedHorse.Age;
            existingHorse.Weight = updatedHorse.Weight;
            existingHorse.OwnerId = updatedHorse.OwnerId;
            existingHorse.HealthCertExpiry = updatedHorse.HealthCertExpiry;
            existingHorse.Status = updatedHorse.Status;
            existingHorse.Color = updatedHorse.Color;
            existingHorse.Trainer = updatedHorse.Trainer;
            existingHorse.Bio = updatedHorse.Bio;

            return await _horseRepo.UpdateAsync(existingHorse);
        }

        // --- HÀM XÓA: CHUẨN HÓA TRUYỀN ID ---
        public async Task DeleteHorseAsync(int id)
        {
            var existingHorse = await _horseRepo.GetByIdAsync(id);
            if (existingHorse == null)
            {
                throw new Exception($"Không tìm thấy ngựa mang mã số {id} để xóa!");
            }

            await _horseRepo.DeleteAsync(id);
        }
    }
}