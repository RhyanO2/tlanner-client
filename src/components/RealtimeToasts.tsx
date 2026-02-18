import { useEffect, useMemo, useRef, useState } from 'react';

type ToastEntry = {
  id: string;
  title: string;
  message: string;
};

type RealtimeEventDetail = {
  event: string;
  data: unknown;
};

function getActionLabel(action: string) {
  if (action === 'created') return 'Created';
  if (action === 'updated') return 'Updated';
  if (action === 'deleted') return 'Deleted';
  return 'Changed';
}

function eventTitle(eventName: string) {
  const [resource] = eventName.split(':');
  if (resource === 'task') return 'Tasks';
  if (resource === 'workspace') return 'Workspaces';
  if (resource === 'habit') return 'Habits';
  return 'Realtime';
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getEntityName(eventName: string, payload: unknown): string | null {
  const [resource] = eventName.split(':');
  const data = asRecord(payload);

  if (resource === 'task') {
    const task = asRecord(data.task);
    const updated = asRecord(data.updated);
    return (
      readString(task.title) ??
      readString(updated.title) ??
      readString(data.title) ??
      readString(data.taskTitle) ??
      readString(data.taskId)
    );
  }

  if (resource === 'workspace') {
    const workspace = asRecord(data.workspace);
    return (
      readString(workspace.title) ??
      readString(data.title) ??
      readString(data.workspaceTitle) ??
      readString(data.workspaceId)
    );
  }

  if (resource === 'habit') {
    const habit = asRecord(data.habit);
    const edited = asRecord(data.edited);
    return (
      readString(habit.name) ??
      readString(edited.name) ??
      readString(data.name) ??
      readString(data.habitId)
    );
  }

  return null;
}

export function RealtimeToasts() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const dedupeMapRef = useRef<Map<string, number>>(new Map());

  const allowedEvents = useMemo(
    () =>
      new Set([
        'task:created',
        'task:updated',
        'task:deleted',
        'workspace:created',
        'workspace:updated',
        'workspace:deleted',
        'habit:created',
        'habit:updated',
        'habit:deleted',
      ]),
    [],
  );

  useEffect(() => {
    const onRealtimeEvent = (evt: Event) => {
      const customEvent = evt as CustomEvent<RealtimeEventDetail>;
      const eventName = customEvent.detail?.event;
      const payload = customEvent.detail?.data;

      if (!eventName || !allowedEvents.has(eventName)) return;

      const [, action = 'changed'] = eventName.split(':');
      const entityName = getEntityName(eventName, payload);
      const message = entityName
        ? `${getActionLabel(action)}: ${entityName}`
        : getActionLabel(action);

      const fingerprint = `${eventName}:${entityName ?? '-'}`;
      const now = Date.now();
      const lastSeen = dedupeMapRef.current.get(fingerprint) ?? 0;
      if (now - lastSeen < 1200) return;
      dedupeMapRef.current.set(fingerprint, now);

      const toast: ToastEntry = {
        id: crypto.randomUUID(),
        title: eventTitle(eventName),
        message,
      };

      setToasts((current) => [toast, ...current].slice(0, 4));

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 2800);

      window.setTimeout(() => {
        dedupeMapRef.current.delete(fingerprint);
      }, 1800);
    };

    window.addEventListener('tlanner:realtime-event', onRealtimeEvent);
    return () => {
      window.removeEventListener('tlanner:realtime-event', onRealtimeEvent);
    };
  }, [allowedEvents]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className="toast-item" key={toast.id}>
          <div className="toast-title">{toast.title}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}
