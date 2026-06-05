using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;

namespace HRTMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // 🎯 ĐĂNG KÝ (POST: api/Auth/register)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { message = "Không được để trống Username, Password hay Name đâu ông ơi!" });
            }

            var result = await _authService.RegisterAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Tên tài khoản này đã có người húp rồi!" });
            }

            return Ok(new { message = "Đăng ký tài khoản thành công rực rỡ!" });
        }

        // 🎯 ĐĂNG NHẬP (POST: api/Auth/login)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Điền đầy đủ Username và Password giùm cái ông ơi!" });
            }

            var user = await _authService.LoginAsync(request);
            if (user == null)
            {
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu rồi!" });
            }

            return Ok(new
            {
                message = "Đăng nhập thành công!",
                username = user.Username,
                name = user.Name,
                role = user.Role,
                token = $"fake-jwt-token-for-{user.Username}"
            });
        }
    }
}