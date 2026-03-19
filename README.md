# taskly
Minimal task management API in Go with JWT auth, SQLite persistence, Redis token cache, and Prometheus/Grafana observability.

[![Build](https://img.shields.io/badge/build-go%20test%20.%2F...-brightgreen)](https://github.com/akshxdevs/go-taskly)
[![Go Version](https://img.shields.io/badge/go-1.25.6-00ADD8?logo=go)](https://go.dev/)
[![Go Report Card](https://goreportcard.com/badge/github.com/akshxdevs/go-taskly)](https://goreportcard.com/report/github.com/akshxdevs/go-taskly)
[![Latest Release](https://img.shields.io/github/v/release/akshxdevs/go-taskly)](https://github.com/akshxdevs/go-taskly/releases)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

## Overview
`go-taskly` provides:
- user signup/login with JWT issuance
- task CRUD endpoints
- auth verification via Redis-backed token lookup
- built-in observability with Prometheus metrics and Grafana dashboards

## Key Features
- JWT auth middleware (`HS256`) for task APIs.
- Strict JSON parsing (`DisallowUnknownFields`) for safer payload handling.
- SQLite bootstrap with `users` and `tasks` schema initialization at startup.
- Redis token cache (`auth:token:<user-uuid>`) used by `/api/v1/user/auth/{id}`.
- Request metrics instrumentation via custom middleware.
- Preconfigured Prometheus alerts and Grafana dashboard.

## Tech Stack
- Go `1.25.6`
- `net/http` + `http.ServeMux`
- SQLite (`mattn/go-sqlite3`)
- Redis (`redis/go-redis/v9`)
- JWT (`golang-jwt/jwt/v5`)
- Prometheus + Grafana

## Installation
### Prerequisites
- Go `1.25+`
- Redis `6+`

### Run locally
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

## Configuration
Environment variables (autoloaded from `.env`):

```env
PORT=8080
BLUEPRINT_DB_URL=taskly.db
AUTH_SECRET=replace-with-strong-secret
REDIS_ADDR=127.0.0.1:6379
REDIS_PASSWORD=
REDIS_DB=0
```

Notes:
- `AUTH_SECRET` is required for login/auth validation.
- If `BLUEPRINT_DB_URL` is empty, SQLite defaults to `test.db`.
- Redis is optional at startup; token lookup flows depend on it.

## API Endpoints
Public:
- `GET /`
- `GET /health`
- `GET /metrics`
- `POST /api/v1/user/signup`
- `POST /api/v1/user/login`
- `GET /api/v1/user/auth/{id}` (`id` is user UUID)

Protected (requires `Authorization: Bearer <token>`):
- `POST /api/v1/tasks`
- `GET /api/v1/tasks`
- `GET /api/v1/task/{id}` (`id` is numeric task ID)
- `GET /api/v1/tasks/{id}` (`id` is user UUID, returns tasks for user)
- `PATCH /api/v1/tasks/{id}` (`id` is numeric task ID)
- `DELETE /api/v1/tasks/{id}` (`id` is numeric task ID)
- `DELETE /api/v1/tasks`

## Usage Examples
### Sign up
```bash
curl -X POST http://localhost:8080/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"pass1234"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"pass1234"}'
```

### Create task
```bash
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Write docs","description":"README cleanup","status":"todo","userId":"<user-uuid>"}'
```

## Core Functions (Server Layer)
`internal/server/routes.go`
- Route registration and request handling for health, tasks, and auth flows.
- Includes helpers for strict JSON decoding, response writing, password validation, username generation, and JWT creation.

`internal/server/middleware.go`
- `AuthMiddleware` validates bearer token and injects user id in context.
- `UserIDFromContext` retrieves user id from context.

`internal/server/observability.go`
- Captures per-request count and latency metrics for all routes except `/metrics`.

## Database Service Contract
`internal/database.Service` covers health checks, full task CRUD, user create/check flows, and connection close.  
It is used as the handler dependency to keep route tests DB-agnostic.

## Metrics (Complete)
Custom application metrics exposed at `/metrics`:
- `taskly_http_requests_total` (`CounterVec`)  
  Labels: `method`, `route`, `status`
- `taskly_http_request_duration_seconds` (`HistogramVec`)  
  Labels: `method`, `route`, `status`  
  Buckets: `prometheus.DefBuckets`  
  Exported series: `_bucket`, `_sum`, `_count`

Route labeling behavior:
- Uses `r.Pattern` (for example `GET /api/v1/tasks` route pattern value).
- Falls back to `route="unmatched"` when pattern is unavailable.
- `/metrics` requests are explicitly excluded from custom instrumentation.

Also exposed automatically by Prometheus Go client:
- Go runtime metrics (`go_*`)
- Process metrics (`process_*`)
- Promhttp handler metrics (for metric endpoint handling internals)

## Monitoring Stack (Prometheus + Grafana)
Included under `observability/`:
- Prometheus config: `observability/prometheus/prometheus.yml`
- Alert rules: `observability/prometheus/alerts.yml`
- Grafana datasource/dashboard provisioning
- Dashboard: `Taskly API Overview`

### Alerts configured
- `TasklyBackendDown`
- `TasklyHighErrorRate` (5xx ratio > 5% for 5m)
- `TasklyHighLatencyP95` (p95 latency > 500ms for 10m)

### Start full stack
```bash
docker compose up -d --build
```

### URLs
- API: `http://localhost:8090`
- API metrics: `http://localhost:8090/metrics`
- Prometheus: `http://localhost:9191`
- Grafana: `http://localhost:3200` (`admin` / `admin`)

### Stop stack
```bash
docker compose down
```

## Health Payload Fields
`GET /health` returns DB health plus connection stats:
- `status`, `message`, `error`
- `open_connections`, `in_use`, `idle`
- `wait_count`, `wait_duration`
- `max_idle_closed`, `max_lifetime_closed`

## Project Structure
```text
.
├── cmd/
│   └── api/main.go
├── internal/
│   ├── database/database.go
│   ├── redis/redis.go
│   └── server/
│       ├── middleware.go
│       ├── observability.go
│       ├── routes.go
│       ├── routes_test.go
│       └── server.go
├── observability/
│   ├── grafana/
│   └── prometheus/
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

## Development Commands
```bash
make run
make watch
make test
make build
```

## Current Limitations
- SQLite is great for local/single-node usage but not high write-scale distributed workloads.
- Auth verification endpoint depends on cached Redis token by user ID.
- No migration tool yet (schema bootstrap is inline SQL).
- No OpenAPI spec yet.

## License
Licensed under the [MIT License](LICENSE).
