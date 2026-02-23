package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"go-taskly/internal/database"
)

type mockDB struct {
	tasks  []database.Task
	nextID int64
}

func (m *mockDB) Health() map[string]string {
	return map[string]string{"status": "up"}
}

func (m *mockDB) Close() error {
	return nil
}

func (m *mockDB) CreateTask(_ context.Context, title, description, status string) (database.Task, error) {
	m.nextID++
	now := time.Now().UTC()
	task := database.Task{
		ID:          m.nextID,
		Title:       title,
		Description: description,
		Status:      status,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	m.tasks = append(m.tasks, task)
	return task, nil
}

func (m *mockDB) UpdateTask(_ context.Context, id int64, status string) (database.Task, error) {
	for i := range m.tasks {
		if m.tasks[i].ID == id {
			m.tasks[i].Status = status
			m.tasks[i].UpdatedAt = time.Now().UTC()
			return m.tasks[i], nil
		}
	}
	return database.Task{}, database.ErrTaskNotFound
}

func (m *mockDB) DeleteTask(_ context.Context, id int64) error {
	for i := range m.tasks {
		if m.tasks[i].ID == id {
			m.tasks = append(m.tasks[:i], m.tasks[i+1:]...)
			return nil
		}
	}
	return database.ErrTaskNotFound
}

func (m *mockDB) DeleteAllTask(_ context.Context) error {
	m.tasks = nil
	return nil
}

func (m *mockDB) GetAllTasks(_ context.Context) ([]database.Task, error) {
	return append([]database.Task(nil), m.tasks...), nil
}

func (m *mockDB) GetTaskByID(_ context.Context, id int64) (database.Task, error) {
	for _, task := range m.tasks {
		if task.ID == id {
			return task, nil
		}
	}
	return database.Task{}, database.ErrTaskNotFound
}

func TestHelloWorldHandler(t *testing.T) {
	s := &Server{db: &mockDB{}}

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	s.HelloWorldHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200; got %d", rr.Code)
	}
	if rr.Body.String() != "{\"message\":\"Hello World\"}" {
		t.Fatalf("unexpected response body: %s", rr.Body.String())
	}
}

func TestTaskRoutes(t *testing.T) {
	db := &mockDB{}
	s := &Server{db: db}
	handler := s.RegisterRoutes()

	t.Run("create task", func(t *testing.T) {
		body := []byte(`{"title":"write tests","description":"for task handlers","status":"todo"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected status 201; got %d body=%s", rr.Code, rr.Body.String())
		}
		var task database.Task
		if err := json.Unmarshal(rr.Body.Bytes(), &task); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if task.ID == 0 || task.Title != "write tests" {
			t.Fatalf("unexpected created task: %+v", task)
		}
	})

	t.Run("reject created_at in payload", func(t *testing.T) {
		body := []byte(`{"title":"strict payload","description":"x","status":"todo","created_at":"2026-01-01T00:00:00Z"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400; got %d body=%s", rr.Code, rr.Body.String())
		}
	})

	t.Run("list tasks", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks", nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected status 200; got %d body=%s", rr.Code, rr.Body.String())
		}
		var tasks []database.Task
		if err := json.Unmarshal(rr.Body.Bytes(), &tasks); err != nil {
			t.Fatalf("failed to decode list response: %v", err)
		}
		if len(tasks) != 1 {
			t.Fatalf("expected 1 task; got %d", len(tasks))
		}
	})

	t.Run("get task by id", func(t *testing.T) {
		taskID := strconv.FormatInt(db.tasks[0].ID, 10)
		req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/"+taskID, nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected status 200; got %d body=%s", rr.Code, rr.Body.String())
		}
		var task database.Task
		if err := json.Unmarshal(rr.Body.Bytes(), &task); err != nil {
			t.Fatalf("failed to decode get response: %v", err)
		}
		if task.ID != db.tasks[0].ID {
			t.Fatalf("expected task id %d; got %d", db.tasks[0].ID, task.ID)
		}
	})

	t.Run("get missing task", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/9999", nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected status 404; got %d body=%s", rr.Code, rr.Body.String())
		}
	})

	t.Run("update task status", func(t *testing.T) {
		reqBody := []byte(`{"status":"done"}`)
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/tasks/1", bytes.NewReader(reqBody))
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected status 200; got %d body=%s", rr.Code, rr.Body.String())
		}
	})

	t.Run("delete task", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/tasks/1", nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusNoContent {
			t.Fatalf("expected status 204; got %d body=%s", rr.Code, rr.Body.String())
		}
	})
}

func TestGetTaskInvalidID(t *testing.T) {
	s := &Server{db: &mockDB{}}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/not-a-number", nil)
	req.SetPathValue("id", "not-a-number")
	rr := httptest.NewRecorder()

	s.GetTask(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400; got %d", rr.Code)
	}
}

func TestGetTaskNotFoundDirectHandler(t *testing.T) {
	s := &Server{db: &mockDB{}}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/3", nil)
	req.SetPathValue("id", "3")
	rr := httptest.NewRecorder()

	s.GetTask(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status 404; got %d", rr.Code)
	}
}
