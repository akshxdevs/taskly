FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o /out/taskly ./cmd/api

FROM alpine:3.21

RUN apk add --no-cache ca-certificates sqlite-libs

WORKDIR /app

COPY --from=builder /out/taskly /app/taskly

EXPOSE 8080

ENV PORT=8080
ENV BLUEPRINT_DB_URL=/data/taskly.db
ENV AUTH_SECRET=change-me-in-production
ENV REDIS_ADDR=host.docker.internal:6379
ENV REDIS_PASSWORD=
ENV REDIS_DB=0

VOLUME ["/data"]

CMD ["/app/taskly"]
