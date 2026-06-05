using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    // CHÚ Ý: Đã sửa thành route số nhiều để khớp 100% với Frontend
    [Route("api/horses")]
    public class HorsesController : ControllerBase
    {
        private readonly IHorseService _horseService;

        public HorsesController(IHorseService horseService)
        {
            _horseService = horseService;
        }

        // GET: /api/horses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Horse>>> GetAll()
        {
            var horses = await _horseService.GetAllHorsesAsync();
            return Ok(horses);
        }

        // GET: /api/horses/5 (Lấy chi tiết 1 con ngựa - Bổ sung cho đủ bộ)
        [HttpGet("{id}")]
        public async Task<ActionResult<Horse>> GetById(int id)
        {
            var horse = await _horseService.GetHorseByIdAsync(id); // Nhớ thêm hàm này vào Service
            if (horse == null)
            {
                return NotFound($"Không tìm thấy ngựa mang mã số {id}");
            }
            return Ok(horse);
        }

        // GET: /api/horses/owner/5
        [HttpGet("owner/{ownerId}")]
        public async Task<ActionResult<IEnumerable<Horse>>> GetByOwner(int ownerId)
        {
            var horses = await _horseService.GetHorsesByOwnerAsync(ownerId);
            return Ok(horses);
        }

        // POST: /api/horses
        [HttpPost]
        public async Task<ActionResult<Horse>> Create([FromBody] Horse horse)
        {
            // Set trạng thái mặc định nếu frontend không truyền
            if (string.IsNullOrEmpty(horse.Status))
            {
                horse.Status = "Eligible";
            }

            var createdHorse = await _horseService.CreateHorseAsync(horse);
            return StatusCode(201, createdHorse);
        }

        // PUT: /api/horses/5 (Cập nhật thông tin ngựa - Bổ sung cho đủ bộ)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Horse updatedHorse)
        {
            try
            {
                await _horseService.UpdateHorseAsync(id, updatedHorse); // Nhớ thêm hàm này vào Service
                return Ok(new { message = "Cập nhật thông tin ngựa thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: /api/horses/5 (Xóa ngựa - Bổ sung cho đủ bộ)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _horseService.DeleteHorseAsync(id); // Nhớ thêm hàm này vào Service
                return NoContent(); // Mã 204
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}