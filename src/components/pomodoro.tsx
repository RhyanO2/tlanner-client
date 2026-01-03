// import { useState, useEffect, useRef } from 'react';
// import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

// interface PomodoroSettings {
//   workMinutes: number;
//   shortBreakMinutes: number;
//   longBreakMinutes: number;
//   sessionsUntilLongBreak: number;
// }

// type TimerMode = 'work' | 'shortBreak' | 'longBreak';

// export default function PomodoroTimer() {
//   const [settings, setSettings] = useState<PomodoroSettings>({
//     workMinutes: 25,
//     shortBreakMinutes: 5,
//     longBreakMinutes: 15,
//     sessionsUntilLongBreak: 4,
//   });

//   const [showSettings, setShowSettings] = useState(false);
//   const [mode, setMode] = useState<TimerMode>('work');
//   const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
//   const [isRunning, setIsRunning] = useState(false);
//   const [completedSessions, setCompletedSessions] = useState(0);

//   const intervalRef = useRef<number | null>(null);

//   const getModeMinutes = (currentMode: TimerMode): number => {
//     switch (currentMode) {
//       case 'work':
//         return settings.workMinutes;
//       case 'shortBreak':
//         return settings.shortBreakMinutes;
//       case 'longBreak':
//         return settings.longBreakMinutes;
//     }
//   };

//   const resetTimer = () => {
//     setIsRunning(false);
//     setTimeLeft(getModeMinutes(mode) * 60);
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//   };

//   const switchMode = (newMode: TimerMode) => {
//     setMode(newMode);
//     setIsRunning(false);
//     setTimeLeft(getModeMinutes(newMode) * 60);
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//   };

//   const handleTimerComplete = () => {
//     const audio = new Audio(
//       'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDN+0fPTgjMGHm7A7+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo+muD0wXIgBSl6ze/biz0HGWe77eeeTRALT6Xj7rhiHAU7kdTxy3gqBCV3xu/bjT4HGGe37+OZUQ4PVKzo56xZFAo='
//     );
//     audio.play().catch(() => {});

//     if (mode === 'work') {
//       const newCompletedSessions = completedSessions + 1;
//       setCompletedSessions(newCompletedSessions);

//       if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
//         switchMode('longBreak');
//       } else {
//         switchMode('shortBreak');
//       }
//     } else {
//       switchMode('work');
//     }
//   };

//   useEffect(() => {
//     if (isRunning && timeLeft > 0) {
//       intervalRef.current = window.setInterval(() => {
//         setTimeLeft((prev) => {
//           if (prev <= 1) {
//             handleTimerComplete();
//             return getModeMinutes(mode) * 60;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     } else if (!isRunning && intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }

//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//       }
//     };
//   }, [isRunning, timeLeft, mode]);

//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs
//       .toString()
//       .padStart(2, '0')}`;
//   };

//   const handleSaveSettings = (newSettings: PomodoroSettings) => {
//     setSettings(newSettings);
//     setShowSettings(false);
//     resetTimer();
//   };

//   const progress = (1 - timeLeft / (getModeMinutes(mode) * 60)) * 100;

//   const modeColors = {
//     work: 'from-[var(--primary)] to-[var(--primary-dark)]',
//     shortBreak: 'from-[var(--success)] to-[var(--success-dark)]',
//     longBreak: 'from-[var(--info)] to-[var(--info-dark)]',
//   };

//   const modeTitles = {
//     work: 'Tempo de Trabalho',
//     shortBreak: 'Pausa Curta',
//     longBreak: 'Pausa Longa',
//   };

//   return (
//     <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         <div
//           className={`bg-gradient-to-br ${modeColors[mode]} p-1 rounded-3xl shadow-2xl`}
//         >
//           <div className="bg-[var(--surface)] rounded-3xl p-8">
//             <div className="flex justify-between items-center mb-8">
//               <h1 className="text-2xl font-bold text-[var(--text-primary)]">
//                 {modeTitles[mode]}
//               </h1>
//               <button
//                 onClick={() => setShowSettings(!showSettings)}
//                 className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
//               >
//                 <Settings className="w-6 h-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
//               </button>
//             </div>

