using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    [Route("api/raceresults")]
    public class RaceResultsController : ControllerBase
    {
        private readonly IRaceResultService _resultService;

        public RaceResultsController(IRaceResultService resultService)
        {
            _resultService = resultService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RaceResult>>> GetAll()
        {
            var results = await _resultService.GetAllResultsAsync();
            return Ok(results);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RaceResult>> GetById(int id)
        {
            var result = await _resultService.GetResultByIdAsync(id);
            if (result == null) return NotFound($"Không tìm thấy kết quả mã {id}");
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<RaceResult>> Create([FromBody] RaceResult result)
        {
            var created = await _resultService.CreateResultAsync(result);
            return StatusCode(201, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RaceResult result)
        {
            try
            {
                await _resultService.UpdateResultAsync(id, result);
                return Ok(new { message = "Cập nhật kết quả đua thành công!" });
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
                await _resultService.DeleteResultAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}