# Horse Racing Tournament Management System (HRTMS)

Gộp từ hai dự án:
- **hrtms-paddock-portal-dev** — service layer, API integration, admin.awards với real API
- **Racing Hub Portal** — base project đầy đủ (auth, routes, shadcn/ui, mock data)

## Cấu trúc dự án

```
src/
├── api.ts                    # Axios instance dùng chung (Bearer token, error handling)
├── service/                  # Real API calls (từ Paddock Portal)
│   ├── index.ts
│   ├── awardAPI.ts           # GET /awards/:raceId, POST/PUT /races
│   ├── horseAPI.ts           # CRUD /horses
│   ├── horseRegisterAPI.ts   # CRUD /registrations
│   └── raceResultAPI.ts      # CRUD /raceResults
├── auth/                     # AuthContext, ProtectedRoute
├── components/
│   ├── common/               # Button, DataTable, FormModal, Sidebar, ...
│   └── ui/                   # shadcn/ui components
├── data/
│   ├── mockData.ts           # Mock data đầy đủ (dùng trong dev)
│   ├── mock-horses.json      # Mock horses data
│   └── mockUsers.ts
├── hooks/
├── lib/                      # mockApi, auditLog, racing logic, validators
├── routes/                   # Tất cả các routes (TanStack Router)
│   ├── admin.*               # Admin: races, awards, analytics, users, ...
│   ├── jockey.*              # Jockey: dashboard, schedule, performance, ...
│   ├── owner.*               # Owner: horses, registrations, invitations, ...
│   ├── referee.*             # Referee: pre-race check, results, violations, ...
│   └── spectator.*           # Spectator: dashboard, predictions, results, ...
└── types/
    └── horse.ts              # Horse, HorseDocument interfaces
```

## Cài đặt

```bash
npm install
cp .env.example .env
# Sửa VITE_API_URL trong .env
npm run dev
```

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `VITE_API_URL` | URL backend API | `http://localhost:5000/api` |

## Chuyển từ mock sang real API

Các routes hiện dùng `mockData.ts`. Để kết nối backend thật:

1. Thay import từ `@/data/mockData` sang `@/service/<tên service>`
2. Dùng `useEffect` + `useState` để fetch data
3. `admin.awards.tsx` đã tích hợp real API qua `getRaceAwards()`

## Tech Stack

- React 19 + TypeScript
- TanStack Router v1
- shadcn/ui + Tailwind CSS v4
- Axios (với interceptors auth)
- Vite 7
