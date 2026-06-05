using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    [Route("api/registrations")] // CHUẨN SỐ NHIỀU CHO LOVABLE
    public class RegistrationsController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;

        public RegistrationsController(IRegistrationService registrationService)
        {
            _registrationService = registrationService;
        }

        // GET: api/registrations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Registration>>> GetAll()
        {
            var data = await _registrationService.GetAllRegistrationsAsync();
            return Ok(data);
        }

        // GET: api/registrations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Registration>> GetById(int id)
        {
            var reg = await _registrationService.GetRegistrationByIdAsync(id);
            if (reg == null) return NotFound("Không tìm thấy đơn đăng ký.");
            return Ok(reg);
        }

        // Lấy danh sách đăng ký theo Chủ ngựa (Dành cho Owner Dashboard)
        // GET: api/registrations/owner/5
        [HttpGet("owner/{ownerId}")]
        public async Task<ActionResult<IEnumerable<Registration>>> GetByOwner(int ownerId)
        {
            var data = await _registrationService.GetRegistrationsByOwnerAsync(ownerId);
            return Ok(data);
        }

        // POST: api/registrations (Nộp đơn mới)
        [HttpPost]
        public async Task<ActionResult<Registration>> Create([FromBody] Registration registration)
        {
            try
            {
                var result = await _registrationService.RegisterHorseAsync(registration);
                return StatusCode(201, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PATCH: api/registrations/5/status (Duyệt/Từ chối đơn)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] RegistrationStatusDto dto)
        {
            try
            {
                var result = await _registrationService.UpdateStatusAsync(id, dto.Status, dto.Reason);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/registrations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _registrationService.DeleteRegistrationAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    // DTO phụ trợ để nhận dữ liệu khi Update Status
    public class RegistrationStatusDto
    {
        public string Status { get; set; } = string.Empty; // "Approved" hoặc "Rejected"
        public string? Reason { get; set; }
    }
}