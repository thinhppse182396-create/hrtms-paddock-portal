using HRTMS.Models;
using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IRaceRepository
    {
        Task<IEnumerable<Race>> GetRacesAsync(string? status);
        Task<IEnumerable<Race>> GetPublishedAsync();
        Task<Race?> GetByIdAsync(int id);

        Task<Race> AddAsync(Race race);

        Task<Race> UpdateAsync(Race race);
        Task DeleteAsync(int id);

    }
}