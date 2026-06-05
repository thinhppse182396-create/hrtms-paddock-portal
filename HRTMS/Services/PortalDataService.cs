using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IPortalDataService
{
    Task<object> GetPortalDataAsync();
}

public sealed class PortalDataService : IPortalDataService
{
    private readonly IPortalDataRepository _portalDataRepository;

    public PortalDataService(IPortalDataRepository portalDataRepository)
    {
        _portalDataRepository = portalDataRepository;
    }

    public Task<object> GetPortalDataAsync()
    {
        return _portalDataRepository.GetPortalDataAsync();
    }
}
