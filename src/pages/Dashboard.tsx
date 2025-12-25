import { useEffect, useMemo, useState } from 'react';
import { getTasksApi, type Task } from '../lib/api';
import { clearToken, getToken, getUserIdFromToken } from '../lib/auth';

function statusLabel(status: Task['status']) {
  if (status === 'pending') return 'Pending';
  if (status === 'in_progress') return 'In progress';
  return 'Done';
}

function statusClass(status: Task['status']) {
  if (status === 'pending') return 'pill pill-pending';
  if (status === 'in_progress') return 'pill pill-progress';
  return 'pill pill-done';
}

export function Dashboard() {
  const token = getToken();
  const userId = useMemo(() => (token ? getUserIdFromToken(token) : null), [token]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  async function load() {
    if (!userId) {
      clearToken();
      setError('Invalid session. Please sign in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getTasksApi(userId);
      setTasks(res.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="muted">Your tasks, synced from the API.</p>
        </div>
        {/* <button className="button button-secondary" onClick={() => void load()} type="button">
          Creat Task
        </button> */}
        <button className="button button-secondary" onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading && !error && tasks.length === 0 ? (
        <div className="card">
          <div className="card-title">No tasks yet</div>
          <div className="muted">Create tasks via the API and they’ll show up here.</div>
        </div>
      ) : null}

      {!loading && !error && tasks.length > 0 ? (
        <div className="grid">
          {tasks.map((t, idx) => (
            <div className="task-card" key={`${t.title}-${idx}`}>
              <div className="task-card-top">
                <div className="task-card-title">{t.title}</div>
                <div className={statusClass(t.status)}>{statusLabel(t.status).toLowerCase()}</div>
              </div>
              <div className="task-card-desc">{t.description}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
