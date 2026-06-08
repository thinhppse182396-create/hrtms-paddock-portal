using HRTMS.Data;
using HRTMS.Models.Roles;
using HRTMS.Repositories;
using HRTMS.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "Frontend";

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IPasswordHasher<Accounts>, PasswordHasher<Accounts>>();
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IAwardRepository, AwardRepository>();
builder.Services.AddScoped<IHorseRepository, HorseRepository>();
builder.Services.AddScoped<IJockeyInvitationRepository, JockeyInvitationRepository>();
builder.Services.AddScoped<IPortalDataRepository, PortalDataRepository>();
builder.Services.AddScoped<IPortalEntityRepository, PortalEntityRepository>();
builder.Services.AddScoped<IRaceRepository, RaceRepository>();
builder.Services.AddScoped<IRaceResultRepository, RaceResultRepository>();
builder.Services.AddScoped<IRefereeRepository, RefereeRepository>();
builder.Services.AddScoped<IRefereePanelRepository, RefereePanelRepository>();
builder.Services.AddScoped<IRegistrationRepository, RegistrationRepository>();
builder.Services.AddScoped<IRoundRepository, RoundRepository>();
builder.Services.AddScoped<ITournamentRepository, TournamentRepository>();
builder.Services.AddScoped<ITrackRepository, TrackRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAwardService, AwardService>();
builder.Services.AddScoped<IHorseService, HorseService>();
builder.Services.AddScoped<IJockeyInvitationService, JockeyInvitationService>();
builder.Services.AddScoped<IPortalDataService, PortalDataService>();
builder.Services.AddScoped<IPortalEntityService, PortalEntityService>();
builder.Services.AddScoped<IRaceService, RaceService>();
builder.Services.AddScoped<IRaceResultService, RaceResultService>();
builder.Services.AddScoped<IRefereeService, RefereeService>();
builder.Services.AddScoped<IRefereePanelService, RefereePanelService>();
builder.Services.AddScoped<IRegistrationService, RegistrationService>();
builder.Services.AddScoped<IRoundService, RoundService>();
builder.Services.AddScoped<ITournamentService, TournamentService>();
builder.Services.AddScoped<ITrackService, TrackService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:8080", "http://127.0.0.1:8080"];

        static bool IsPrivateNetworkHost(string host) =>
            host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || host.StartsWith("10.", StringComparison.Ordinal)
            || host.StartsWith("192.168.", StringComparison.Ordinal)
            || (host.StartsWith("172.", StringComparison.Ordinal)
                && int.TryParse(host.Split('.')[1], out var secondOctet)
                && secondOctet is >= 16 and <= 31);

        policy
            .WithOrigins(allowedOrigins)
            .SetIsOriginAllowed(origin =>
            {
                if (!builder.Environment.IsDevelopment()) return allowedOrigins.Contains(origin);
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                return (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
                    && (uri.Port == 8080 || uri.Port == 5173)
                    && IsPrivateNetworkHost(uri.Host);
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();
var seedOnly = args.Contains("--seed-only", StringComparer.OrdinalIgnoreCase);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (seedOnly || builder.Configuration.GetValue("Database:ApplyMigrationsOnStartup", app.Environment.IsDevelopment()))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();

    if (seedOnly || builder.Configuration.GetValue("Database:SeedDemoData", app.Environment.IsDevelopment()))
    {
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Accounts>>();
        var timeProvider = scope.ServiceProvider.GetRequiredService<TimeProvider>();
        await DemoDataSeeder.SeedAsync(dbContext, passwordHasher, timeProvider);
    }
}

if (seedOnly)
{
    return;
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseRouting();
app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    service = "HRTMS",
    timestamp = DateTimeOffset.UtcNow
}));

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");


app.Run();
