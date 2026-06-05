using HRTMS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRTMS.Services
{
    public interface IJockeyService
    {
        Task<IEnumerable<Jockey>> GetAllJockeysAsync();
        Task<Jockey?> GetJockeyByIdAsync(int id);
        Task<Jockey> CreateJockeyAsync(Jockey jockey);
        Task<Jockey> UpdateJockeyAsync(int id, Jockey updatedJockey);
        Task DeleteJockeyAsync(int id);
    }
}