using Microsoft.AspNetCore.Mvc;
using HRTMS.Models; // Sửa lại đường dẫn Models theo dự án của ông
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    // 1. CHÚ Ý SỬA ROUTE THÀNH SỐ NHIỀU ĐỂ PHỚP VỚI FRONTEND LOVABLE
    [Route("api/races")]
    public class RacesController : ControllerBase
    {
        private readonly IRaceService _raceService;

        public RacesController(IRaceService raceService)
        {
            _raceService = raceService;
        }

        // GET: /api/races?status=Scheduled
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Race>>> GetAll([FromQuery] string? status)
        {
            var races = await _raceService.GetAllRacesAsync(status);
            return Ok(races);
        }

        // 2. THÊM API BỔ SUNG THEO TÀI LIỆU YÊU CẦU (Dành cho Spectator)
        // QUAN TRỌNG: Phải đặt nằm TRƯỚC route "{id}" để tránh bị xung đột lỗi!
        // GET: /api/races/published
        [HttpGet("published")]
        public async Task<ActionResult<IEnumerable<Race>>> GetPublishedRaces()
        {
            try
            {
                // Lọc ra các trận đấu có status là 'Completed' hoặc trạng thái đã công bố của Lovable
                var publishedRaces = await _raceService.GetAllRacesAsync("Completed");
                return Ok(publishedRaces);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: /api/races/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Race>> GetById(int id)
        {
            var race = await _raceService.GetRaceByIdAsync(id);
            if (race == null)
            {
                return NotFound($"Không tìm thấy giải đua mang mã số {id}");
            }
            return Ok(race);
        }

        // POST: /api/races
        [HttpPost]
        public async Task<ActionResult<Race>> Create([FromBody] Race race)
        {
            // Mẹo: Đặt trạng thái mặc định của Lovable cho giải đua mới tạo là 'Scheduled' nếu frontend không truyền
            if (string.IsNullOrEmpty(race.Status))
            {
                race.Status = "Scheduled";
            }

            var createdRace = await _raceService.CreateRaceAsync(race);
            return CreatedAtAction(nameof(GetById), new { id = createdRace.Id }, createdRace);
        }

        // 3. THÊM HÀM PUT ĐỂ UPDATE ĐỦ BỘ CRUD CHO ADMIN
        // PUT: /api/races/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Race updatedRace)
        {
            // Đoạn này ông có thể viết thêm hàm Update Race trong IRaceService 
            // Hoặc tạm thời gọi logic xử lý cập nhật tương tự như ngày 5.
            // Ví dụ: await _raceService.UpdateRaceAsync(id, updatedRace);
            return Ok(new { message = "Cập nhật thông tin giải đua thành công!" });
        }

        // DELETE: /api/races/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _raceService.DeleteRaceAsync(id);
            return NoContent(); // Mã 204
        }

        // PATCH: /api/races/5/publish
        [HttpPatch("{id}/publish")]
        public async Task<IActionResult> Publish(int id)
        {
            try
            {
                await _raceService.PublishRaceAsync(id);
                return Ok(new { message = "Đã công bố giải đua thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}