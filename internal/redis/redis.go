package redis

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

var (
	client *goredis.Client
	once   sync.Once
)

func New() *goredis.Client {
	once.Do(func() {
		addr := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
		if addr == "" {
			addr = "127.0.0.1:6379"
		}

		db := 0
		if rawDB := strings.TrimSpace(os.Getenv("REDIS_DB")); rawDB != "" {
			if parsed, err := strconv.Atoi(rawDB); err == nil {
				db = parsed
			}
		}

		client = goredis.NewClient(&goredis.Options{
			Addr:     addr,
			Password: os.Getenv("REDIS_PASSWORD"),
			DB:       db,
		})
	})

	return client
}

func Ping(ctx context.Context) error {
	c := New()
	if c == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	return c.Ping(pingCtx).Err()
}

func Close() error {
	if client == nil {
		return nil
	}
	return client.Close()
}
