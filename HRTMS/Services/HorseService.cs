using HRTMS.Models.DTOs;
using HRTMS.Services.Rules;
using HRTMS.Models.Horses;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IHorseService
{
    Task<IReadOnlyList<HorseResponse>> GetHorsesAsync();
    Task<ServiceResult<HorseResponse>> GetHorseAsync(string id);
    Task<ServiceResult<IReadOnlyList<HorseResponse>>> GetHorsesByOwnerAsync(string ownerId);
    Task<ServiceResult<HorseResponse>> CreateHorseAsync(CreateHorseRequest request);
    Task<ServiceResult<HorseResponse>> UpdateHorseAsync(string id, UpdateHorseRequest request);
    Task<ServiceResult<bool>> DeleteHorseAsync(string id);
}

public sealed class HorseService : IHorseService
{
    private readonly IHorseRepository _horseRepository;
    private readonly TimeProvider _timeProvider;

    public HorseService(IHorseRepository horseRepository, TimeProvider timeProvider)
    {
        _horseRepository = horseRepository;
        _timeProvider = timeProvider;
    }

    public Task<IReadOnlyList<HorseResponse>> GetHorsesAsync()
    {
        return _horseRepository.GetResponsesAsync();
    }

    public async Task<ServiceResult<HorseResponse>> GetHorseAsync(string id)
    {
        var horse = await _horseRepository.GetResponseByIdAsync(id);
        return horse is null
            ? ServiceResult<HorseResponse>.NotFound()
            : ServiceResult<HorseResponse>.Success(horse);
    }

    public async Task<ServiceResult<IReadOnlyList<HorseResponse>>> GetHorsesByOwnerAsync(string ownerId)
    {
        if (!await _horseRepository.OwnerExistsAsync(ownerId))
        {
            return ServiceResult<IReadOnlyList<HorseResponse>>.NotFound("Owner account does not exist.");
        }

        return ServiceResult<IReadOnlyList<HorseResponse>>.Success(
            await _horseRepository.GetResponsesByOwnerAsync(ownerId));
    }

    public async Task<ServiceResult<HorseResponse>> CreateHorseAsync(CreateHorseRequest request)
    {
        var horseId = request.HorseId.Trim();
        if (await _horseRepository.ExistsAsync(horseId))
        {
            return ServiceResult<HorseResponse>.Conflict("Horse ID already exists.");
        }

        var validation = await ValidateRequestAsync(request);
        if (validation.Error is not null)
        {
            return ServiceResult<HorseResponse>.BadRequest(validation.Error);
        }

        var horse = new Horse
        {
            HorseId = horseId,
            HourseName = request.HorseName.Trim(),
            Breed = request.Breed.Trim(),
            Age = request.Age,
            Weight = request.Weight,
            Documents = request.Documents.Trim(),
            Health_Cert_Expiry = request.HealthCertExpiry,
            StatusId = validation.StatusId,
            OwnerId = request.OwnerId.Trim()
        };

        _horseRepository.Add(horse);
        await _horseRepository.SaveChangesAsync();

        return ServiceResult<HorseResponse>.Created(ToResponse(horse, validation.StatusCode!));
    }

    public async Task<ServiceResult<HorseResponse>> UpdateHorseAsync(string id, UpdateHorseRequest request)
    {
        var horse = await _horseRepository.GetByIdAsync(id);
        if (horse is null)
        {
            return ServiceResult<HorseResponse>.NotFound();
        }

        var validation = await ValidateRequestAsync(request);
        if (validation.Error is not null)
        {
            return ServiceResult<HorseResponse>.BadRequest(validation.Error);
        }

        horse.HourseName = request.HorseName.Trim();
        horse.Breed = request.Breed.Trim();
        horse.Age = request.Age;
        horse.Weight = request.Weight;
        horse.Documents = request.Documents.Trim();
        horse.Health_Cert_Expiry = request.HealthCertExpiry;
        horse.StatusId = validation.StatusId;
        horse.OwnerId = request.OwnerId.Trim();

        await _horseRepository.SaveChangesAsync();
        return ServiceResult<HorseResponse>.Success(ToResponse(horse, validation.StatusCode!));
    }

    public async Task<ServiceResult<bool>> DeleteHorseAsync(string id)
    {
        var horse = await _horseRepository.GetByIdAsync(id);
        if (horse is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _horseRepository.Remove(horse);
        var saved = await _horseRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Horse cannot be deleted because it is in use.");
        }

        return ServiceResult<bool>.Success(true);
    }

    private async Task<(string? Error, int StatusId, string? StatusCode)> ValidateRequestAsync(HorseRequest request)
    {
        if (!await _horseRepository.OwnerExistsAsync(request.OwnerId))
        {
            return ("Horse owner account does not exist.", 0, null);
        }

        var status = await _horseRepository.GetActiveStatusAsync(request.StatusCode);
        if (status is null)
        {
            return ("Horse status does not exist or is inactive.", 0, null);
        }

        if (status.StatusCode == HorseStatusCodes.Eligible &&
            !SchedulingRules.IsCertificateValidFor(
                request.HealthCertExpiry,
                SchedulingRules.LocalNow(_timeProvider).Date))
        {
            return ("An eligible horse must have a current health certificate.", 0, null);
        }

        return (null, status.StatusId, status.StatusCode);
    }

    private static HorseResponse ToResponse(Horse horse, string statusCode)
    {
        return new HorseResponse(
            horse.HorseId,
            horse.HourseName,
            horse.Breed,
            horse.Age,
            horse.Weight,
            horse.Documents,
            horse.Health_Cert_Expiry,
            horse.StatusId,
            statusCode,
            horse.OwnerId);
    }
}
