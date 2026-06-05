using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IRegistrationService
    {
        Task<IEnumerable<Registration>> GetAllRegistrationsAsync();
        Task<IEnumerable<Registration>> GetRegistrationsByOwnerAsync(int ownerId);
        Task<Registration?> GetRegistrationByIdAsync(int id);
        Task<Registration> RegisterHorseAsync(Registration registration);

        // Hàm dành riêng cho Trọng tài/Admin duyệt hoặc từ chối đơn
        Task<Registration> UpdateStatusAsync(int id, string status, string? reason);

        Task DeleteRegistrationAsync(int id);
    }
}