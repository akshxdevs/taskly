package server

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode"

	"go-taskly/internal/database"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("/", s.HelloWorldHandler)

	mux.HandleFunc("/health", s.healthHandler)

	mux.Handle("POST /api/v1/tasks", AuthMiddleware(http.HandlerFunc(s.CreateTask)))
	mux.Handle("GET /api/v1/tasks", AuthMiddleware(http.HandlerFunc(s.GetAllTask)))
	mux.Handle("GET /api/v1/task/{id}", AuthMiddleware(http.HandlerFunc(s.GetTask)))
	mux.Handle("GET /api/v1/tasks/{id}", AuthMiddleware(http.HandlerFunc(s.GetTaskByUserId)))
	mux.Handle("PATCH /api/v1/tasks/{id}", AuthMiddleware(http.HandlerFunc(s.UpdateTask)))
	mux.Handle("DELETE /api/v1/tasks/{id}", AuthMiddleware(http.HandlerFunc(s.DeleteTask)))
	mux.Handle("DELETE /api/v1/tasks", AuthMiddleware(http.HandlerFunc(s.DeleteAllTask)))

	mux.HandleFunc("POST /api/v1/user/login", s.Login)
	mux.HandleFunc("POST /api/v1/user/signup", s.Signup)
	mux.HandleFunc("GET /api/v1/user/auth/{id}", s.CheckUserAuth)

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
		UserId      string `json:"userId"`
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
		req.Status = "todo"
	}

	task, err := s.db.CreateTask(r.Context(), req.Title, req.Description, req.Status, req.UserId)
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

func (s *Server) GetTaskByUserId(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	userID, err := uuid.Parse(idParam)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid user id",
		})
		return
	}

	tasks, err := s.db.GetTaskByUserId(r.Context(), userID.String())
	if err != nil {
		if errors.Is(err, database.ErrTaskNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error": "task not found",
			})
			return
		}
		log.Printf("failed fetching tasks for user %s: %v", userID, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to fetch tasks",
		})
		return
	}

	writeJSON(w, http.StatusOK, tasks)
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

func (s *Server) Signup(w http.ResponseWriter, r *http.Request) {
	type LoginUserRequest struct {
		Username string
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	var req LoginUserRequest
	if err := decodeJSONStrict(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	_, err := mail.ParseAddress(req.Email)
	if err != nil {
		writeJSON(w, http.StatusNotAcceptable, map[string]string{"error": err.Error()})
		return
	}

	if !isValidPassword(req.Password) {
		http.Error(w, "password must be 8+ chars, contain letters & numbers", http.StatusBadRequest)
		return
	}

	req.Username, err = generateUserName()
	if err != nil {
		http.Error(w, "error: failed to generate username", http.StatusBadRequest)
		return
	}

	hashPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusNotAcceptable, map[string]string{"error": err.Error()})
		return
	}

	users, err := s.db.CreateUser(r.Context(), req.Username, req.Email, string(hashPassword))
	if err != nil {
		log.Printf("failed creating user: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create user"})
		return
	}
	writeJSON(w, http.StatusAccepted, users)
}

func (s *Server) Login(w http.ResponseWriter, r *http.Request) {
	type LoginUserRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	type LoginResponse struct {
		User  database.User `json:"user"`
		Token string        `json:"token"`
	}

	var req LoginUserRequest
	if err := decodeJSONStrict(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// 1. Fetch user (must include password hash internally)
	user, err := s.db.CheckUser(r.Context(), req.Email)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	token, err := generateToken(user.Id.String())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate token"})
		return
	}

	if s.redis != nil {
		if err := s.redis.Set(r.Context(), "auth:token:"+user.Id.String(), token, time.Hour).Err(); err != nil {
			log.Printf("failed to cache token in redis: %v", err)
		}
		log.Printf("Token Stored Successfully!")
	}

	writeJSON(w, http.StatusOK, LoginResponse{
		User:  user,
		Token: token,
	})
}

func (s *Server) CheckUserAuth(w http.ResponseWriter, r *http.Request) {
	type CheckUserAuthResponse struct {
		database.UserAuth
		Token string `json:"token"`
	}

	idParams := r.PathValue("id")
	userId, err := uuid.Parse(idParams)
	if err != nil {
		http.Error(w, "invalid userid (uuid)", http.StatusBadRequest)
		return
	}
	var reqToken string
	if s.redis != nil {
		key := "auth:token:" + userId.String()
		cachedToken, err := s.redis.Get(r.Context(), key).Result()
		if err != nil {
			log.Printf("token fetch failed: %v", err)
			http.Error(w, "Token not provided or invalid", http.StatusBadRequest)
			return
		}
		log.Printf("Token Fetch Successfull!")
		reqToken = cachedToken
	}

	secret := os.Getenv("AUTH_SECRET")
	claims := &jwt.RegisteredClaims{}
	token, err := jwt.ParseWithClaims(reqToken, claims, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	payload := claims.Subject

	if userId.String() != payload {
		http.Error(w, "Invalid Token!", http.StatusBadRequest)
	}

	if err != nil || !token.Valid || claims.Subject == "" {
		http.Error(w, "invalid or expired token", http.StatusUnauthorized)
		return
	}

	if reqToken == "" {
		http.Error(w, "Token not provided or invalid", http.StatusBadRequest)
		return
	}

	auth, err := s.db.CheckUserById(r.Context(), userId.String())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	writeJSON(w, http.StatusAccepted, CheckUserAuthResponse{
		UserAuth: auth,
		Token:    reqToken,
	})

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

func isValidPassword(p string) bool {
	if len(p) < 8 || len(p) > 32 {
		return false
	}
	hasNumber := false
	hasString := false
	for _, c := range p {
		switch {
		case unicode.IsLetter(c):
			hasString = true
		case unicode.IsNumber(c):
			hasNumber = true
		}
	}
	return hasNumber && hasString
}

func generateUserName() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(9000))
	if err != nil {
		return "", err
	}

	num := 1000 + n.Int64()
	return fmt.Sprintf("user%d", num), nil

}

func generateToken(userId string) (string, error) {
	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		return "", errors.New("Auth secret is not set")
	}

	claims := jwt.MapClaims{
		"sub": userId,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
