import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../lib/auth';

export function AppShell(props: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const authed = Boolean(getToken());

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">Tlanner</span>
          </Link>

          <nav className="nav">
            <NavLink className="nav-link" to="/">
              Home
            </NavLink>
            {authed ? (
              <>
                <NavLink className="nav-link" to="/dashboard">
                  Dashboard
                </NavLink>
                <button
                  className="button button-ghost"
                  onClick={() => {
                    clearToken();
                    navigate('/login');
                  }}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink className="nav-link" to="/login">
                  Login
                </NavLink>
                <NavLink className="button button-primary" to="/register">
                  Get started
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">{props.children}</main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="muted">© {new Date().getFullYear()} Tlanner</span>
          <span className="muted">Plan. Focus. Finish.</span>
        </div>
      </footer>
    </div>
  );
}
