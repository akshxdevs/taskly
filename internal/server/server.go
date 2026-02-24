package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"
	goredis "github.com/redis/go-redis/v9"

	"go-taskly/internal/database"
	tasklyredis "go-taskly/internal/redis"
)

type Server struct {
	port int

	db    database.Service
	redis *goredis.Client
}

func NewServer() *http.Server {
	defaultPort := 8080
	rawPort := os.Getenv("PORT")
	port, err := strconv.Atoi(rawPort)
	if err != nil {
		port = defaultPort
	}
	NewServer := &Server{
		port: port,

		db:    database.New(),
		redis: tasklyredis.New(),
	}

	if err := tasklyredis.Ping(context.Background()); err != nil {
		log.Printf("redis unavailable: %v", err)
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}