//             {showSettings ? (
//               <SettingsPanel
//                 settings={settings}
//                 onSave={handleSaveSettings}
//                 onClose={() => setShowSettings(false)}
//               />
//             ) : (
//               <>
//                 <div className="relative mb-8">
//                   <svg className="w-full h-64" viewBox="0 0 200 200">
//                     <circle
//                       cx="100"
//                       cy="100"
//                       r="90"
//                       fill="none"
//                       stroke="var(--border)"
//                       strokeWidth="12"
//                     />
//                     <circle
//                       cx="100"
//                       cy="100"
//                       r="90"
//                       fill="none"
//                       stroke="url(#gradient)"
//                       strokeWidth="12"
//                       strokeDasharray={`${2 * Math.PI * 90}`}
//                       strokeDashoffset={`${
//                         2 * Math.PI * 90 * (1 - progress / 100)
//                       }`}
//                       strokeLinecap="round"
//                       transform="rotate(-90 100 100)"
//                       className="transition-all duration-1000"
//                     />
//                     <defs>
//                       <linearGradient
//                         id="gradient"
//                         x1="0%"
//                         y1="0%"
//                         x2="100%"
//                         y2="100%"
//                       >
//                         <stop
//                           offset="0%"
//                           stopColor="currentColor"
//                           className={
//                             mode === 'work'
//                               ? 'text-red-500'
//                               : mode === 'shortBreak'
//                               ? 'text-green-500'
//                               : 'text-blue-500'
//                           }
//                         />
//                         <stop
//                           offset="100%"
//                           stopColor="currentColor"
//                           className={
//                             mode === 'work'
//                               ? 'text-orange-500'
//                               : mode === 'shortBreak'
//                               ? 'text-teal-500'
//                               : 'text-purple-500'
//                           }
//                         />
//                       </linearGradient>
//                     </defs>
//                   </svg>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div className="text-center">
//                       <div className="text-6xl font-bold text-[var(--text-primary)] mb-2">
//                         {formatTime(timeLeft)}
//                       </div>
//                       <div className="text-[var(--text-secondary)] text-sm">
//                         Sessão {completedSessions + 1}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex gap-4 mb-6">
//                   <button
//                     onClick={() => setIsRunning(!isRunning)}
//                     className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
//                       isRunning
//                         ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)]'
//                         : 'bg-gradient-to-r ' +
//                           modeColors[mode] +
//                           ' text-white hover:shadow-lg'
//                     }`}
//                   >
//                     {isRunning ? (
//                       <span className="flex items-center justify-center gap-2">
//                         <Pause className="w-5 h-5" /> Pausar
//                       </span>
//                     ) : (
//                       <span className="flex items-center justify-center gap-2">
//                         <Play className="w-5 h-5" /> Iniciar
//                       </span>
//                     )}
//                   </button>
//                   <button
//                     onClick={resetTimer}
//                     className="px-6 py-4 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-colors"
//                   >
//                     <RotateCcw className="w-5 h-5" />
//                   </button>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => switchMode('work')}
//                     className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       mode === 'work'
//                         ? 'bg-[var(--primary)] text-white'
//                         : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
//                     }`}
//                   >
//                     Trabalho
//                   </button>
//                   <button
//                     onClick={() => switchMode('shortBreak')}
//                     className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       mode === 'shortBreak'
//                         ? 'bg-[var(--success)] text-white'
//                         : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
//                     }`}
//                   >
//                     Pausa Curta
//                   </button>
//                   <button
//                     onClick={() => switchMode('longBreak')}
//                     className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       mode === 'longBreak'
//                         ? 'bg-[var(--info)] text-white'
//                         : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
//                     }`}
//                   >
//                     Pausa Longa
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SettingsPanel({
//   settings,
//   onSave,
//   onClose,
// }: {
//   settings: PomodoroSettings;
//   onSave: (settings: PomodoroSettings) => void;
//   onClose: () => void;
// }) {
//   const [localSettings, setLocalSettings] = useState(settings);

//   const handleChange = (key: keyof PomodoroSettings, value: number) => {
//     setLocalSettings((prev) => ({ ...prev, [key]: value }));
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
//           Tempo de Trabalho (minutos)
//         </label>
//         <input
//           type="number"
//           value={localSettings.workMinutes}
//           onChange={(e) =>
//             handleChange('workMinutes', parseInt(e.target.value) || 0)
//           }
//           className="w-full px-4 py-3 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none border border-[var(--border)]"
//           min="1"
//           max="60"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
//           Pausa Curta (minutos)
//         </label>
//         <input
//           type="number"
//           value={localSettings.shortBreakMinutes}
//           onChange={(e) =>
//             handleChange('shortBreakMinutes', parseInt(e.target.value) || 0)
//           }
//           className="w-full px-4 py-3 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--success)] outline-none border border-[var(--border)]"
//           min="1"
//           max="30"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
//           Pausa Longa (minutos)
//         </label>
//         <input
//           type="number"
//           value={localSettings.longBreakMinutes}
//           onChange={(e) =>
//             handleChange('longBreakMinutes', parseInt(e.target.value) || 0)
//           }
//           className="w-full px-4 py-3 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--info)] outline-none border border-[var(--border)]"
//           min="1"
//           max="60"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
//           Sessões até Pausa Longa
//         </label>
//         <input
//           type="number"
//           value={localSettings.sessionsUntilLongBreak}
//           onChange={(e) =>
//             handleChange(
//               'sessionsUntilLongBreak',
//               parseInt(e.target.value) || 0
//             )
//           }
//           className="w-full px-4 py-3 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--warning)] outline-none border border-[var(--border)]"
//           min="1"
//           max="10"
//         />
//       </div>

//       <div className="flex gap-3 pt-4">
//         <button
//           onClick={() => onSave(localSettings)}
//           className="flex-1 py-3 bg-[var(--success)] text-white rounded-lg font-semibold hover:bg-[var(--success-dark)] transition-all"
//         >
//           Salvar
//         </button>
//         <button
//           onClick={onClose}
//           className="flex-1 py-3 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg font-semibold hover:bg-[var(--border)] transition-colors"
//         >
//           Cancelar
//         </button>
//       </div>
//     </div>
//   );
// }
