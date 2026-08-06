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

## Deploy

This repo is now set up for a single-service deployment:
- Build the React client
- Start the Node/Express server
- Serve the built client from the same host in production

That keeps auth cookies and Socket.IO on the same origin, which is the simplest reliable setup for this app.

### Render

The repo includes [render.yaml](render.yaml) for a Render web service.

Required environment variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`

Recommended value for `CLIENT_ORIGIN`:
- your final HTTPS app URL, for example `https://devcollab.onrender.com`

Deploy flow:
1. Create a MongoDB database reachable from the internet, such as MongoDB Atlas.
2. In Render, create a new Blueprint deployment from this repo.
3. Set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN`.
4. Deploy and open `/api/health` to confirm the backend is live.

If you deploy to another Node host, use the same pattern:
- build command: `npm install && npm run build`
- start command: `npm run start`

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

