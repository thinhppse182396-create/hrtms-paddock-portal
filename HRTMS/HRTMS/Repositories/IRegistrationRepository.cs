using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Repositories
{
    public interface IRegistrationRepository
    {
        Task<IEnumerable<Registration>> GetAllAsync();
        Task<IEnumerable<Registration>> GetByOwnerIdAsync(int ownerId);
        Task<Registration?> GetByIdAsync(int id);
        Task<Registration> AddAsync(Registration registration);
        Task<Registration> UpdateAsync(Registration registration);
        Task DeleteAsync(int id);
    }
}