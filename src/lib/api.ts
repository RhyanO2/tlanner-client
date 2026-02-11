import { getToken } from './auth';

const DEFAULT_API_BASE_URL = 'https://tlanner-main-1.onrender.com/';
// const DEFAULT_API_BASE_URL = 'http://localhost:3000/';

export function getApiBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (
    envBase && envBase.trim().length > 0 ? envBase : DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
}

// Types
export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  id_workspace: string;
};
export type Habit = {
  id: string;
  name: string;
  id_user: string;
  frequency: HabitFrequency;
  created_at: string | null;
};

export type Workspace = {
  id: string;
  title: string;
  id_user: string;
};

// API Response Types
export type LoginResponse = {
  message: string;
  token: string;
};

export type RegisterResponse = {
  User: string;
};

export type UserWorkspacesResponse = {
  workspaces: Workspace[];
};

export type WorkspaceResponse = {
  results: Workspace[];
};

export type TasksByWorkspaceResponse = {
  workspace: string;
  tasks: Task[];
};
export type UserHabitsResponse = {
  user: string;
  habits: Habit[];
};

export type MessageResponse = {
  message: string;
};

export type CreateTaskResponse = {
  task: Task;
};
export type CreateHabitResponse = {
  habits: Habit[];
};
export type CreateWorkspaceResponse = {
  workspace: Workspace;
};

export function normalizeTask(task: any): Task {
  return {
    ...task,
    due_date: task.due_date
      ? typeof task.due_date === 'string'
        ? task.due_date
        : new Date(task.due_date).toISOString()
      : null,
  };
}

// Base API fetch function
// Base API fetch function
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const url = `${getApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...(init?.headers ?? {}),
    },
  });

  // 1. TRATAMENTO PARA 204 NO CONTENT (Não tenta ler JSON)
  if (res.status === 204) {
    return {} as T;
  }

  // 2. TRATAMENTO DE ERROS (4xx e 5xx)
  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;

    try {
      const data = await res.json();
      errorMessage = data.message || data.error || errorMessage;
    } catch {
      // Se falhar ao ler JSON, tenta ler como texto
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }

    throw new Error(errorMessage);
  }

  // 3. RETORNO DE SUCESSO (Status 200, 201, etc)
  return (await res.json()) as T;
}

// Delete API fetch function
export async function apiFetchDelete<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const url = `${getApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...init,
    method: 'DELETE', // Força o método DELETE
    headers: {
      ...(token ? { Authorization: token } : {}),
      ...(init?.headers ?? {}),
    },
  });

  // Tratamento específico para o 204 no DELETE
  if (res.status === 204) {
    // Retorna um objeto que satisfaça o tipo esperado (ex: MessageResponse)
    return { message: 'Deleted successfully' } as unknown as T;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Delete failed (${res.status})`);
  }

  return (await res.json()) as T;
}
// Auth APIs
export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/login', {
    method: 'POST',

    body: JSON.stringify(input),
  });
}

export async function registerApi(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function githubRegister(): void {
  window.location.href = `${getApiBaseUrl()}/auth/github`;
}

// Workspace APIs
export async function getUserWorkspacesApi(
  userId: string,
): Promise<UserWorkspacesResponse> {
  return apiFetch<UserWorkspacesResponse>(`/user/${userId}/workspaces`, {
    method: 'GET',
  });
}

export async function getWorkspaceApi(
  workspaceId: string,
): Promise<WorkspaceResponse> {
  return apiFetch<WorkspaceResponse>(`/workspace/${workspaceId}`, {
    method: 'GET',
  });
}

export async function createWorkspaceApi(input: {
  title: string;
  id_user: string;
}): Promise<CreateWorkspaceResponse> {
  return apiFetch<CreateWorkspaceResponse>('/workspace', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateWorkspaceApi(
  workspaceId: string,
  input: { title: string },
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/workspace/${workspaceId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteWorkspaceApi(
  workspaceId: string,
): Promise<MessageResponse> {
  return apiFetchDelete<MessageResponse>(`/workspace/${workspaceId}`, {
    method: 'DELETE',
  });
}

//Tasks APIs

// Task APIs
export async function getTasksByWorkspaceApi(
  workspaceId: string,
): Promise<TasksByWorkspaceResponse> {
  const response = await apiFetch<any>(`/workspace/${workspaceId}/tasks`, {
    method: 'GET',
  });

  // Normalize as tasks antes de retornar
  return {
    workspace: response.workspace,
    tasks: response.tasks.map((task: any) => ({
      ...task,
      due_date: task.due_date ? String(task.due_date).split('T')[0] : null,
    })),
  };
}

export async function createTaskApi(
  workspaceId: string,
  input: {
    title: string;
    description: string;
    due_date: string | null;
    priority?: TaskPriority;
  },
): Promise<CreateTaskResponse> {
  return apiFetch<CreateTaskResponse>(`/workspace/${workspaceId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTaskApi(
  taskId: string,
  input: {
    title: string;
    description: string;
    status: TaskStatus;
    due_date: string | null;
    priority: TaskPriority;
  },
): Promise<MessageResponse> {
  try {
    return await apiFetch<MessageResponse>(`/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  } catch (err) {
    // Log the error for debugging
    console.error('updateTaskApi error:', {
      taskId,
      input,
      error: err,
    });
    throw err;
  }
}

export async function deleteTaskApi(taskId: string): Promise<MessageResponse> {
  return apiFetchDelete<MessageResponse>(`/task/${taskId}`, {
    method: 'DELETE',
    headers: {},
  });
}

// Habits APIs
export async function getHabitsByUserIdApi(
  userID: string,
): Promise<UserHabitsResponse> {
  return apiFetch<UserHabitsResponse>(`/user/${userID}/habits`, {
    method: 'GET',
  });
}

export async function createHabitApi(input: {
  name: string;
  frequency?: HabitFrequency;
  id_user: string;
}): Promise<CreateHabitResponse> {
  return apiFetch<CreateHabitResponse>(`/habit`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateHabitApi(
  habitID: string,
  input: {
    name: string;
    frequency?: HabitFrequency;
  },
): Promise<MessageResponse> {
  try {
    return await apiFetch<MessageResponse>(`/habit/${habitID}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  } catch (err) {
    // Log the error for debugging
    console.error('updateTaskApi error:', {
      habitID,
      input,
      error: err,
    });
    throw err;
  }
}

export async function deleteHabitApi(
  habitID: string,
): Promise<MessageResponse> {
  return apiFetchDelete<MessageResponse>(`/habit/${habitID}`, {
    method: 'DELETE',
    headers: {},
  });
}

//
