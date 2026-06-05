using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IViolationRepository
    {
        Task<IEnumerable<Violation>> GetAllAsync();
        Task<Violation?> GetByIdAsync(int id);
        Task<Violation> AddAsync(Violation violation);
        Task<Violation> UpdateAsync(Violation violation);
        Task DeleteAsync(int id);
    }
}