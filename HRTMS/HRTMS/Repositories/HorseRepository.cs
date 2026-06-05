using HRTMS.Data;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public class HorseRepository : IHorseRepository
    {
        private readonly AppDbContext _context;

        public HorseRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Horse>> GetAllAsync()
        {
            return await _context.Horses.ToListAsync();
        }

        public async Task<IEnumerable<Horse>> GetByOwnerIdAsync(int ownerId)
        {
            return await _context.Horses.Where(h => h.OwnerId == ownerId).ToListAsync();
        }

        public async Task<Horse?> GetByIdAsync(int id)
        {
            return await _context.Horses.FindAsync(id); // Code cũ của ông dùng FindAsync chuẩn rồi
        }

        public async Task<Horse> AddAsync(Horse horse)
        {
            _context.Horses.Add(horse);
            await _context.SaveChangesAsync();
            return horse;
        }

        // --- BỔ SUNG HÀM CẬP NHẬT ---
        public async Task<Horse> UpdateAsync(Horse horse)
        {
            _context.Horses.Update(horse);
            await _context.SaveChangesAsync();
            return horse;
        }

        // --- BỔ SUNG HÀM XÓA ---
        public async Task DeleteAsync(int id)
        {
            var horse = await _context.Horses.FindAsync(id);
            if (horse != null)
            {
                _context.Horses.Remove(horse);
                await _context.SaveChangesAsync();
            }
        }
    }
}