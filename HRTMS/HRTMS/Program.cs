using Microsoft.EntityFrameworkCore;
using HRTMS.Data;
using HRTMS.Repositories;
using HRTMS.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Đăng ký DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS cho FE
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddScoped<IRaceRepository, RaceRepository>();
builder.Services.AddScoped<IRaceRepository, RaceRepository>();
builder.Services.AddScoped<HRTMS.Repositories.IHorseRepository, HRTMS.Repositories.HorseRepository>();
builder.Services.AddScoped<HRTMS.Services.IHorseService, HRTMS.Services.HorseService>();
builder.Services.AddScoped<IRegistrationRepository, RegistrationRepository>();
builder.Services.AddScoped<IRegistrationService, RegistrationService>();
builder.Services.AddScoped<IOwnerRepository, OwnerRepository>();
builder.Services.AddScoped<IOwnerService, OwnerService>();
builder.Services.AddScoped<IJockeyRepository, JockeyRepository>();
builder.Services.AddScoped<IJockeyService, JockeyService>();
builder.Services.AddScoped<IViolationRepository, ViolationRepository>();
builder.Services.AddScoped<IViolationService, ViolationService>();
builder.Services.AddScoped<IRaceResultRepository, RaceResultRepository>();
builder.Services.AddScoped<IRaceResultService, RaceResultService>();
builder.Services.AddScoped<HRTMS.Repositories.IUserRepository, HRTMS.Repositories.UserRepository>();
builder.Services.AddScoped<HRTMS.Services.IAuthService, HRTMS.Services.AuthService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();