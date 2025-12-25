import { getToken } from './auth';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (envBase && envBase.trim().length > 0 ? envBase : DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type Task = {
  title: string;
  status: TaskStatus;
  description: string;
  userRelated: string;
};

export type TasksResponse = {
  user: string;
  tasks: Task[];
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export async function loginApi(input: { email: string; password: string }) {
  return apiFetch<{ message: string; token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function registerApi(input: { name: string; email: string; password: string }) {
  return apiFetch<{ User: string }>('/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getTasksApi(userId: string) {
  return apiFetch<TasksResponse>(`/tasks/${userId}`, {
    method: 'GET',
  });
}
