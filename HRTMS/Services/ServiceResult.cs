namespace HRTMS.Services;

public enum ServiceResultStatus
{
    Success,
    Created,
    Unauthorized,
    Forbidden,
    NotFound,
    BadRequest,
    Conflict,
    Problem
}

public sealed record ServiceResult<T>(
    ServiceResultStatus Status,
    T? Value = default,
    string? Message = null)
{
    public static ServiceResult<T> Success(T value) => new(ServiceResultStatus.Success, value);

    public static ServiceResult<T> Created(T value) => new(ServiceResultStatus.Created, value);

    public static ServiceResult<T> Unauthorized(string message) => new(ServiceResultStatus.Unauthorized, Message: message);

    public static ServiceResult<T> Forbidden(string message) => new(ServiceResultStatus.Forbidden, Message: message);

    public static ServiceResult<T> NotFound(string? message = null) => new(ServiceResultStatus.NotFound, Message: message);

    public static ServiceResult<T> BadRequest(string message) => new(ServiceResultStatus.BadRequest, Message: message);

    public static ServiceResult<T> Conflict(string message) => new(ServiceResultStatus.Conflict, Message: message);

    public static ServiceResult<T> Problem(string message) => new(ServiceResultStatus.Problem, Message: message);
}
