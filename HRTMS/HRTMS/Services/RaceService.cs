using HRTMS.Models;
using HRTMS.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public class RaceService : IRaceService
    {
        private readonly IRaceRepository _raceRepository;

        public RaceService(IRaceRepository raceRepository)
        {
            _raceRepository = raceRepository;
        }

        public async Task<IEnumerable<Race>> GetAllRacesAsync(string? status)
        {
            return await _raceRepository.GetRacesAsync(status);
        }

        public async Task<IEnumerable<Race>> GetPublishedRacesAsync()
        {
            return await _raceRepository.GetPublishedAsync();
        }

        public async Task<Race?> GetRaceByIdAsync(int id)
        {
            return await _raceRepository.GetByIdAsync(id);
        }

        public async Task<Race> CreateRaceAsync(Race race)
        {
            return await _raceRepository.AddAsync(race);
        }

        // ĐÃ NÂNG CẤP: Nhận ID và dữ liệu mới, map từng trường chuẩn Lovable SQL
        public async Task<Race> UpdateRaceAsync(int id, Race updatedRace)
        {
            var existingRace = await _raceRepository.GetByIdAsync(id);
            if (existingRace == null)
            {
                throw new Exception($"Không tìm thấy giải đua mang mã số {id} để cập nhật!");
            }

            // Gán toàn bộ dữ liệu mới vào object cũ để Entity Framework nhận biết thay đổi
            existingRace.TournamentId = updatedRace.TournamentId;
            existingRace.Round = updatedRace.Round;
            existingRace.RaceDate = updatedRace.RaceDate;
            existingRace.RaceTime = updatedRace.RaceTime;
            existingRace.Track = updatedRace.Track;
            existingRace.Distance = updatedRace.Distance;
            existingRace.Lanes = updatedRace.Lanes;
            existingRace.Status = updatedRace.Status;
            existingRace.MinAge = updatedRace.MinAge;
            existingRace.MaxAge = updatedRace.MaxAge;
            existingRace.MinWeight = updatedRace.MinWeight;
            existingRace.MaxWeight = updatedRace.MaxWeight;
            existingRace.AllowedBreeds = updatedRace.AllowedBreeds;
            existingRace.RequiresHealthCert = updatedRace.RequiresHealthCert;

            return await _raceRepository.UpdateAsync(existingRace);
        }

        // ĐÃ SỬA: Truyền trực tiếp ID xuống Repository theo chuẩn mới
        public async Task DeleteRaceAsync(int id)
        {
            var existingRace = await _raceRepository.GetByIdAsync(id);
            if (existingRace == null)
            {
                throw new Exception($"Không tìm thấy giải đua mang mã số {id} để xóa!");
            }

            await _raceRepository.DeleteAsync(id);
        }

        public async Task PublishRaceAsync(int id)
        {
            var race = await _raceRepository.GetByIdAsync(id);
            if (race == null)
            {
                throw new Exception($"Không tìm thấy giải đua mang mã số {id} để công bố!");
            }

            // Giữ nguyên logic trạng thái của ông
            race.Status = "Completed";

            await _raceRepository.UpdateAsync(race);
        }
    }
}