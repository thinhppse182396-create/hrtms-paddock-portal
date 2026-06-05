using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HRTMS.Models;
using HRTMS.Data;
// using HRTMS.Data; // Bỏ comment nếu DbContext của ông nằm trong thư mục Data

namespace HRTMS.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context; // Đổi tên DbContext của ông ở đây nếu khác

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User?> GetByUsernameAndPasswordAsync(string username, string password)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username && u.Password == password);
        }

        public async Task<bool> AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            return await _context.SaveChangesAsync() > 0; // Trả về true nếu lưu thành công vào DB
        }
    }
}