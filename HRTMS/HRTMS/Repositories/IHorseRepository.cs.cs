using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IHorseRepository
    {
        Task<IEnumerable<Horse>> GetAllAsync();
        Task<IEnumerable<Horse>> GetByOwnerIdAsync(int ownerId);
        Task<Horse?> GetByIdAsync(int id);
        Task<Horse> AddAsync(Horse horse);

        Task<Horse> UpdateAsync(Horse horse);
        Task DeleteAsync(int id);
    }
}