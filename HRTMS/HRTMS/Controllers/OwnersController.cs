using Microsoft.AspNetCore.Mvc;
using HRTMS.Models;
using HRTMS.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace HRTMS.Controllers
{
    [ApiController]
    [Route("api/owners")]
    public class OwnersController : ControllerBase
    {
        private readonly IOwnerService _ownerService;

        public OwnersController(IOwnerService ownerService)
        {
            _ownerService = ownerService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Owner>>> GetAll()
        {
            var owners = await _ownerService.GetAllOwnersAsync();
            return Ok(owners);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Owner>> GetById(int id)
        {
            var owner = await _ownerService.GetOwnerByIdAsync(id);
            if (owner == null) return NotFound($"Không tìm thấy chủ ngựa mã {id}");
            return Ok(owner);
        }

        [HttpPost]
        public async Task<ActionResult<Owner>> Create([FromBody] Owner owner)
        {
            var created = await _ownerService.CreateOwnerAsync(owner);
            return StatusCode(201, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Owner owner)
        {
            try
            {
                await _ownerService.UpdateOwnerAsync(id, owner);
                return Ok(new { message = "Cập nhật thành công!" });
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
                await _ownerService.DeleteOwnerAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}