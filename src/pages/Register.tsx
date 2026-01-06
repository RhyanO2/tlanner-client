import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../lib/api';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerApi({ name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container auth">
      <div className="auth-card">
        <h2 className="auth-title">Create your account</h2>
        <p className="muted">Start organizing tasks in minutes.</p>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoComplete="name"
              required
            />
          </label>

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
            <div className="input-wrapper">
              <input
                className="input"
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>
          </label>

          {error ? <div className="alert">{error}</div> : null}

          <button
            className="button button-primary"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="muted">Already have an account?</span>
          <Link className="link" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
