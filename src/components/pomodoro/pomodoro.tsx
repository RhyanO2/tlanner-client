import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';
import { FiRotateCcw } from 'react-icons/fi';
import './pomodoro.css';

interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

type SessionHistory = {
  id: string;
  mode: TimerMode;
  completedAt: number;
  durationMinutes: number;
};

const PRESETS: Array<{
  label: string;
  work: number;
  short: number;
  long: number;
}> = [
  { label: 'Classic 25/5', work: 25, short: 5, long: 15 },
  { label: 'Deep 50/10', work: 50, short: 10, long: 20 },
  { label: 'Light 15/3', work: 15, short: 3, long: 10 },
];

const MODE_LABELS: Record<TimerMode, string> = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

function clampMinutes(value: number) {
  return Math.min(180, Math.max(1, Math.floor(value)));
}

function getModeColor(mode: TimerMode) {
  if (mode === 'work') return 'var(--text)';
  if (mode === 'shortBreak') return 'var(--primary-2)';
  return '#9ca3af';
}

function getModeMinutesFromSettings(
  settings: PomodoroSettings,
  mode: TimerMode,
) {
  if (mode === 'work') return settings.workMinutes;
  if (mode === 'shortBreak') return settings.shortBreakMinutes;
  return settings.longBreakMinutes;
}

function getModeSecondsFromSettings(
  settings: PomodoroSettings,
  mode: TimerMode,
) {
  return getModeMinutesFromSettings(settings, mode) * 60;
}

