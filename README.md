# StayConnect

Monorepo with a minimal JSON API (server) and React frontend (client).

Quick start

Server:

```bash
cd server
npm install
# development
node index.js
# or with nodemon
# npx nodemon index.js
```

Client:

```bash
cd client
npm install
npm run dev
```

The server runs on http://localhost:4000 and the client Vite dev server runs on http://localhost:5173 by default. The client is configured to call the API at http://localhost:4000.

Notes
- Authentication uses JWT (dev secret in .env or fallback).
- SQLite file is server/db.sqlite (auto-created).
- This is a minimal demo scaffold.
