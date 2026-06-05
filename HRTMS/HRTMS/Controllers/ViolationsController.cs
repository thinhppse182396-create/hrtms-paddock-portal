using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    [Route("api/violations")]
    public class ViolationsController : ControllerBase
    {
        private readonly IViolationService _violationService;

        public ViolationsController(IViolationService violationService)
        {
            _violationService = violationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Violation>>> GetAll()
        {
            var violations = await _violationService.GetAllViolationsAsync();
            return Ok(violations);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Violation>> GetById(int id)
        {
            var violation = await _violationService.GetViolationByIdAsync(id);
            if (violation == null) return NotFound($"Không tìm thấy biên bản vi phạm mã {id}");
            return Ok(violation);
        }

        [HttpPost]
        public async Task<ActionResult<Violation>> Create([FromBody] Violation violation)
        {
            var created = await _violationService.CreateViolationAsync(violation);
            return StatusCode(201, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Violation violation)
        {
            try
            {
                await _violationService.UpdateViolationAsync(id, violation);
                return Ok(new { message = "Cập nhật biên bản vi phạm thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _violationService.DeleteViolationAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}