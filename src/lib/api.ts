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

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  id_workspace: string;
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

export type MessageResponse = {
  message: string;
};

export type CreateTaskResponse = {
  task: Task;
};
export type CreateWorkspaceResponse = {
  workspace: Workspace;
};

// Base API fetch function
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const url = `${getApiBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (fetchError) {
    // This is a true network error (CORS, connection refused, etc.)
    const errorMessage =
      fetchError instanceof Error ? fetchError.message : String(fetchError);
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError')
    ) {
      throw new Error(
        `Network error: Unable to reach ${url}. Check if the server is running and CORS is configured. Original error: ${errorMessage}`
      );
    }
    throw fetchError;
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        issues?: Array<{ path: string[]; message: string }>;
      };
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (data?.issues && Array.isArray(data.issues)) {
        // Zod validation errors
        message = `Validation error: ${data.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')}`;
      }
    } catch {
      // If response is not JSON, try to get text
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
// Delete API fetch function
export async function apiFetchDelete<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const url = `${getApiBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(token ? { Authorization: token } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (fetchError) {
    // This is a true network error (CORS, connection refused, etc.)
    const errorMessage =
      fetchError instanceof Error ? fetchError.message : String(fetchError);
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError')
    ) {
      throw new Error(
        `Network error: Unable to reach ${url}. Check if the server is running and CORS is configured. Original error: ${errorMessage}`
      );
    }
    throw fetchError;
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        issues?: Array<{ path: string[]; message: string }>;
      };
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (data?.issues && Array.isArray(data.issues)) {
        // Zod validation errors
        message = `Validation error: ${data.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')}`;
      }
    } catch {
      // If response is not JSON, try to get text
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
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
  userId: string
): Promise<UserWorkspacesResponse> {
  return apiFetch<UserWorkspacesResponse>(`/user/${userId}/workspaces`, {
    method: 'GET',
  });
}

export async function getWorkspaceApi(
  workspaceId: string
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
  input: { title: string }
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/workspace/${workspaceId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteWorkspaceApi(
  workspaceId: string
): Promise<MessageResponse> {
  return apiFetchDelete<MessageResponse>(`/workspace/${workspaceId}`, {
    method: 'DELETE',
  });
}

// Task APIs
export async function getTasksByWorkspaceApi(
  workspaceId: string
): Promise<TasksByWorkspaceResponse> {
  return apiFetch<TasksByWorkspaceResponse>(`/workspace/${workspaceId}/tasks`, {
    method: 'GET',
  });
}

export async function createTaskApi(
  workspaceId: string,
  input: {
    title: string;
    description: string;
    due_date: string;
    priority?: TaskPriority;
  }
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
    due_date: string;
    priority: TaskPriority;
  }
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
