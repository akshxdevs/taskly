import type { Session, Task, UserAuth } from "@/types";

export type TasksViewModel = {
  session: Session | null;
  accessToken: string;
  tasks: Task[];
  authData: UserAuth | null;
  isBooting: boolean;
  isLoading: boolean;
  statusMessage: string;
  isProfileMenuOpen: boolean;
  isAuthChecking: boolean;
  authVerifiedFlash: boolean;
  newTitle: string;
  newDescription: string;
  newStatus: string;
  taskQuery: string;
  taskFilter: string;
  isCreateDialogOpen: boolean;
  toastMessage: string;
};
