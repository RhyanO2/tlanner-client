import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getUserIdFromToken, clearToken } from '../lib/auth';
import {
  createHabitApi,
  getHabitsByUserIdApi,
  updateHabitApi,
  deleteHabitApi,
  type Habit,
  type HabitFrequency,
} from '../lib/api';

function createTempId() {
  return `temp-${crypto.randomUUID()}`;
}

export function HabitTracker() {
  const navigate = useNavigate();
  const token = getToken();
  const userId = useMemo(
    () => (token ? getUserIdFromToken(token) : null),
    [token],
  );

  // Habits state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitHistory, setHabitHistory] = useState<Record<string, Set<string>>>(
    {},
  );
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<HabitFrequency>('daily');
  const [showCreateHabitModal, setShowCreateHabitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'habits' | 'daily'>('habits');

  useEffect(() => {
    if (!token || !userId) {
      clearToken();
      navigate('/login', { replace: true });
      return;
    }
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  useEffect(() => {
    if (userId) {
      loadHabitHistory();
    }
  }, [userId]);

  function loadHabitHistory() {
    if (!userId) return;
    const stored = localStorage.getItem(`habitHistory-${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const recovered: Record<string, Set<string>> = {};
        Object.keys(parsed).forEach((date) => {
          recovered[date] = new Set(parsed[date]);
        });
        setHabitHistory(recovered);
      } catch (err) {
        console.error('Failed to load habit history:', err);
      }
    }
  }

  function saveHabitHistory(newHistory: Record<string, Set<string>>) {
    if (!userId) return;
    const toStore: Record<string, string[]> = {};
    Object.keys(newHistory).forEach((date) => {
      toStore[date] = Array.from(newHistory[date]);
    });
    localStorage.setItem(`habitHistory-${userId}`, JSON.stringify(toStore));
  }

  async function loadData() {
    if (!userId) {
      clearToken();
      navigate('login', { replace: true });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const habitsRes = await getHabitsByUserIdApi(userId);
      setHabits(habitsRes.habits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // ===== HABIT METHODS =====
  async function handleCreateHabit() {
    if (!userId || !habitName.trim()) return;

    setSubmitting(true);
    setError(null);

    const createdHabitName = habitName.trim();

    const tempHabit: Habit = {
      id: createTempId(),
      name: createdHabitName,
      frequency: habitFrequency,
      id_user: userId,
      created_at: null,
    };

    setHabits((current) => [tempHabit, ...current]);
    setShowCreateHabitModal(false);
    resetHabitForm();

    try {
      const created = await createHabitApi({
        name: tempHabit.name,
        frequency: tempHabit.frequency,
        id_user: tempHabit.id_user,
      });
      setHabits((current) =>
        current.map((t) => (t.id === tempHabit.id ? created.habits : t)),
      );
    } catch (err) {
      setHabits((current) => current.filter((t) => t.id !== tempHabit.id));
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateHabit() {
    if (!editingHabit || !habitName.trim()) return;

    setSubmitting(true);
    setError(null);

    const optimisticHabit = {
      ...editingHabit,
      name: habitName,
      frequency: habitFrequency,
    };

    setHabits((current) =>
      current.map((t) => (t.id === editingHabit.id ? optimisticHabit : t)),
    );

    setEditingHabit(null);
    resetHabitForm();

    try {
      await updateHabitApi(editingHabit.id, {
        name: habitName,
        frequency: habitFrequency,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update habit');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteHabit(habitId: string) {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    try {
      await deleteHabitApi(habitId);
      setHabits((current) => current.filter((h) => h.id !== habitId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete habit');
    }
  }

  function openEditHabit(habit: Habit) {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitFrequency(habit.frequency);
  }

  function resetHabitForm() {
    setHabitName('');
    setHabitFrequency('daily');
  }

  // ===== DAILY HABITS METHODS =====
  function toggleHabitCompletion(habitId: string, date: string) {
    setHabitHistory((current) => {
      const updated = { ...current };
      if (!updated[date]) {
        updated[date] = new Set();
      }
      const dateSet = new Set(updated[date]);
      if (dateSet.has(habitId)) {
        dateSet.delete(habitId);
      } else {
        dateSet.add(habitId);
      }
      updated[date] = dateSet;
      saveHabitHistory(updated);
      return updated;
    });
  }

  function getDailyProgress(date: string) {
    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const completedIds = habitHistory[date] || new Set<string>();
    const completedCount = dailyHabits.filter((h) =>
      completedIds.has(h.id),
    ).length;
    return {
      total: dailyHabits.length,
      completed: completedCount,
      percentage:
        dailyHabits.length > 0
          ? Math.round((completedCount / dailyHabits.length) * 100)
          : 0,
    };
  }

  function formatDateDisplay(date: string): string {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .split('T')[0];

    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';

    const dateObj = new Date(date + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US');
  }

  function getPastDays(count: number): string[] {
    const dates: string[] = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        color: 'var(--text)',
        // padding: '32px 0 56px',
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5em' }}>
              Habit Tracker
            </h1>
            <p
              style={{
                color: 'var(--muted)',
                margin: '0 0 18px',
              }}
            >
              Today - {todayDate}
            </p>
            {error && <div className="alert">{error}</div>}
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '16px',
          }}
        >
          <button
            onClick={() => setActiveTab('habits')}
            className="nav-link"
            style={{
              color: activeTab === 'habits' ? 'var(--text)' : 'var(--muted)',
              background:
                activeTab === 'habits'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'transparent',
              borderColor:
                activeTab === 'habits' ? 'var(--border)' : 'transparent',
            }}
          >
            My Habits
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className="nav-link"
            style={{
              color: activeTab === 'daily' ? 'var(--text)' : 'var(--muted)',
              background:
                activeTab === 'daily'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'transparent',
              borderColor:
                activeTab === 'daily' ? 'var(--border)' : 'transparent',
            }}
          >
            Daily Habits
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
            Loading...
          </div>
        ) : (
          <>
            {/* HABITS TAB */}
            {activeTab === 'habits' && (
              <div>
                <div className="page-header">
                  <h2 className="page-title" style={{ fontSize: '28px' }}>
                    My Habits
                  </h2>
                  <button
                    onClick={() => setShowCreateHabitModal(true)}
                    className="button button-primary"
                  >
                    Create Habit
                  </button>
                </div>

                {/* Create/Edit Habit Modal */}
                {(showCreateHabitModal || editingHabit) && (
                  <div
                    className="modal-overlay"
                    onClick={() => {
                      setShowCreateHabitModal(false);
                      setEditingHabit(null);
                      resetHabitForm();
                    }}
                  >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                      <h3 className="modal-title">
                        {editingHabit ? 'Edit Habit' : 'Create Habit'}
                      </h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editingHabit) {
                            void handleUpdateHabit();
                          } else {
                            void handleCreateHabit();
                          }
                        }}
                      >
                        <label className="field">
                          <span className="field-label">Habit Name</span>
                          <input
                            type="text"
                            placeholder="Ex: Read, Exercise..."
                            value={habitName}
                            onChange={(e) => setHabitName(e.target.value)}
                            className="input"
                            required
                            autoFocus
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Frequency</span>
                          <select
                            value={habitFrequency}
                            onChange={(e) =>
                              setHabitFrequency(
                                e.target.value as HabitFrequency,
                              )
                            }
                            className="input"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </label>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: '1rem',
                          }}
                        >
                          <button
                            type="submit"
                            disabled={submitting}
                            className="button button-primary"
                            style={{ flex: 1 }}
                          >
                            {submitting
                              ? editingHabit
                                ? 'Updating...'
                                : 'Creating...'
                              : editingHabit
                                ? 'Update'
                                : 'Create'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateHabitModal(false);
                              setEditingHabit(null);
                              resetHabitForm();
                            }}
                            className="button button-secondary"
                            style={{ flex: 1 }}
                            disabled={submitting}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Habits List */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                    marginTop: '22px',
                  }}
                >
                  {habits.map((habit) => (
                    <div key={habit.id} className="task-card">
                      <div className="task-card-top">
                        <div className="task-card-title">{habit.name}</div>
                        <div
                          className={`pill ${
                            habit.frequency === 'daily'
                              ? 'pill-daily'
                              : habit.frequency === 'weekly'
                                ? 'pill-weekly'
                                : 'pill-monthly'
                          }`}
                        >
                          {habit.frequency === 'daily'
                            ? 'Daily'
                            : habit.frequency === 'weekly'
                              ? 'Weekly'
                              : 'Monthly'}
                        </div>
                      </div>
                      {habit.created_at && (
                        <div className="task-card-desc">
                          Created:{' '}
                          {new Date(habit.created_at).toLocaleDateString(
                            'en-US',
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '1rem',
                        }}
                      >
                        <button
                          onClick={() => openEditHabit(habit)}
                          className="button button-secondary"
                          type="button"
                          style={{ flex: 1 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDeleteHabit(habit.id)}
                          className="button button-ghost"
                          type="button"
                          style={{ flex: 1 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {habits.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--muted)',
                      padding: '48px 0',
                    }}
                  >
                    <p>No habits created yet</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Click "Create Habit" to get started
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* DAILY HABITS TAB */}
            {activeTab === 'daily' && (
              <div>
                <div className="page-header">
                  <h2
                    className="page-title"
                    style={{ fontSize: '28px', margin: 0 }}
                  >
                    Daily Habits
                  </h2>
                </div>

                {/* Daily Habit Cards */}
                <div
                  style={{ display: 'grid', gap: '24px', marginTop: '22px' }}
                >
                  {getPastDays(7).map((date) => {
                    const dailyHabits = habits.filter(
                      (h) => h.frequency === 'daily',
                    );
                    const progress = getDailyProgress(date);
                    const completedIds =
                      habitHistory[date] || new Set<string>();

                    return (
                      <div key={date} className="task-card">
                        {/* Card Header with Date and Progress */}
                        <div className="task-card-top">
                          <div className="task-card-title">
                            {formatDateDisplay(date)}
                          </div>
                          <span
                            style={{
                              color: 'var(--muted)',
                              fontSize: '14px',
                              fontWeight: 600,
                            }}
                          >
                            {progress.completed}/{progress.total}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            marginBottom: '12px',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${progress.percentage}%`,
                              background:
                                'linear-gradient(135deg, var(--success), var(--success-dark))',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        {/* Habits List */}
                        <div style={{ marginBottom: '12px' }}>
                          {dailyHabits.length > 0 ? (
                            dailyHabits.map((habit) => (
                              <label
                                key={habit.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  padding: '8px 0',
                                  transition: 'all 0.12s ease',
                                  opacity: completedIds.has(habit.id) ? 0.7 : 1,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={completedIds.has(habit.id)}
                                  onChange={() =>
                                    toggleHabitCompletion(habit.id, date)
                                  }
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer',
                                    marginRight: '8px',
                                    accentColor: 'var(--primary)',
                                  }}
                                />
                                <span
                                  style={{
                                    flex: 1,
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    textDecoration: completedIds.has(habit.id)
                                      ? 'line-through'
                                      : 'none',
                                    color: completedIds.has(habit.id)
                                      ? 'var(--muted)'
                                      : 'var(--text)',
                                  }}
                                >
                                  {habit.name}
                                </span>
                              </label>
                            ))
                          ) : (
                            <p
                              style={{
                                color: 'var(--muted)',
                                fontSize: '13px',
                                margin: 0,
                              }}
                            >
                              No daily habits
                            </p>
                          )}
                        </div>

                        {/* Completion Percentage */}
                        {dailyHabits.length > 0 && (
                          <div
                            style={{
                              paddingTop: '8px',
                              borderTop: '1px solid var(--border)',
                              fontSize: '13px',
                              color: 'var(--muted)',
                            }}
                          >
                            {progress.percentage}% Complete
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {habits.filter((h) => h.frequency === 'daily').length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--muted)',
                      padding: '48px 0',
                    }}
                  >
                    <p>No daily habits created</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Go to "My Habits" and create habits with daily frequency
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
