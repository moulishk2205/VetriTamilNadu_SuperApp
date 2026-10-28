# Vetri TN — How to Run the Project in VS Code

This guide walks you through running the whole project on your machine with VS Code, from a fresh clone to a working app.

The project has three parts:

| Part | Tech | Folder | Runs on |
|---|---|---|---|
| **Frontend** | React 19 + Vite + TypeScript | `vetri-app/` (repo root) | http://localhost:5173 |
| **Backend** | NestJS 10 + Prisma 5 | `vetri-app/backend/` | http://localhost:4000 (API under `/api`) |
| **Database** | PostgreSQL 16 + Redis 7 | via Docker (`backend/docker-compose.yml`) | `localhost:5432` / `localhost:6379` |

> ### ⚠️ Read this first: the start-up order
> This document explains **Frontend → Backend → Database**, but you must **start** them in the opposite order:
>
> **1. Database (Postgres + Redis) → 2. Backend → 3. Frontend**
>
> The backend crashes if the database isn't up yet, and the frontend shows errors if the backend isn't up yet.
> A short checklist is in [Section 5 — Daily start-up](#5-daily-start-up-the-short-version).

---

## 0. One-time prerequisites

Install these once:

| Tool | Version | Check with |
|---|---|---|
| **Node.js** | 20 LTS or newer | `node -v` |
| **npm** | comes with Node | `npm -v` |
| **Docker Desktop** | latest | `docker -v` and `docker compose version` |
| **VS Code** | latest | — |
| **Git** | any | `git --version` |

Recommended VS Code extensions: **ESLint**, **Prisma**, **Docker**, **Prettier**.

### Open the project in VS Code

```bash
cd ~/vetri-app
```

```bash
code .
```

(If `code` isn't found, open VS Code, press `Cmd+Shift+P`, and run **"Shell Command: Install 'code' command in PATH"**.)

### Use three terminals

In VS Code, open the terminal with `` Ctrl+` `` and split it with the **+** button. Keep three tabs open:

| Terminal | Folder | Used for |
|---|---|---|
| **T1 – DB** | `vetri-app/backend` | Docker (Postgres + Redis) |
| **T2 – Backend** | `vetri-app/backend` | NestJS server |
| **T3 – Frontend** | `vetri-app` | Vite dev server |

---

## 1. Frontend (React + Vite)

The frontend is in the **repo root** (`vetri-app/`).

### 1.1 Install dependencies (first time only)

In **T3**:

```bash
cd ~/vetri-app
```

```bash
npm install
```

### 1.2 Environment file

The frontend reads its config from `.env.local`. The repo already ships one. If it's missing, create it from the example:

```bash
cp .env.example .env.local
```

It should contain:

```env
VITE_API_URL=http://localhost:4000
VITE_ENABLE_MSW=false
```

| Variable | Meaning |
|---|---|
| `VITE_API_URL` | Backend origin. Every request goes to `http://localhost:4000/api/*`. |
| `VITE_ENABLE_MSW` | `false` = use the **real backend** (default). `true` = use the in-browser **mock backend** (no backend or DB needed). |

> If you change `.env.local`, stop the dev server (`Ctrl+C`) and start it again. Vite reads env files only at start-up.

### 1.3 Run the frontend

```bash
npm run dev
```

Open **http://localhost:5173**

### 1.4 Other frontend commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server with hot reload (port 5173) |
| `npm run build` | Builds for production into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

### 1.5 Option: run the frontend ALONE (offline, no backend or DB)

To look at the UI without starting the backend or the database:

```bash
VITE_ENABLE_MSW=true VITE_API_BASE_URL=/api npx vite --port 5179 --strictPort
```

Open **http://localhost:5179**. All data comes from the MSW mocks inside the browser.

---

## 2. Backend (NestJS + Prisma)

The backend is in `vetri-app/backend/`.

> **Before you continue, start the database first ([Section 3](#3-database-postgresql--redis)).** The backend needs Postgres and Redis to be running.

### 2.1 Install dependencies (first time only)

In **T2**:

```bash
cd ~/vetri-app/backend
```

```bash
npm install
```

### 2.2 Environment file

The backend reads `backend/.env`. If it doesn't exist, create it from the example:

```bash
cp .env.example .env
```

The important values (the defaults already match the Docker database):

```env
NODE_ENV=development
PORT=4000
API_PREFIX=api
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://vetri:vetri@localhost:5432/vetri?schema=public

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret

GATEWAY_MODE=mock
```

> `CORS_ORIGIN` must match the frontend URL. If you run the frontend on a different port (for example 5179), update it here or the browser will block requests.

### 2.3 Generate the Prisma client (first time, and after every `schema.prisma` change)

```bash
npm run prisma:generate
```

### 2.4 Create the tables and load demo data

Do this **once** on a fresh database (after Section 3 is running):

```bash
npm run prisma:deploy
```

```bash
npm run db:seed
```

- `prisma:deploy` applies the migrations in `prisma/migrations/` and creates all the tables.
- `db:seed` loads the demo citizens, schemes, officers, and so on.

> **If `prisma:deploy` fails** (for example, the database already has tables created another way), sync the schema directly instead:
> ```bash
> npx prisma db push
> ```

### 2.5 Run the backend

```bash
npm run start:dev
```

Wait for the line **"Nest application successfully started"**.

| URL | What it is |
|---|---|
| http://localhost:4000/health | Health check (should return OK) |
| http://localhost:4000/api | API base used by the frontend |
| **http://localhost:4000/api/docs** | **Swagger UI**, where you can browse and test every endpoint |

### 2.6 Other backend commands

| Command | What it does |
|---|---|
| `npm run start:dev` | Dev server with auto-restart on file changes |
| `npm run start` | Starts once (no watch) |
| `npm run build` | Compiles to `dist/` (app + seed) |
| `npm run start:prod` | Runs the compiled build (`node dist/main.js`) |
| `npm run lint` | ESLint with auto-fix |
| `npm run test` | Unit tests (Jest) |
| `npm run prisma:generate` | Regenerates the Prisma client |
| `npm run prisma:migrate` | Creates a **new** migration after you edit `schema.prisma` |
| `npm run prisma:deploy` | Applies existing migrations |
| `npm run prisma:studio` | Opens a visual DB browser at http://localhost:5555 |
| `npm run db:seed` | Loads demo data |
| `npm run db:reset` | ⚠️ **Deletes all data**, re-runs migrations, and re-seeds |

### 2.7 Demo login

- The OTP is always **`123456`** (`GATEWAY_MODE=mock`).
- The demo citizen is **Chandramoulishwarar K** (`TN-2024-XXXX-8842`), who is the first citizen in the seed.

---

## 3. Database (PostgreSQL + Redis)

The database runs in **Docker** using `backend/docker-compose.yml`. That one file defines four services:

| Service | Container | Port | Login |
|---|---|---|---|
| `postgres` | `vetri-postgres` | 5432 | user `vetri` / password `vetri` / database `vetri` |
| `redis` | `vetri-redis` | 6379 | — |
| `pgadmin` | `vetri-pgadmin` | 5050 | `admin@vetri.tn` / `admin` |
| `backend` | `vetri-backend` | 4000 | (the backend in a container; see 3.5) |

### 3.1 Start Docker Desktop

Open the **Docker Desktop** app and wait until it shows **"Engine running"**.

### 3.2 Start Postgres and Redis

In **T1**:

```bash
cd ~/vetri-app/backend
```

```bash
docker compose up -d postgres redis
```

This starts **only** the database and Redis. You then run the backend yourself from VS Code (Section 2), with hot reload.

### 3.3 Check that they're healthy

```bash
docker compose ps
```

Both `vetri-postgres` and `vetri-redis` should show **`(healthy)`**. Now go back to **Section 2.3** and continue.

### 3.4 Optional: pgAdmin (a GUI for the database)

```bash
docker compose up -d pgadmin
```

1. Open **http://localhost:5050** and log in with `admin@vetri.tn` / `admin`.
2. Click **Add New Server**:
   - **Host:** `postgres` (the container name, **not** localhost)
   - **Port:** `5432`
   - **Username / Password:** `vetri` / `vetri`
   - **Database:** `vetri`

A simpler option is `npm run prisma:studio` from the `backend/` folder.

### 3.5 Option: run the whole backend stack in Docker (no Node needed for the backend)

```bash
docker compose up -d --build
```

This builds and starts Postgres, Redis, the backend, and pgAdmin. On boot, the backend container syncs the schema and **seeds automatically if the DB is empty**. Check its logs with:

```bash
docker compose logs -f backend
```

> ⚠️ Don't run this **and** `npm run start:dev` at the same time. Both use port 4000. Pick one.

### 3.6 Useful database commands

| Command | What it does |
|---|---|
| `docker compose ps` | Shows container status |
| `docker compose logs -f postgres` | Follows the Postgres logs |
| `docker compose stop` | Stops the containers (**data is kept**) |
| `docker compose start` | Starts the stopped containers again |
| `docker compose down` | Removes the containers (**data is kept** in the `vetri-pgdata` volume) |
| `docker compose down -v` | ⚠️ Removes containers **and deletes all DB data** |
| `docker exec -it vetri-postgres psql -U vetri -d vetri` | Opens a SQL shell inside Postgres |

---

## 4. First-time setup: the full sequence

Run these in order the very first time:

```bash
# T1 — Database
cd ~/vetri-app/backend
docker compose up -d postgres redis
docker compose ps                 # wait for (healthy)

# T2 — Backend
cd ~/vetri-app/backend
npm install
cp .env.example .env              # only if .env doesn't exist
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
npm run start:dev                 # leave running

# T3 — Frontend
cd ~/vetri-app
npm install
cp .env.example .env.local        # only if .env.local doesn't exist
npm run dev                       # leave running
```

Then open **http://localhost:5173** 🎉

---

## 5. Daily start-up (the short version)

After the first-time setup, this is all you need each day:

1. Open **Docker Desktop**.
2. **T1:** `cd ~/vetri-app/backend && docker compose up -d postgres redis`
3. **T2:** `cd ~/vetri-app/backend && npm run start:dev`
4. **T3:** `cd ~/vetri-app && npm run dev`
5. Open **http://localhost:5173**

**To stop:** press `Ctrl+C` in T2 and T3, then run `docker compose stop` in T1.

---

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| `Can't reach database server at localhost:5432` | Docker isn't running, or Postgres isn't up. Open Docker Desktop and run `docker compose up -d postgres redis`. |
| `ECONNREFUSED 127.0.0.1:6379` | Redis isn't running. Run `docker compose up -d redis`. |
| `Port 4000 / 5173 / 5432 is already in use` | Find the process with `lsof -i :4000` and stop it with `kill -9 <PID>`. Or stop the Docker `backend` container if it's running. |
| Frontend shows network or CORS errors | Make sure the backend is running, and that `CORS_ORIGIN` in `backend/.env` matches the frontend URL. |
| `@prisma/client did not initialize yet` | Run `npm run prisma:generate` in `backend/`. |
| Tables missing / `relation does not exist` | Run `npm run prisma:deploy` (or `npx prisma db push`), then `npm run db:seed`. |
| Demo login doesn't work | The database isn't seeded. Run `npm run db:seed`. If the data is messed up, run `npm run db:reset`. |
| You want a completely fresh database | `docker compose down -v`, then `docker compose up -d postgres redis`, then `npm run prisma:deploy`, then `npm run db:seed`. |
| Env changes are ignored | Restart the dev server. Vite and Nest read env files only at start-up. |

---

## 7. Quick reference of URLs

| What | URL |
|---|---|
| Frontend app | http://localhost:5173 |
| Frontend (offline / MSW mode) | http://localhost:5179 |
| Backend API | http://localhost:4000/api |
| Swagger API docs | http://localhost:4000/api/docs |
| Health check | http://localhost:4000/health |
| Prisma Studio | http://localhost:5555 |
| pgAdmin | http://localhost:5050 |
