import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserWorkspacesApi,
  createWorkspaceApi,
  updateWorkspaceApi,
  deleteWorkspaceApi,
  type Workspace,
} from '../lib/api';
import { clearToken, getToken, getUserIdFromToken } from '../lib/auth';

export function Dashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const userId = useMemo(() => (token ? getUserIdFromToken(token) : null), [token]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const res = await getUserWorkspacesApi(userId);
      setWorkspaces(res.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!userId || !workspaceTitle.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await createWorkspaceApi({
        title: workspaceTitle.trim(),
        id_user: userId,
      });
      setShowCreateModal(false);
      setWorkspaceTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingWorkspace || !workspaceTitle.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateWorkspaceApi(editingWorkspace.id, {
        title: workspaceTitle.trim(),
      });
      setEditingWorkspace(null);
      setWorkspaceTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(workspaceId: string) {
    if (!confirm('Are you sure you want to delete this workspace? All tasks will be deleted.')) {
      return;
    }

    setError(null);

    try {
      await deleteWorkspaceApi(workspaceId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
  }

  function openEditModal(workspace: Workspace) {
    setEditingWorkspace(workspace);
    setWorkspaceTitle(workspace.title);
  }

  function closeModals() {
    setShowCreateModal(false);
    setEditingWorkspace(null);
    setWorkspaceTitle('');
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
          <p className="muted">Manage your workspaces and organize your tasks.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          Create Workspace
        </button>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading && !error && workspaces.length === 0 ? (
        <div className="card">
          <div className="card-title">No workspaces yet</div>
          <div className="muted">Create your first workspace to start organizing tasks.</div>
        </div>
      ) : null}

      {!loading && !error && workspaces.length > 0 ? (
        <div className="grid">
          {workspaces.map((workspace) => (
            <div className="task-card" key={workspace.id}>
              <div className="task-card-top">
                <div
                  className="task-card-title"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/workspace/${workspace.id}`)}
                >
                  {workspace.title}
                </div>
              </div>
              <div className="task-card-desc" style={{ marginBottom: '1rem' }}>
                Click to manage tasks
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="button button-secondary"
                  onClick={() => openEditModal(workspace)}
                  type="button"
                  style={{ flex: 1 }}
                >
                  Edit
                </button>
                <button
                  className="button button-ghost"
                  onClick={() => handleDelete(workspace.id)}
                  type="button"
                  style={{ flex: 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create Workspace</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreate();
              }}
            >
              <label className="field">
                <span className="field-label">Workspace Title</span>
                <input
                  className="input"
                  value={workspaceTitle}
                  onChange={(e) => setWorkspaceTitle(e.target.value)}
                  type="text"
                  placeholder="My Workspace"
                  required
                  autoFocus
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Creating…' : 'Create'}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={closeModals}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingWorkspace && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Workspace</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdate();
              }}
            >
              <label className="field">
                <span className="field-label">Workspace Title</span>
                <input
                  className="input"
                  value={workspaceTitle}
                  onChange={(e) => setWorkspaceTitle(e.target.value)}
                  type="text"
                  placeholder="My Workspace"
                  required
                  autoFocus
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Updating…' : 'Update'}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={closeModals}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
