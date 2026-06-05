namespace HRTMS.Services.Rules;

public static class SchedulingRules
{
    public const int RegistrationLeadDays = 5;
    public const int InvitationResponseLeadHours = 24;
    public const int RoundRestMinutes = 40;

    public static DateTime LocalNow(TimeProvider timeProvider)
    {
        return timeProvider.GetLocalNow().DateTime;
    }

    public static bool IsWithinTournament(DateTime scheduledAt, DateTime tournamentStart, DateTime tournamentEnd)
    {
        return scheduledAt.Date >= tournamentStart.Date && scheduledAt.Date <= tournamentEnd.Date;
    }

    public static bool IsRegistrationOpen(DateTime scheduledAt, DateTime localToday)
    {
        return scheduledAt.Date >= localToday.Date.AddDays(RegistrationLeadDays);
    }

    public static bool IsInvitationResponseOpen(DateTime scheduledAt, DateTime localNow)
    {
        return scheduledAt > localNow.AddHours(InvitationResponseLeadHours);
    }

    public static bool IsCertificateValidFor(DateTime expiryDate, DateTime requiredDate)
    {
        return expiryDate.Date >= requiredDate.Date;
    }
}
