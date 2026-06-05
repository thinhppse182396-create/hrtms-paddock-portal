using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    [Route("api/jockeys")]
    public class JockeysController : ControllerBase
    {
        private readonly IJockeyService _jockeyService;

        public JockeysController(IJockeyService jockeyService)
        {
            _jockeyService = jockeyService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Jockey>>> GetAll()
        {
            var jockeys = await _jockeyService.GetAllJockeysAsync();
            return Ok(jockeys);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Jockey>> GetById(int id)
        {
            var jockey = await _jockeyService.GetJockeyByIdAsync(id);
            if (jockey == null) return NotFound($"Không tìm thấy kỵ sĩ mã {id}");
            return Ok(jockey);
        }

        [HttpPost]
        public async Task<ActionResult<Jockey>> Create([FromBody] Jockey jockey)
        {
            var created = await _jockeyService.CreateJockeyAsync(jockey);
            return StatusCode(201, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Jockey jockey)
        {
            try
            {
                await _jockeyService.UpdateJockeyAsync(id, jockey);
                return Ok(new { message = "Cập nhật hồ sơ kỵ sĩ thành công!" });
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
                await _jockeyService.DeleteJockeyAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}