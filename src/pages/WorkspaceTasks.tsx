import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTasksByWorkspaceApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  getWorkspaceApi,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '../lib/api';
import { clearToken, getToken, getUserIdFromToken } from '../lib/auth';
import PomodoroTimer from '../components/pomodoro/pomodoro';

// function statusLabel(status: TaskStatus) {
//   if (status === 'pending') return 'Pending';
//   if (status === 'in_progress') return 'In Progress';
//   return 'Done';
// }

function createTempId() {
  return `temp-${crypto.randomUUID()}`;
}

function priorityLabel(priority: TaskPriority) {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority];
}

function priorityClass(priority: TaskPriority) {
  if (priority === 'urgent') return 'pill pill-urgent';
  if (priority === 'high') return 'pill pill-high';
  if (priority === 'low') return 'pill pill-low';
  return 'pill pill-normal';
}

function getPriorityOrder(priority: TaskPriority): number {
  const order: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };
  return order[priority];
}

function organizeTasksByStatusAndPriority(
  tasks: Task[]
): Record<TaskStatus, Task[]> {
  const organized: Record<TaskStatus, Task[]> = {
    pending: [],
    in_progress: [],
    done: [],
  };

  tasks.forEach((task) => {
    organized[task.status].push(task);
  });

  // Sort each status group by priority
  Object.keys(organized).forEach((status) => {
    organized[status as TaskStatus].sort((a, b) => {
      return getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
    });
  });

  return organized;
}

