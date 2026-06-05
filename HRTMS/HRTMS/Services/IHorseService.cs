using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IHorseService
    {
        Task<IEnumerable<Horse>> GetAllHorsesAsync();
        Task<IEnumerable<Horse>> GetHorsesByOwnerAsync(int ownerId);

        // --- 3 HÀM BỔ SUNG ĐỂ KHỚP VỚI CONTROLLER ---
        Task<Horse?> GetHorseByIdAsync(int id);
        Task<Horse> CreateHorseAsync(Horse horse);
        Task<Horse> UpdateHorseAsync(int id, Horse updatedHorse);
        Task DeleteHorseAsync(int id);
    }
}