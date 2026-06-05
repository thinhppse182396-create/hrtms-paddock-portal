using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IRaceService
    {
        Task<IEnumerable<Race>> GetAllRacesAsync(string? status);
        Task<IEnumerable<Race>> GetPublishedRacesAsync();
        Task<Race?> GetRaceByIdAsync(int id);
        Task<Race> CreateRaceAsync(Race race);

        // Đã sửa: Nhận vào ID và dữ liệu mới, trả về Race sau khi đã cập nhật
        Task<Race> UpdateRaceAsync(int id, Race updatedRace);

        Task DeleteRaceAsync(int id);
        Task PublishRaceAsync(int id);
    }
}