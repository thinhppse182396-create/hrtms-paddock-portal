using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/portal-data")]
public class PortalDataController : ControllerBase
{
    private readonly IPortalDataService _portalDataService;

    public PortalDataController(IPortalDataService portalDataService)
    {
        _portalDataService = portalDataService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPortalData()
    {
        return Ok(await _portalDataService.GetPortalDataAsync());
    }
}
