using HRTMS.Data;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public class RaceResultRepository : IRaceResultRepository
    {
        private readonly AppDbContext _context;

        public RaceResultRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RaceResult>> GetAllAsync()
        {
            return await _context.RaceResults
                .Include(r => r.Race)
                .Include(r => r.Horse)
                .Include(r => r.Jockey)
                .ToListAsync();
        }

        public async Task<RaceResult?> GetByIdAsync(int id)
        {
            return await _context.RaceResults
                .Include(r => r.Race)
                .Include(r => r.Horse)
                .Include(r => r.Jockey)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<RaceResult> AddAsync(RaceResult result)
        {
            _context.RaceResults.Add(result);
            await _context.SaveChangesAsync();
            return result;
        }

        public async Task<RaceResult> UpdateAsync(RaceResult result)
        {
            _context.RaceResults.Update(result);
            await _context.SaveChangesAsync();
            return result;
        }

        public async Task DeleteAsync(int id)
        {
            var result = await _context.RaceResults.FindAsync(id);
            if (result != null)
            {
                _context.RaceResults.Remove(result);
                await _context.SaveChangesAsync();
            }
        }
    }
}