using HRTMS.Data;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public class ViolationRepository : IViolationRepository
    {
        private readonly AppDbContext _context;

        public ViolationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Violation>> GetAllAsync()
        {
            // Dùng Include để lấy tên Giải, Ngựa, Kỵ sĩ
            return await _context.Violations
                .Include(v => v.Race)
                .Include(v => v.Horse)
                .Include(v => v.Jockey)
                .ToListAsync();
        }

        public async Task<Violation?> GetByIdAsync(int id)
        {
            return await _context.Violations
                .Include(v => v.Race)
                .Include(v => v.Horse)
                .Include(v => v.Jockey)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Violation> AddAsync(Violation violation)
        {
            _context.Violations.Add(violation);
            await _context.SaveChangesAsync();
            return violation;
        }

        public async Task<Violation> UpdateAsync(Violation violation)
        {
            _context.Violations.Update(violation);
            await _context.SaveChangesAsync();
            return violation;
        }

        public async Task DeleteAsync(int id)
        {
            var violation = await _context.Violations.FindAsync(id);
            if (violation != null)
            {
                _context.Violations.Remove(violation);
                await _context.SaveChangesAsync();
            }
        }
    }
}