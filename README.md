# HRTMS Paddock Portal

Horse Racing Tournament Management System gồm:

- `HRTMS/`: ASP.NET Core 8 + EF Core + SQL Server backend.
- `Racing Hub Portal (1)/`: TanStack Start frontend từ Racing Hub Portal.

## Chạy backend

1. Kiểm tra connection string trong `HRTMS/appsettings.json`. Có thể dùng
   `HRTMS/appsettings.example.json` làm mẫu.
2. Chạy:

```powershell
dotnet run --project HRTMS
```

Ở môi trường Development, backend tự chạy migration và seed dữ liệu demo.
Health check: `http://localhost:5199/api/health`.

Nếu SDK không nhận `HRTMS.slnx`, build trực tiếp project:

```powershell
dotnet build HRTMS\HRTMS.csproj -c Release
```

## Chạy frontend

```powershell
cd "Racing Hub Portal (1)"
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend mở tại `http://localhost:5173`.

- Có `.env` với `VITE_API_URL=http://localhost:5199`: login và các thao tác
  Tracks, Tournaments, Races, Registrations, Publish Result đồng bộ sang API.
- Không có `VITE_API_URL`: portal vẫn chạy local demo bằng mock data và
  `localStorage`.

Các script Vite và Vitest đã có wrapper cho trường hợp workspace Windows chứa
ký tự `#`, ví dụ `D:\C#\...`.

## Tài khoản demo

| Vai trò | Username | Password |
| --- | --- | --- |
| Admin | `admin_super` | `admin123` |
| Referee | `ref_sarah` | `referee123` |
| Horse Owner | `owner_wayne` | `owner123` |
| Jockey | `jockey_smith` | `jockey123` |
| Spectator | `fan_alex` | `spectator123` |

## API chính

- `POST /api/login`
- `GET, POST /api/users`
- `GET, POST, PUT, DELETE /api/tracks`
- `GET, POST, PUT, DELETE /api/tournaments`
- `GET, POST, PUT, DELETE /api/horses`
- `GET, POST, PUT, DELETE /api/races`
- `GET, POST, PATCH /api/registrations`
- `GET, POST, PUT /api/race-results`
- `GET, POST, PUT /api/awards`
- `GET, POST, PUT, DELETE /api/rounds`
- `GET, POST, PUT, DELETE /api/referee-panels`
- `GET, POST, PATCH /api/jockey-invitations`

## Kiểm tra

```powershell
dotnet build HRTMS\HRTMS.csproj -c Release --no-restore
dotnet ef migrations has-pending-model-changes --project HRTMS --configuration Release
cd "Racing Hub Portal (1)"
npm run build
npm exec tsc -- --noEmit
npm test
```

`npm run lint` hiện còn báo nhiều lỗi format kế thừa từ source Lovable; build và
type-check là hai cổng kiểm tra chạy ứng dụng chính.
