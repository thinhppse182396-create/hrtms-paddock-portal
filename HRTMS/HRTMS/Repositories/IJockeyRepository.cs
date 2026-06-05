using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IJockeyRepository
    {
        Task<IEnumerable<Jockey>> GetAllAsync();
        Task<Jockey?> GetByIdAsync(int id);
        Task<Jockey> AddAsync(Jockey jockey);
        Task<Jockey> UpdateAsync(Jockey jockey);
        Task DeleteAsync(int id);
    }
}