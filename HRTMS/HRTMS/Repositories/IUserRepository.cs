using System.Threading.Tasks;
using HRTMS.Models;

namespace HRTMS.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByUsernameAndPasswordAsync(string username, string password);
        Task<bool> AddAsync(User user);
    }
}