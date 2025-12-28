import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../lib/auth';

export function AppShell(props: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const authed = Boolean(getToken());

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link className="brand" to={authed ? '/dashboard' : '/'}>
            {/* <span className="brand-mark" aria-hidden="true" /> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 100"
              width="125"
              height="30"
              role="img"
              aria-label="Tlanner Logo"
            >
              <g>
                <rect
                  x="46"
                  y="27"
                  width="16"
                  height="60"
                  rx="4"
                  fill="#3626A7"
                />

                <path
                  d="M20,38 C20,38 35,50 45,50 C55,50 85,15 85,15"
                  fill="none"
                  stroke="#21FA90"
                  stroke-width="12"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>

              <text
                x="110"
                y="83"
                fill="#FFFFFF"
                font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
                font-weight="bold"
                font-size="70"
                letter-spacing="-1"
              >
                Tlanner
              </text>
            </svg>
            {/* <span className="brand-text">Tlanner</span> */}
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
