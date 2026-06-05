using HRTMS.Data;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public class JockeyRepository : IJockeyRepository
    {
        private readonly AppDbContext _context;

        public JockeyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Jockey>> GetAllAsync()
        {
            return await _context.Jockeys.ToListAsync();
        }

        public async Task<Jockey?> GetByIdAsync(int id)
        {
            return await _context.Jockeys.FindAsync(id);
        }

        public async Task<Jockey> AddAsync(Jockey jockey)
        {
            _context.Jockeys.Add(jockey);
            await _context.SaveChangesAsync();
            return jockey;
        }

        public async Task<Jockey> UpdateAsync(Jockey jockey)
        {
            _context.Jockeys.Update(jockey);
            await _context.SaveChangesAsync();
            return jockey;
        }

        public async Task DeleteAsync(int id)
        {
            var jockey = await _context.Jockeys.FindAsync(id);
            if (jockey != null)
            {
                _context.Jockeys.Remove(jockey);
                await _context.SaveChangesAsync();
            }
        }
    }
}