using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IRaceResultService
    {
        Task<IEnumerable<RaceResult>> GetAllResultsAsync();
        Task<RaceResult?> GetResultByIdAsync(int id);
        Task<RaceResult> CreateResultAsync(RaceResult result);
        Task<RaceResult> UpdateResultAsync(int id, RaceResult updatedResult);
        Task DeleteResultAsync(int id);
    }
}