using HRTMS.Data;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public class RaceRepository : IRaceRepository
    {
        private readonly AppDbContext _context;

        public RaceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Race>> GetRacesAsync(string? status)
        {
            var query = _context.Races.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Race>> GetPublishedAsync()
        {
            return await _context.Races
                .Where(r => r.Status == "Completed") // Khớp dữ liệu SQL Lovable
                .ToListAsync();
        }

        public async Task<Race?> GetByIdAsync(int id)
        {
            return await _context.Races.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Race> AddAsync(Race race)
        {
            await _context.Races.AddAsync(race);
            await _context.SaveChangesAsync();
            return race;
        }

        // Đã chuẩn hóa: Cập nhật và trả về chính object đó
        public async Task<Race> UpdateAsync(Race race)
        {
            _context.Races.Update(race);
            await _context.SaveChangesAsync();
            return race;
        }

        // Đã chuẩn hóa: Nhận ID thay vì cả object, tự tìm và tự xóa
        public async Task DeleteAsync(int id)
        {
            var race = await _context.Races.FindAsync(id);
            if (race != null)
            {
                _context.Races.Remove(race);
                await _context.SaveChangesAsync();
            }
        }
    }
}