export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type UserAuth = {
  id: string;
  username: string;
  email: string;
  auth_status: string;
  is_user_authenticated: boolean;
  token?: string;
};

export type LoginResponse = {
  user: User;
  token: string;
};

export type Session = {
  user: User;
};
