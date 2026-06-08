# Deployment Instructions

## Backend

1. Cấu hình `ConnectionStrings:DefaultConnection`.
2. Đặt `Cors:AllowedOrigins` theo domain frontend.
3. Tắt seed demo ở môi trường thật:

```json
{
  "Database": {
    "ApplyMigrationsOnStartup": false,
    "SeedDemoData": false
  }
}
```

4. Chạy migration trước khi publish:

```powershell
dotnet ef database update --project HRTMS --configuration Release
dotnet publish HRTMS\HRTMS.csproj -c Release
```

## Frontend

Đặt biến môi trường build:

```text
VITE_API_URL=https://your-backend.example.com
```

Sau đó:

```powershell
cd HRTMS.Portal
npm ci
npm run build
```

Artifact frontend nằm trong `dist/`.
