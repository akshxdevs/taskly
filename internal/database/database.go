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

	"github.com/google/uuid"
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
	CreateUser(ctx context.Context, username, email, password string) (User, error)
	CheckUser(ctx context.Context, email string) (User, error)
	Close() error
}

type Task struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type User struct {
	Id        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	CreatedAt string    `json:"created_at"`
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

	scv := &service{
		db:  db,
		dsn: dsn,
	}

	if err := scv.initUserScheme(); err != nil {
		log.Fatalf("failed to intialize userScheme: %v", err)
	}

	if _, err := scv.db.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		log.Fatalf("failed to enable foreign keys: %v", err)
	}

	if err := scv.initTaskSchema(); err != nil {
		log.Fatalf("failed to initialize schema: %v", err)
	}

	dbInstance = scv
	return scv
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
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`
	_, err := s.db.Exec(schema)
	return err
}

func (s *service) initUserScheme() error {
	const query = `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		username TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := s.db.Exec(query)
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

func (s *service) CreateUser(
	ctx context.Context,
	username string,
	email string,
	password string,
) (User, error) {

	const query = `
		INSERT INTO users (id, username, email, password)
		VALUES (?, ?, ?, ?)
		RETURNING id, username, email, created_at;
	`

	var user User
	user.Id = uuid.New()

	err := s.db.QueryRowContext(
		ctx,
		query,
		user.Id.String(),
		username,
		email,
		password,
	).Scan(
		&user.Id,
		&user.Username,
		&user.Email,
		&user.CreatedAt,
	)

	if err != nil {
		return User{}, err
	}

	return user, nil
}

func (s *service) CheckUser(ctx context.Context, email string) (User, error) {
	const query = `
	SELECT id, username, email, password, created_at
	FROM users
	WHERE email = ?;
	`

	var user User
	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&user.Id,
		&user.Username,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
	)
	if err != nil {
		return User{}, err
	}
	return user, nil
}