export function WorkspaceTasks() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const token = getToken();
  const userId = useMemo(
    () => (token ? getUserIdFromToken(token) : null),
    [token]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const [selectedTaskForPomodoro, setSelectedTaskForPomodoro] =
    useState<Task | null>(null);

  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('normal');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('pending');

  const organizedTasks = useMemo(
    () => organizeTasksByStatusAndPriority(tasks),
    [tasks]
  );

  async function load() {
    if (!userId || !workspaceId) {
      clearToken();
      setError('Invalid session. Please sign in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [workspaceRes, tasksRes] = await Promise.all([
        getWorkspaceApi(workspaceId),
        getTasksByWorkspaceApi(workspaceId),
      ]);
      setWorkspaceTitle(workspaceRes.results[0]?.title || 'Workspace');
      setTasks(tasksRes.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    // load();
    if (!workspaceId || !taskTitle.trim()) return;

    setSubmitting(true);
    setError(null);

    const tempTask: Task = {
      id: createTempId(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: 'pending',
      due_date: taskDueDate || new Date().toISOString(),
      priority: taskPriority,
      id_workspace: workspaceId,
    };

    setTasks((current) => [tempTask, ...current]);

    setShowCreateModal(false);
    resetForm();

    try {
      const created = await createTaskApi(tempTask.id_workspace, {
        title: tempTask.title,
        description: tempTask.description,
        due_date: tempTask.due_date ?? new Date().toISOString(),
        priority: tempTask.priority,
      });
      setTasks((current) =>
        current.map((t) => (t.id === tempTask.id ? created.task : t))
      );
    } catch (err) {
      setTasks((current) => current.filter((t) => t.id !== tempTask.id));

      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingTask || !taskTitle.trim()) return;

    setSubmitting(true);
    setError(null);

    // Format due_date correctly
    let dueDate = taskDueDate;
    if (!dueDate) {
      dueDate = new Date().toISOString();
    } else {
      dueDate = new Date(dueDate).toISOString();
    }

    const previousTask = editingTask;

    const optimisticTask = {
      ...editingTask,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: taskStatus,
      due_date: dueDate,
      priority: taskPriority,
    };

    setTasks((current) =>
      current.map((t) => (t.id === editingTask.id ? optimisticTask : t))
    );

    setEditingTask(null);
    resetForm();
    setSubmitting(false);

    try {
      // Faz a requisição em background
      await updateTaskApi(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        status: taskStatus,
        due_date: dueDate,
        priority: taskPriority,
      });
    } catch (err) {
      setTasks((current) =>
        current.map((t) => (t.id === previousTask.id ? previousTask : t))
      );
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    if (task.status === newStatus) return;

    setError(null);

    const previousStatus = task.status;

    setTasks((current) =>
      current.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      // Format due_date correctly - use existing date or current date
      let dueDate: string;
      if (!task.due_date) {
        // If no due date, use current date
        dueDate = new Date().toISOString();
      } else {
        // Parse and format the existing date
        const date = new Date(task.due_date);
        if (isNaN(date.getTime())) {
          // Invalid date, use current date
          dueDate = new Date().toISOString();
        } else {
          dueDate = date.toISOString();
        }
      }

      await updateTaskApi(task.id, {
        title: task.title,
        description: task.description,
        status: newStatus,
        due_date: dueDate,
        priority: task.priority,
      });
    } catch (err) {
      setTasks((current) =>
        current.map((t) =>
          t.id === task.id ? { ...t, status: previousStatus } : t
        )
      );
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update task status';
      setError(errorMessage);
      console.error('Error updating task status:', err);
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setError(null);

    const taskToDelete = tasks.find((t) => (t.id = taskId));
    if (!taskToDelete) return;

    setTasks((current) => current.filter((t) => t.id !== taskId));

    try {
      await deleteTaskApi(taskId);
    } catch (err) {
      setTasks((current) => [...current, taskToDelete]);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
    );
  }

  // function openPomodoroModal(task: Task){

  // }

  function resetForm() {
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskPriority('normal');
    setTaskStatus('pending');
  }

  function closeModals() {
    setShowCreateModal(false);
    setEditingTask(null);
    setShowPomodoroModal(false);
    setSelectedTaskForPomodoro(null);
    resetForm();
  }

  function openPomodoroModal(task: Task) {
    setSelectedTaskForPomodoro(task);
    setShowPomodoroModal(true);
  }

  function handleDragStart(e: React.DragEvent, task: Task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, targetStatus: TaskStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(targetStatus);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: React.DragEvent, targetStatus: TaskStatus) {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTask && draggedTask.status !== targetStatus) {
      void handleStatusChange(draggedTask, targetStatus);
    }
    setDraggedTask(null);
  }

  function handleDragEnd() {
    setDraggedTask(null);
    setDragOverColumn(null);
  }

  const handleFinishTask = async () => {
    if (!selectedTaskForPomodoro) return;

    try {
      setSubmitting(true);

      const task = selectedTaskForPomodoro;

      await updateTaskApi(task.id, {
        title: task.title,
        description: task.description,
        status: 'done',
        due_date: task.due_date || `${new Date()}`,
        priority: task.priority,
      });

      setTasks(
        tasks.map((task) =>
          task.id === selectedTaskForPomodoro.id
            ? { ...task, status: 'done' }
            : task
        )
      );

      closeModals();
    } catch (err) {
      console.error('Erro ao finalizar task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, userId]);

  const statusColumns: { status: TaskStatus; label: string }[] = [
    { status: 'pending', label: 'Pending 🟠' },
    { status: 'in_progress', label: 'In Progress 🟡' },
    { status: 'done', label: 'Done 🟢' },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button
            className="button button-ghost"
            onClick={() => navigate('/dashboard')}
            type="button"
            style={{ marginBottom: '0.5rem' }}
          >
            ← Back to workspaces
          </button>
          <h2 className="page-title">{workspaceTitle}</h2>
          <p className="muted">Manage tasks from this workspace</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          Create Task
        </button>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading && !error && tasks.length === 0 ? (
        <div className="card">
          <div className="card-title">No tasks yet</div>
          <div className="muted">Create your first task to start.</div>
        </div>
      ) : null}

      {!loading && !error && tasks.length > 0 ? (
        <div className="kanban-board">
          {statusColumns.map((column) => (
            <div
              key={column.status}
              className={`kanban-column ${
                dragOverColumn === column.status ? 'drag-over' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="kanban-column-header">
                <h3 className="kanban-column-title">{column.label}</h3>
                <span className="kanban-column-count">
                  {organizedTasks[column.status].length}
                </span>
              </div>
              <div className="kanban-column-content">
                {organizedTasks[column.status].map((task) => (
                  <div
                    key={task.id}
                    className="task-card draggable"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-card-top">
                      <div className="task-card-title">{task.title}</div>
                      <div className={priorityClass(task.priority)}>
                        {priorityLabel(task.priority)}
                      </div>
                    </div>
                    <div className="task-card-desc">{task.description}</div>
                    {task.due_date && (
                      <div
                        className="muted"
                        style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
                      >
                        Due Date:{' '}
                        {new Date(task.due_date).toLocaleDateString('en-US')}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '1rem',
                      }}
                    >
                      {(task.status === 'pending' ||
                        task.status === 'in_progress') && (
                        <button
                          className="button button-primary"
                          onClick={() => openPomodoroModal(task)}
                          type="button"
                          style={{ flex: 0 }}
                        >
                          ⏱
                        </button>
                      )}
                      <button
                        className="button button-secondary"
                        onClick={() => openEditModal(task)}
                        type="button"
                        style={{ flex: 1 }}
                      >
                        Edit
                      </button>
                      <button
                        className="button button-ghost"
                        onClick={() => handleDelete(task.id)}
                        type="button"
                        style={{ flex: 1 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {organizedTasks[column.status].length === 0 && (
                  <div className="kanban-empty-state">
                    <span className="muted">Drag tasks here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* //pomodoro.tsx as modal */}
      {showPomodoroModal && selectedTaskForPomodoro && (
        <div
          className="modal-overlay"
          onClick={closeModals}
          style={{ overflow: 'hidden' }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3 className="modal-title">
                Pomodoro - {selectedTaskForPomodoro.title}
              </h3>
              <button
                className="button button-ghost"
                onClick={closeModals}
                type="button"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                ✕
              </button>
            </div>
            <PomodoroTimer />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1rem',
              }}
            >
              <button
                className="button button-finish"
                type="button"
                onClick={handleFinishTask}
                disabled={submitting}
                style={{ display: 'flex' }}
              >
                Finish Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create Task</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreate();
              }}
            >
              <label className="field">
                <span className="field-label">Title</span>
                <input
                  className="input"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  type="text"
                  placeholder="Task title"
                  required
                  autoFocus
                />
              </label>
              <label className="field">
                <span className="field-label">Description</span>
                <textarea
                  className="input"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task description"
                  rows={3}
                />
              </label>
              <label className="field">
                <span className="field-label">Due Date</span>
                <input
                  className="input"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  type="date"
                />
              </label>
              <label className="field">
                <span className="field-label">Priority</span>
                <select
                  className="input"
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as TaskPriority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <div
                style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
              >
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
      {editingTask && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Task</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdate();
              }}
            >
              <label className="field">
                <span className="field-label">Title</span>
                <input
                  className="input"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  type="text"
                  placeholder="Task title"
                  required
                  autoFocus
                />
              </label>
              <label className="field">
                <span className="field-label">Description</span>
                <textarea
                  className="input"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task description"
                  rows={3}
                />
              </label>
              <label className="field">
                <span className="field-label">Status</span>
                <select
                  className="input"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Due Date</span>
                <input
                  className="input"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  type="date"
                />
              </label>
              <label className="field">
                <span className="field-label">Priority</span>
                <select
                  className="input"
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as TaskPriority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <div
                style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
              >
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
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
