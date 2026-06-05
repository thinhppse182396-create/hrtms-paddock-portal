using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IOwnerService
    {
        Task<IEnumerable<Owner>> GetAllOwnersAsync();
        Task<Owner?> GetOwnerByIdAsync(int id);
        Task<Owner> CreateOwnerAsync(Owner owner);
        Task<Owner> UpdateOwnerAsync(int id, Owner updatedOwner);
        Task DeleteOwnerAsync(int id);
    }
}