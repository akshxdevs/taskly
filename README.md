# go-taskly
Minimal task management API in Go with JWT auth, SQLite persistence, and Redis-backed token lookup.

[![Build](https://img.shields.io/badge/build-go%20test%20.%2F...-brightgreen)](https://github.com/akshxdevs/go-taskly)
[![Go Version](https://img.shields.io/badge/go-1.25.6-00ADD8?logo=go)](https://go.dev/)
[![Go Report Card](https://goreportcard.com/badge/github.com/akshxdevs/go-taskly)](https://goreportcard.com/report/github.com/akshxdevs/go-taskly)
[![Latest Release](https://img.shields.io/github/v/release/akshxdevs/go-taskly)](https://github.com/akshxdevs/go-taskly/releases)
[![License](https://img.shields.io/badge/license-unlicensed-lightgrey)](https://github.com/akshxdevs/go-taskly)

## 🔍 Overview
`go-taskly` is an HTTP API for task CRUD plus user signup/login and auth verification.  
The codebase favors small, explicit layers:
- `server`: HTTP transport and request validation.
- `database`: persistence abstraction and SQLite implementation.
- `redis`: centralized Redis client setup for token cache/read paths.

The project is intentionally simple to keep latency low, startup fast, and local development friction near zero.

## ✅ Key Features
- JWT-based authentication (`HS256`) with explicit middleware on task routes.
- Strict JSON decoding (`DisallowUnknownFields`) to reject ambiguous payloads.
- SQLite persistence with schema bootstrap on startup.
- Redis token caching to support `/api/v1/user/auth/{id}` token verification flow.
- Clear HTTP status mapping for invalid input, missing resources, and auth failures.
- Graceful shutdown with timeout-based server drain.

## 🧱 Architecture / Design
The service follows a transport/service-store style:
- HTTP handlers in `internal/server/routes.go` own request parsing, validation, and response formatting.
- `database.Service` defines the persistence contract used by handlers, enabling mock-backed route tests.
- SQLite is used as the source of truth for users and tasks.
- Redis is used as a fast token cache keyed by user ID (`auth:token:<uuid>`).

Why this design:
- Interface-first DB access keeps handler logic testable without a running DB.
- SQLite reduces operational overhead for local and single-node deployments.
- Redis decouples token lookup from request body parsing for auth-check endpoints.

## 🛠️ Tech Stack (and Why)
- Go `1.25.6`: small runtime footprint, strong stdlib HTTP tooling.
- `net/http`: no framework lock-in, transparent routing and middleware behavior.
- SQLite (`mattn/go-sqlite3`): file-based reliability and easy local bootstrap.
- Redis (`redis/go-redis/v9`): low-latency ephemeral token storage.
- JWT (`golang-jwt/jwt/v5`): interoperable token format with standard claims.
- `bcrypt` (`x/crypto`): password hash verification in login flow.

## 📦 Installation & Setup
### Prerequisites
- Go `1.25+`
- Redis `6+` (or compatible)

### Clone and run
```bash
git clone git@github.com:akshxdevs/go-taskly.git
cd go-taskly
go mod tidy
make run
```

### Build and test
```bash
make build
make test
```

## ⚙️ Configuration
The app reads environment variables via `.env` autoload.

```env
PORT=8080
BLUEPRINT_DB_URL=taskly.db
AUTH_SECRET=replace-with-strong-secret
REDIS_ADDR=127.0.0.1:6379
REDIS_PASSWORD=
REDIS_DB=0
```

Notes:
- `AUTH_SECRET` must be set and consistent across login + auth verification.
- `BLUEPRINT_DB_URL` defaults to `test.db` if unset.
- Redis is optional at startup, but token-cache-dependent flows degrade if Redis is unavailable.

## 🚀 Usage Examples
### 1. Sign up
```bash
curl -X POST http://localhost:8080/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"pass1234"}'
```

### 2. Login and receive JWT
```bash
curl -X POST http://localhost:8080/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"pass1234"}'
```

### 3. Create a task (authorized)
```bash
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Write docs","description":"README cleanup","status":"todo"}'
```

### 4. Verify auth status by user ID
```bash
curl http://localhost:8080/api/v1/user/auth/<user-uuid>
```

## 📚 API / Core Modules
### HTTP Endpoints
- `GET /` health greeting.
- `GET /health` DB health/status metadata.
- `POST /api/v1/user/signup`
- `POST /api/v1/user/login`
- `GET /api/v1/user/auth/{id}`
- `POST /api/v1/tasks` (auth middleware)
- `GET /api/v1/tasks` (auth middleware)
- `GET /api/v1/tasks/{id}` (auth middleware)
- `PATCH /api/v1/tasks/{id}` (auth middleware)
- `DELETE /api/v1/tasks/{id}` (auth middleware)
- `DELETE /api/v1/tasks` (auth middleware)

### Internal Abstractions
```go
type Service interface {
    CreateTask(ctx context.Context, title, description, status string) (Task, error)
    GetTaskByID(ctx context.Context, id int64) (Task, error)
    CreateUser(ctx context.Context, username, email, password string) (User, error)
    CheckUserById(ctx context.Context, id string) (UserAuth, error)
}
```

```go
if s.redis != nil {
    _ = s.redis.Set(r.Context(), "auth:token:"+user.Id.String(), token, time.Hour).Err()
}
```

## 🔐 Authentication / Security
- Passwords are stored hashed (bcrypt), never returned in API payloads.
- JWT uses `sub` claim for user ID and `exp` for token expiration.
- Task endpoints require `Authorization: Bearer <token>`.
- Middleware validates token format, signing method (`HS256`), signature, and non-empty `sub`.
- CORS is enabled globally with explicit allow headers/methods.

## 🗄️ Database / Storage Design
SQLite schema is auto-created at startup:
- `users` table: `id`, `username`, `email (unique)`, `password`, `created_at`.
- `tasks` table: task metadata plus `user_id` FK reference to `users(id)` with `ON DELETE CASCADE`.

Design rationale:
- One-file persistence is easy to back up and run locally.
- FK enforcement keeps task-user integrity without application-side joins for every write.

## ⚡ Caching / Performance
- Redis client is initialized once (`sync.Once`) in `internal/redis/redis.go`.
- Login writes token to Redis with 1 hour TTL.
- `/api/v1/user/auth/{id}` reads the cached token by `auth:token:<user-id>` and validates JWT claims.
- Server timeouts are explicitly configured as `ReadTimeout: 10s`, `WriteTimeout: 30s`, and `IdleTimeout: 60s`.

## 🧯 Error Handling & Edge Cases
- Invalid JSON payloads return `400` through strict decoder.
- Invalid IDs (`task id`, `uuid`) return `400`.
- Missing records return `404` where applicable (`ErrTaskNotFound`).
- Auth failures return `401` for invalid/expired credentials/tokens.
- DB and Redis failures are logged with context.

## 📁 Project Structure
```text
.
├── cmd/
│   └── api/main.go
├── internal/
│   ├── database/database.go
│   ├── redis/redis.go
│   └── server/
│       ├── middleware.go
│       ├── routes.go
│       ├── routes_test.go
│       └── server.go
├── Makefile
├── go.mod
└── README.md
```

## 🔄 Development Workflow
```bash
make run     # start API
make watch   # live reload via air
make test    # run tests
make build   # build binary
```

Local workflow expectations:
- keep handlers thin and push storage concerns behind `database.Service`
- add/adjust route tests when behavior changes
- run `go test ./...` before commits

## 🧪 Testing Strategy
- Unit-style route tests in `internal/server/routes_test.go`.
- `mockDB` satisfies `database.Service` to isolate HTTP behavior from real DB I/O.
- Coverage targets HTTP status behavior, request validation, and route-level regressions.

Suggested next layer:
- integration tests for SQLite + Redis interactions in auth flow.

## 🚢 Deployment Notes
- Default runtime port: `8080` (`PORT` env override).
- Requires writable filesystem path for SQLite DB file.
- Requires stable `AUTH_SECRET` across instances.
- Redis should be reachable from app runtime for auth-cache flow.
- Graceful shutdown handles `SIGINT`/`SIGTERM` with a 5s timeout.

## ⚖️ Limitations & Trade-offs
- SQLite limits horizontal write scaling without additional coordination.
- Current auth verification endpoint is Redis-cache-dependent by user ID.
- No token revocation list beyond TTL-based key expiry.
- No migrations framework yet; schema bootstrap is inline SQL.
- No published OpenAPI spec yet.

## 🗺️ Roadmap / Future Improvements
- Attach tasks to authenticated user identity in handlers and queries.
- Add refresh-token flow and explicit logout invalidation.
- Add request-scoped structured logging and trace IDs.
- Add migration tooling (`goose` or `atlas`) for schema evolution.
- Add CI workflow with coverage publishing and lint gates.
- Generate OpenAPI docs and client SDK stubs.

## 🤝 Contributing Guidelines
1. Fork the repo and create a feature branch.
2. Keep changes scoped and include tests for behavior changes.
3. Run `go test ./...` and ensure no regressions.
4. Open a PR with clear problem statement and implementation notes.

Conventions:
- prefer small handlers and explicit error responses
- keep storage changes behind `database.Service`
- avoid breaking API response shapes without documenting migration notes

## 📄 License
No license file is currently present in the repository.  
Add a `LICENSE` file (for example, MIT or Apache-2.0) before distributing beyond internal/team usage.