export default function PomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsUntilLongBreak: 4,
  });

  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef<number | null>(null);

  const totalSeconds = getModeSecondsFromSettings(settings, mode);
  const progress = totalSeconds === 0 ? 0 : (1 - timeLeft / totalSeconds) * 100;

  const requestBrowserNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getModeSecondsFromSettings(settings, mode));
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const switchMode = (m: TimerMode) => {
    setMode(m);
    setIsRunning(false);
    setTimeLeft(getModeSecondsFromSettings(settings, m));
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    const nextSettings = {
      workMinutes: preset.work,
      shortBreakMinutes: preset.short,
      longBreakMinutes: preset.long,
      sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
    };
    setSettings(nextSettings);
    setIsRunning(false);
    setTimeLeft(
      mode === 'work'
        ? nextSettings.workMinutes * 60
        : mode === 'shortBreak'
          ? nextSettings.shortBreakMinutes * 60
          : nextSettings.longBreakMinutes * 60,
    );
  };

  const updateSetting = (key: keyof PomodoroSettings, value: number) => {
    const normalizedValue =
      key === 'sessionsUntilLongBreak'
        ? Math.min(12, Math.max(2, Math.floor(value)))
        : clampMinutes(value);

    const nextSettings = {
      ...settings,
      [key]: normalizedValue,
    };

    setSettings(nextSettings);

    if (!isRunning) {
      const nextSeconds =
        mode === 'work'
          ? nextSettings.workMinutes * 60
          : mode === 'shortBreak'
            ? nextSettings.shortBreakMinutes * 60
            : nextSettings.longBreakMinutes * 60;
      setTimeLeft(nextSeconds);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const emitSound = () => {
      if (!soundEnabled) return;
      const AudioContextCtor =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof window.AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContextCtor) return;

      const audioContext = new AudioContextCtor();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.12;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
      window.setTimeout(() => {
        void audioContext.close();
      }, 250);
    };

    const handleComplete = async () => {
      const finishedMode = mode;
      const finishedDuration = getModeMinutesFromSettings(
        settings,
        finishedMode,
      );

      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          mode: finishedMode,
          completedAt: Date.now(),
          durationMinutes: finishedDuration,
        },
        ...current,
      ]);

      if (finishedMode === 'work') {
        const nextCount = completedSessions + 1;
        setCompletedSessions(nextCount);
        const nextMode =
          nextCount % settings.sessionsUntilLongBreak === 0
            ? 'longBreak'
            : 'shortBreak';
        setMode(nextMode);
        setTimeLeft(getModeSecondsFromSettings(settings, nextMode));
      } else {
        setMode('work');
        setTimeLeft(getModeSecondsFromSettings(settings, 'work'));
      }

      setIsRunning(false);
      emitSound();
      await requestBrowserNotification();

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(`${MODE_LABELS[finishedMode]} finished`, {
          body: 'Ready for the next step.',
        });
      }
    };

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.setTimeout(() => {
            void handleComplete();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, settings, completedSessions, soundEnabled]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
      2,
      '0',
    )}`;

  return (
    <div className="pomodoro-root">
      <div className="pomodoro-card">
        <div className="pomodoro-inner">
          <div className="pomodoro-header">
            <h2 className="pomodoro-title">Pomodoro</h2>
            <button
              className="button button-ghost pomodoro-settings-toggle"
              onClick={() => setShowSettings((current) => !current)}
              type="button"
            >
              {showSettings ? 'Hide settings' : 'Show settings'}
            </button>
          </div>

          <div className="mode-switch" role="tablist" aria-label="Timer mode">
            {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
              <button
                key={m}
                className={`mode-btn ${mode === m ? 'is-active' : ''}`}
                onClick={() => switchMode(m)}
                type="button"
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <div className="timer-wrapper">
            <svg viewBox="0 0 200 200" className="timer-ring">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="var(--border)"
                strokeWidth="10"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={getModeColor(mode)}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="timer-center">
              <div className="timer-mode-label">{MODE_LABELS[mode]}</div>
              <div className="timer-time">{formatTime(timeLeft)}</div>
              <div className="timer-session">
                Completed focus sessions: {completedSessions}
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              className="primary-btn"
              onClick={() => setIsRunning((current) => !current)}
              type="button"
            >
              <span className="primary-icon-btn">
                {isRunning ? <FaPause /> : <FaPlay />}
                {isRunning ? 'Pause' : 'Start'}
              </span>
            </button>
            <button
              className="secondary-icon-btn"
              onClick={resetTimer}
              type="button"
            >
              <FiRotateCcw size={17} />
            </button>
          </div>

          <div className="preset-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                className="preset-btn"
                type="button"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {showSettings ? (
            <div className="settings-panel">
              <label className="settings-group">
                <span className="settings-label">Focus (minutes)</span>
                <input
                  className="settings-input"
                  type="number"
                  min={1}
                  max={180}
                  value={settings.workMinutes}
                  onChange={(e) =>
                    updateSetting('workMinutes', Number(e.target.value))
                  }
                />
              </label>

              <label className="settings-group">
                <span className="settings-label">Short break (minutes)</span>
                <input
                  className="settings-input"
                  type="number"
                  min={1}
                  max={180}
                  value={settings.shortBreakMinutes}
                  onChange={(e) =>
                    updateSetting('shortBreakMinutes', Number(e.target.value))
                  }
                />
              </label>

              <label className="settings-group">
                <span className="settings-label">Long break (minutes)</span>
                <input
                  className="settings-input"
                  type="number"
                  min={1}
                  max={180}
                  value={settings.longBreakMinutes}
                  onChange={(e) =>
                    updateSetting('longBreakMinutes', Number(e.target.value))
                  }
                />
              </label>

              <label className="settings-group">
                <span className="settings-label">
                  Sessions until long break
                </span>
                <input
                  className="settings-input"
                  type="number"
                  min={2}
                  max={12}
                  value={settings.sessionsUntilLongBreak}
                  onChange={(e) =>
                    updateSetting(
                      'sessionsUntilLongBreak',
                      Number(e.target.value),
                    )
                  }
                />
              </label>

              <label className="pomodoro-toggle">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <span>Sound notification</span>
              </label>
            </div>
          ) : null}

          <div className="history-section">
            <div className="history-title">Recent sessions</div>
            {history.length === 0 ? (
              <div className="muted">No sessions completed yet.</div>
            ) : (
              <ul className="history-list">
                {history.slice(0, 6).map((entry) => (
                  <li key={entry.id} className="history-item">
                    <span>{MODE_LABELS[entry.mode]}</span>
                    <span>
                      {entry.durationMinutes} min ·{' '}
                      {new Date(entry.completedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
