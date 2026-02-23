package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/mattn/go-sqlite3"
)

type Service interface {
	Health() map[string]string
	CreateTask(ctx context.Context, title, description, status string) (Task, error)
	UpdateTask(ctx context.Context, id int64, status string) (Task, error)
	DeleteTask(ctx context.Context, id int64) error
	DeleteAllTask(ctx context.Context) error
	GetAllTasks(ctx context.Context) ([]Task, error)
	GetTaskByID(ctx context.Context, id int64) (Task, error)
	Close() error
}

type Task struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"-"`
	UpdatedAt   time.Time `json:"-"`
}

var ErrTaskNotFound = errors.New("task not found")

type service struct {
	db  *sql.DB
	dsn string
}

var dbInstance *service

func New() Service {
	if dbInstance != nil {
		return dbInstance
	}

	dsn, err := prepareSQLiteDSN(os.Getenv("BLUEPRINT_DB_URL"))
	if err != nil {
		log.Fatalf("DB Failed! %v", err)
	}

	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		log.Fatal(err)
	}

	dbInstance = &service{db: db, dsn: dsn}
	if err := dbInstance.initTaskSchema(); err != nil {
		log.Fatalf("failed to initialize schema: %v", err)
	}
	return dbInstance
}

func prepareSQLiteDSN(raw string) (string, error) {
	dsn := strings.TrimSpace(raw)
	if dsn == "" {
		dsn = "test.db"
	}

	if dsn == ":memory:" || strings.HasPrefix(dsn, "file:") {
		return dsn, nil
	}

	dir := filepath.Dir(dsn)
	if dir != "." && dir != "/" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return "", err
		}
	}

	return dsn, nil
}

func (s *service) initTaskSchema() error {
	const schema = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS tasks_set_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE tasks
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;`

	_, err := s.db.Exec(schema)
	return err
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	stats := map[string]string{}
	if err := s.db.PingContext(ctx); err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		return stats
	}

	stats["status"] = "up"
	stats["message"] = "It's healthy"

	dbStats := s.db.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	return stats
}

func (s *service) Close() error {
	log.Printf("Disconnected from database: %s", s.dsn)
	return s.db.Close()
}

func (s *service) CreateTask(ctx context.Context, title, description, status string) (Task, error) {
	const query = `
INSERT INTO tasks (title, description, status)
VALUES (?, ?, ?)
RETURNING id, title, description, status, created_at, updated_at;`

	var task Task
	err := s.db.QueryRowContext(ctx, query, title, description, status).Scan(
		&task.ID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	return task, err
}

func (s *service) UpdateTask(ctx context.Context, id int64, status string) (Task, error) {
	const query = `
	UPDATE tasks
	SET status = ?
	WHERE id = ?
	RETURNING id, title, description, status, created_at, updated_at;`

	var taskUpdate Task
	err := s.db.QueryRowContext(ctx, query, status, id).Scan(
		&taskUpdate.ID,
		&taskUpdate.Title,
		&taskUpdate.Description,
		&taskUpdate.Status,
		&taskUpdate.CreatedAt,
		&taskUpdate.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Task{}, ErrTaskNotFound
	}
	return taskUpdate, err
}

func (s *service) GetAllTasks(ctx context.Context) ([]Task, error) {
	const query = `
SELECT id, title, description, status, created_at, updated_at
FROM tasks
ORDER BY id DESC;`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := make([]Task, 0)
	for rows.Next() {
		var task Task
		if err := rows.Scan(
			&task.ID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.CreatedAt,
			&task.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, rows.Err()
}

func (s *service) GetTaskByID(ctx context.Context, id int64) (Task, error) {
	const query = `
		SELECT id, title, description, status, created_at, updated_at
		FROM tasks
		WHERE id = ?;`

	var task Task
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&task.ID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Task{}, ErrTaskNotFound
	}
	return task, err
}

func (s *service) DeleteTask(ctx context.Context, id int64) error {
	const query = `
	DELETE FROM tasks
	WHERE id = ?;
	`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrTaskNotFound
	}
	return nil
}

func (s *service) DeleteAllTask(ctx context.Context) error {
	const query = `
	DELETE FROM tasks;
	`
	res, err := s.db.ExecContext(ctx, query)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrTaskNotFound
	}
	return nil
}
