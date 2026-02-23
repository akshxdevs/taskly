package server

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"go-taskly/internal/database"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("/", s.HelloWorldHandler)

	mux.HandleFunc("/health", s.healthHandler)

	mux.HandleFunc("POST /api/v1/tasks", s.CreateTask)
	mux.HandleFunc("GET /api/v1/tasks", s.GetAllTask)
	mux.HandleFunc("GET /api/v1/tasks/{id}", s.GetTask)
	mux.HandleFunc("PATCH /api/v1/tasks/{id}", s.UpdateTask)
	mux.HandleFunc("DELETE /api/v1/tasks/{id}", s.DeleteTask)
	mux.HandleFunc("DELETE /api/v1/tasks", s.DeleteAllTask)

	// Wrap the mux with CORS middleware
	return s.corsMiddleware(mux)
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Replace "*" with specific origins if needed
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "false") // Set to "true" if credentials are required

		// Handle preflight OPTIONS requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Proceed with the next handler
		next.ServeHTTP(w, r)
	})
}

func (s *Server) HelloWorldHandler(w http.ResponseWriter, r *http.Request) {
	resp := map[string]string{"message": "Hello World"}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(jsonResp); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := json.Marshal(s.db.Health())
	if err != nil {
		http.Error(w, "Failed to marshal health check response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(resp); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}

func (s *Server) CreateTask(w http.ResponseWriter, r *http.Request) {
	type createTaskRequest struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Status      string `json:"status"`
	}

	var req createTaskRequest
	if err := decodeJSONStrict(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.Status = strings.TrimSpace(req.Status)

	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
		return
	}
	if req.Status == "" {
		req.Status = "false"
	}

	task, err := s.db.CreateTask(r.Context(), req.Title, req.Description, req.Status)
	if err != nil {
		log.Printf("failed creating task: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create task"})
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

func (s *Server) UpdateTask(w http.ResponseWriter, r *http.Request) {
	type updateTaskRequest struct {
		Status string `json:"status"`
	}

	var req updateTaskRequest
	if err := decodeJSONStrict(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	req.Status = strings.TrimSpace(req.Status)
	if req.Status == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "status not provided"})
		return
	}

	taskIdParams := r.PathValue("id")
	taskId, err := strconv.ParseInt(taskIdParams, 10, 64)
	if err != nil || taskId <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid task id"})
		return
	}

	taskUpdate, err := s.db.UpdateTask(r.Context(), taskId, req.Status)
	if err != nil {
		if errors.Is(err, database.ErrTaskNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		log.Printf("failed updating task %d: %v", taskId, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update task"})
		return
	}

	writeJSON(w, http.StatusOK, taskUpdate)
}

func (s *Server) GetAllTask(w http.ResponseWriter, r *http.Request) {
	tasks, err := s.db.GetAllTasks(r.Context())
	if err != nil {
		log.Printf("failed fetching tasks: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch tasks"})
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}

func (s *Server) GetTask(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid task id"})
		return
	}

	task, err := s.db.GetTaskByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, database.ErrTaskNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		log.Printf("failed fetching task %d: %v", id, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch task"})
		return
	}
	writeJSON(w, http.StatusOK, task)
}

func (s *Server) DeleteTask(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid task id"})
		return
	}

	if err := s.db.DeleteTask(r.Context(), id); err != nil {
		if errors.Is(err, database.ErrTaskNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		log.Printf("failed deleting task %d: %v", id, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete task"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) DeleteAllTask(w http.ResponseWriter, r *http.Request) {
	if err := s.db.DeleteAllTask(r.Context()); err != nil {
		if errors.Is(err, database.ErrTaskNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		log.Printf("failed deleting all tasks: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete task"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func decodeJSONStrict(r *http.Request, v any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		return errors.New("invalid json payload")
	}
	if dec.More() {
		return errors.New("invalid json payload")
	}
	return nil
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if _, err := w.Write(body); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}
