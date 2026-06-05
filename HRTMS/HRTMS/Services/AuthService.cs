using System.Threading.Tasks;
using HRTMS.Models;
using HRTMS.Repositories;

namespace HRTMS.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;

        // Inject thằng Repository vào đây
        public AuthService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // 1. LOGIC LOGIN
        public async Task<User?> LoginAsync(User user)
        {
            return await _userRepository.GetByUsernameAndPasswordAsync(user.Username, user.Password);
        }

        // 2. LOGIC REGISTER
        public async Task<bool> RegisterAsync(User user)
        {
            // Check trùng bằng Repo
            var existingUser = await _userRepository.GetByUsernameAsync(user.Username);
            if (existingUser != null)
            {
                return false; // Trả về false nếu tài khoản đã tồn tại
            }

            // Gán dữ liệu mặc định trước khi lưu
            user.Status = "Active";
            if (string.IsNullOrEmpty(user.Role))
            {
                user.Role = "Spectator";
            }

            // Đẩy xuống Repo lưu vào DB
            return await _userRepository.AddAsync(user);
        }
    }
}