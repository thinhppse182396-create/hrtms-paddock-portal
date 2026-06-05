using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult ToNoContentResult(ServiceResult<bool> result)
    {
        return result.Status switch
        {
            ServiceResultStatus.Success => NoContent(),
            ServiceResultStatus.Unauthorized => Unauthorized(Message(result)),
            ServiceResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, Message(result)),
            ServiceResultStatus.NotFound => NotFound(Message(result)),
            ServiceResultStatus.BadRequest => BadRequest(Message(result)),
            ServiceResultStatus.Conflict => Conflict(Message(result)),
            ServiceResultStatus.Problem => Problem(result.Message),
            _ => Problem("Unexpected service result.")
        };
    }

    protected ActionResult<T> ToActionResult<T>(ServiceResult<T> result)
    {
        return result.Status switch
        {
            ServiceResultStatus.Success => Ok(result.Value),
            ServiceResultStatus.Unauthorized => Unauthorized(Message(result)),
            ServiceResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, Message(result)),
            ServiceResultStatus.NotFound => NotFound(Message(result)),
            ServiceResultStatus.BadRequest => BadRequest(Message(result)),
            ServiceResultStatus.Conflict => Conflict(Message(result)),
            ServiceResultStatus.Problem => Problem(result.Message),
            _ => Problem("Unexpected service result.")
        };
    }

    private static object? Message<T>(ServiceResult<T> result)
    {
        return result.Message is null ? null : new { message = result.Message };
    }
}
