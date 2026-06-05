using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class OwnerService : IOwnerService
    {
        private readonly IOwnerRepository _ownerRepo;

        public OwnerService(IOwnerRepository ownerRepo)
        {
            _ownerRepo = ownerRepo;
        }

        public async Task<IEnumerable<Owner>> GetAllOwnersAsync()
        {
            return await _ownerRepo.GetAllAsync();
        }

        public async Task<Owner?> GetOwnerByIdAsync(int id)
        {
            return await _ownerRepo.GetByIdAsync(id);
        }

        public async Task<Owner> CreateOwnerAsync(Owner owner)
        {
            return await _ownerRepo.AddAsync(owner);
        }

        public async Task<Owner> UpdateOwnerAsync(int id, Owner updatedOwner)
        {
            var existingOwner = await _ownerRepo.GetByIdAsync(id);
            if (existingOwner == null)
            {
                throw new Exception($"Không tìm thấy chủ ngựa mang mã số {id} để cập nhật!");
            }

            // Đổ dữ liệu từ Model của ông vào đây để cập nhật
            existingOwner.Name = updatedOwner.Name;
            existingOwner.Stable = updatedOwner.Stable;
            existingOwner.Contact = updatedOwner.Contact;

            return await _ownerRepo.UpdateAsync(existingOwner);
        }

        public async Task DeleteOwnerAsync(int id)
        {
            var existingOwner = await _ownerRepo.GetByIdAsync(id);
            if (existingOwner == null)
            {
                throw new Exception($"Không tìm thấy chủ ngựa mang mã số {id} để xóa!");
            }
            await _ownerRepo.DeleteAsync(id);
        }
    }
}