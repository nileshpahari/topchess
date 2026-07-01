# ♟️ TopChess

TopChess is a real-time, multiplayer chess platform built as a **Turborepo monorepo**. It provides live gameplay with matchmaking, time controls, in-game chat, and ELO ratings.

## Key Features

- **Real-Time Multiplayer** — WebSocket-driven live gameplay with instant move broadcasting and spectator support.
- **Matchmaking** — Queue-based matchmaking by time control; games start automatically when two players match.
- **Server-Side Move Validation** — `chess.js` validates every move on the server, preventing illegal plays.
- **Multiple Time Controls** — Bullet (1 min), Blitz (5 min), Rapid (10 min), and Classical (30 min).
- **Game Modes** — Casual and Rated play with guest account support.
- **ELO Rating System** — Player ratings (default 1200) with per-game rating changes tracked for both players.
- **In-Game Chat** — Real-time chat messages within active games, with database persistence.
- **OAuth Authentication** — Sign in with Google or GitHub, or play as a guest with JWT-based sessions.
- **Game State Persistence** — Full game history including every move (FEN, SAN, time taken), opening names, and results stored in PostgreSQL.


## Installation & Running


### Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `@repo/db` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | `http` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `http` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | `http` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `http` | GitHub OAuth client secret |
| `JWT_SECRET` | `http`, `ws` | Secret for signing JWTs |
| `COOKIE_SECRET` | `http` | Secret for session cookies |
| `ALLOWED_HOSTS` | `http`, `ws` | Allowed CORS origins |
| `CLIENT_URL` | `http` | Frontend URL for OAuth redirects |
| `AUTH_REDIRECT_URL` | `http` | OAuth callback redirect URL |
| `NEXT_PUBLIC_BACKEND_URL` | `web` | HTTP API URL |
| `NEXT_PUBLIC_WS_URL` | `web` | WebSocket URL |

### Setup

```bash
# Clone the repository
git clone https://github.com/nileshpahari/topchess.git
cd topchess

# Install dependencies
bun install

# Configure environment variables in .env files for each app/package

# Generate Prisma client
bun run --filter @repo/db db:generate

# Push the database schema (or run migrations)
bun run --filter @repo/db db:push
```

### Development

```bash
# Run all apps in development mode
bun run dev

# Run a specific app
bunx turbo dev --filter=web    # Frontend        → http://localhost:3000
bunx turbo dev --filter=http   # HTTP API        → http://localhost:8000
bunx turbo dev --filter=ws     # WebSocket server → ws://localhost:8080
```

### Build

```bash
# Build all apps and packages
bun run build

# Build a specific app
bunx turbo build --filter=web
```

### Other Commands

```bash
# Lint all apps and packages
bun run lint

# Type-check all apps and packages
bun run check-types

# Format code with Prettier
bun run format

# Open Prisma Studio (database GUI)
bun run --filter @repo/db db:studio
```

## Project Structure

```
topchess/
├── apps/
│   ├── web/          # Main chess web application (Next.js, TailwindCSS)
│   ├── http/         # REST API & auth server (Express)
│   └── ws/           # WebSocket game server (ws, chess.js)
│
├── packages/
│   ├── db/                  # Prisma schema & client (PostgreSQL)
│   ├── store/               # Redux Toolkit store (chess board & user state)
│   ├── ui/                  # Shared React component library
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Shared TypeScript configurations
│
├── turbo.json        # Turborepo pipeline configuration
├── package.json      # Root workspace configuration
└── bun.lock          # Bun lockfile
```

### Apps

| App | Stack | Port | Description |
|-----|-------|------|-------------|
| `web` | Next.js, TailwindCSS, Redux, chess.js | 3000 | Main chess UI — play, spectate, chat, view game history |
| `http` | Express | 8000 | REST API for auth (Google/GitHub/Guest OAuth) and game listings |
| `ws` | ws, chess.js| 8080 | Real-time game engine — matchmaking, move validation, time controls, chat |

### Packages

| Package | Description |
|---------|-------------|
| `@repo/db` | Prisma ORM with PostgreSQL — defines all the models
| `@repo/store` | Redux Toolkit store with slices for chess board state and user auth |
| `@repo/ui` | Shared React component library consumed by the web app |
| `@repo/eslint-config` | ESLint flat configs |
| `@repo/typescript-config` | Shared `tsconfig.json` presets |
