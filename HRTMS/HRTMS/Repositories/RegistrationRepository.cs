using HRTMS.Data;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public class RegistrationRepository : IRegistrationRepository
    {
        private readonly AppDbContext _context;

        public RegistrationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Registration>> GetAllAsync()
        {
            // Dùng Include để lấy đầy đủ thông tin từ các bảng khóa ngoại
            return await _context.Registrations
                .Include(r => r.Race)
                .Include(r => r.Horse)
                .Include(r => r.Jockey)
                .Include(r => r.Owner)
                .ToListAsync();
        }

        public async Task<IEnumerable<Registration>> GetByOwnerIdAsync(int ownerId)
        {
            return await _context.Registrations
                .Include(r => r.Race)
                .Include(r => r.Horse)
                .Include(r => r.Jockey)
                .Include(r => r.Owner)
                .Where(r => r.OwnerId == ownerId)
                .ToListAsync();
        }

        public async Task<Registration?> GetByIdAsync(int id)
        {
            return await _context.Registrations
                .Include(r => r.Race)
                .Include(r => r.Horse)
                .Include(r => r.Jockey)
                .Include(r => r.Owner)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Registration> AddAsync(Registration registration)
        {
            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();
            return registration;
        }

        public async Task<Registration> UpdateAsync(Registration registration)
        {
            _context.Registrations.Update(registration);
            await _context.SaveChangesAsync();
            return registration;
        }

        public async Task DeleteAsync(int id)
        {
            var reg = await _context.Registrations.FindAsync(id);
            if (reg != null)
            {
                _context.Registrations.Remove(reg);
                await _context.SaveChangesAsync();
            }
        }
    }
}