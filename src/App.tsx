import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Register } from './pages/Register';
import { WorkspaceTasks } from './pages/WorkspaceTasks';
import PomodoroTimer from './components/pomodoro/pomodoro';
import { AuthCallback } from './pages/AuthCallback';
import { HabitTracker } from './pages/HabitTracker';

function App() {
  return (
    <Routes>
      <Route element={<AppShell mode="public" />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell mode="authenticated" />}>
          <Route path="/pomodoro" element={<PomodoroTimer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace/:workspaceId" element={<WorkspaceTasks />} />
          <Route path="/habittracker" element={<HabitTracker />} />
        </Route>
      </Route>

      <Route element={<AppShell mode="public" />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
