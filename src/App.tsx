import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { WorkspaceTasks } from './pages/WorkspaceTasks';
import PomodoroTimer from './components/pomodoro/pomodoro';
import { AuthCallback } from './pages/AuthCallback';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pomo" element={<PomodoroTimer />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace/:workspaceId" element={<WorkspaceTasks />} />
        </Route>
      </Routes>
    </AppShell>
  );
}

export default App;
