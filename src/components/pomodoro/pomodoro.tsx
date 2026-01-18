import { useEffect, useRef, useState } from 'react';
// import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { IoMdSettings } from 'react-icons/io';
import { FiRotateCcw } from 'react-icons/fi';
import './pomodoro.css';

interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

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
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<number | null>(null);

  const modeConfig = {
    work: { color: '#009c007a', title: 'Worktime' },
    shortBreak: { color: '#006dd4ba', title: 'Short Pause' },
    longBreak: { color: '#667eeab4', title: 'Long Pause' },
  };

  const getModeMinutes = (m: TimerMode) =>
    m === 'work'
      ? settings.workMinutes
      : m === 'shortBreak'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getModeMinutes(mode) * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const switchMode = (m: TimerMode) => {
    setMode(m);
    setIsRunning(false);
    setTimeLeft(getModeMinutes(m) * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleComplete = () => {
    if (mode === 'work') {
      const next = completedSessions + 1;
      setCompletedSessions(next);
      switchMode(
        next % settings.sessionsUntilLongBreak === 0
          ? 'longBreak'
          : 'shortBreak',
      );
    } else {
      switchMode('work');
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return getModeMinutes(mode) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
      2,
      '0',
    )}`;

  const progress = (1 - timeLeft / (getModeMinutes(mode) * 60)) * 100;

  const current = modeConfig[mode];

  return (
    <div className="pomodoro-root">
      <div className="pomodoro-card">
        <div
          className="pomodoro-border"
          style={{
            background: `${current.color}`,
            // boxShadow: '0 20px 60px rgba(0, 0, 0, 0)',
          }}
        >
          <div className="pomodoro-inner">
            <div className="pomodoro-header">
              <h1 className="pomodoro-title">{current.title}</h1>
              <button
                className="icon-btn"
                onClick={() => setShowSettings(!showSettings)}
              >
                <IoMdSettings size={23} />
              </button>
            </div>

            {!showSettings ? (
              <>
                <div className="timer-wrapper">
                  <svg viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke={current.color}
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>

                  <div className="timer-center">
                    <div>
                      <div className="timer-time">{formatTime(timeLeft)}</div>
                      <div className="timer-session">
                        Session {completedSessions + 1}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="actions">
                  <button
                    className="primary-btn"
                    style={{
                      background: isRunning ? 'var(--card-2)' : current.color,
                    }}
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? (
                      <>
                        <div className="primary-icon-btn">
                          <FaPause /> Pause
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="primary-icon-btn">
                          <FaPlay /> Start
                        </div>
                      </>
                    )}
                  </button>

                  <button className="secondary-icon-btn" onClick={resetTimer}>
                    <FiRotateCcw size={17} />
                  </button>
                </div>

                <div className="mode-switch">
                  {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map(
                    (m) => (
                      <button
                        key={m}
                        className="mode-btn"
                        style={{
                          background:
                            mode === m ? modeConfig[m].color : 'var(--card-2)',
                          color: mode === m ? '#fff' : 'var(--muted)',
                        }}
                        onClick={() => switchMode(m)}
                      >
                        {m === 'work'
                          ? 'Work'
                          : m === 'shortBreak'
                            ? 'Short Break'
                            : 'Long Break'}
                      </button>
                    ),
                  )}
                </div>
              </>
            ) : (
              <SettingsPanel
                settings={settings}
                onSave={(s) => {
                  setSettings(s);
                  setShowSettings(false);
                  resetTimer();
                }}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  settings,
  onSave,
  onClose,
}: {
  settings: PomodoroSettings;
  onSave: (s: PomodoroSettings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(settings);

  const input = (label: string, key: keyof PomodoroSettings) => (
    <div className="settings-group">
      <label className="settings-label">{label}</label>
      <input
        className="settings-input"
        type="number"
        min="1"
        max="120"
        value={local[key]}
        onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) })}
      />
    </div>
  );

  return (
    <div className="options-select">
      {input('Work Time', 'workMinutes')}
      {input('Short Break', 'shortBreakMinutes')}
      {input('long Break', 'longBreakMinutes')}
      {input('Sessions until Long Break', 'sessionsUntilLongBreak')}

      <div className="actions">
        <button
          className="save-btn"
          onClick={() => onSave(local)}
          // style={{ background: '#fff', color: 'black', marginTop: '7px' }}
        >
          Save
        </button>
        <button
          className="cancel-btn"
          onClick={onClose}
          // style={{ marginTop: '7px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
