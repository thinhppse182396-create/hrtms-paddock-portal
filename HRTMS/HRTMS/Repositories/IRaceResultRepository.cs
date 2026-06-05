using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IRaceResultRepository
    {
        Task<IEnumerable<RaceResult>> GetAllAsync();
        Task<RaceResult?> GetByIdAsync(int id);
        Task<RaceResult> AddAsync(RaceResult result);
        Task<RaceResult> UpdateAsync(RaceResult result);
        Task DeleteAsync(int id);
    }
}