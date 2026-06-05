using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IOwnerRepository
    {
        Task<IEnumerable<Owner>> GetAllAsync();
        Task<Owner?> GetByIdAsync(int id);
        Task<Owner> AddAsync(Owner owner);
        Task<Owner> UpdateAsync(Owner owner);
        Task DeleteAsync(int id);
    }
}