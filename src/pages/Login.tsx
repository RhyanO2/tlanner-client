import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginApi } from '../lib/api';
import { setToken } from '../lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginApi({ email, password });
      setToken(res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container auth">
      <div className="auth-card">
        <h2 className="auth-title">Welcome back</h2>
        <p className="muted">Sign in to access your tasks.</p>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="alert">{error}</div> : null}

          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="muted">No account?</span>
          <Link className="link" to="/register">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
