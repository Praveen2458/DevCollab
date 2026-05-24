# DevCollab

Real-time developer collaboration workspace: rooms, live chat, and shared notes (MERN + Socket.IO).

## Stack
- **Client**: React + Vite + Tailwind CSS
- **Server**: Node.js + Express
- **DB**: MongoDB (Mongoose)
- **Auth**: JWT in **HTTP-only cookie**
- **Realtime**: Socket.IO

Notes for dev/testing:
- Cookie-based auth is shared across all tabs in the same browser profile. To test two different accounts at the same time (e.g. Tuco + Lalo), use an Incognito/InPrivate window or a different browser/profile.
- Use the same host consistently (prefer `http://localhost:5173`). `localhost` and `127.0.0.1` do not share cookies.

## Quick Start (Dev)

### 1) Configure environment
- Server env: copy `server/.env.example` → `server/.env` and adjust as needed.
- Client env (optional): copy `client/.env.example` → `client/.env`.

Note: In dev, Vite proxies `/api` and `/socket.io` to the backend so JWT cookies work reliably.

### 2) Run
From the repo root:

```bash
npm run dev
```

- Client: `http://localhost:5173`
- API (via proxy): `http://localhost:5173/api/health`
- API (direct): `http://localhost:5000/api/health`

## Core Features
- Signup / Login / Logout
- Protected dashboard routes
- Create rooms + join by Room ID
- Delete rooms (creator only)
- Live chat with sender + timestamps (persisted to MongoDB)
- Shared notes synced in realtime + autosaved to MongoDB

## Backend Structure
`server/src` is organized by:
- `routes/` `controllers/` `middleware/` `models/` `services/` `sockets/`

