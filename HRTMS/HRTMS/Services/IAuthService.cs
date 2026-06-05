using System.Threading.Tasks;
using HRTMS.Models;

namespace HRTMS.Services
{
    public interface IAuthService
    {
        Task<User?> LoginAsync(User user);
        Task<bool> RegisterAsync(User user);
    }
}