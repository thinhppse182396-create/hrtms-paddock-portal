using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IViolationService
    {
        Task<IEnumerable<Violation>> GetAllViolationsAsync();
        Task<Violation?> GetViolationByIdAsync(int id);
        Task<Violation> CreateViolationAsync(Violation violation);
        Task<Violation> UpdateViolationAsync(int id, Violation updatedViolation);
        Task DeleteViolationAsync(int id);
    }
}