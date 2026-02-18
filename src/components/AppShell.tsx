import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import { clearToken, getToken } from '../lib/auth';
import {
  LuHouse,
  LuListChecks,
  LuPanelLeft,
  LuPanelLeftClose,
  LuTimer,
  LuLogOut,
} from 'react-icons/lu';
import { RealtimeToasts } from './RealtimeToasts';

type AppShellMode = 'public' | 'authenticated';

type AppShellProps = {
  mode: AppShellMode;
};

const authNavItems = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LuHouse },
  { to: '/dashboard', label: 'Tasks', shortLabel: 'Tasks', icon: LuListChecks },
  {
    to: '/habittracker',
    label: 'Habits',
    shortLabel: 'Habits',
    icon: LuListChecks,
  },
  { to: '/pomodoro', label: 'Pomodoro', shortLabel: 'Focus', icon: LuTimer },
];

function TlannerLogo(props: { compact?: boolean }) {
  if (props.compact) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={26}
        height={26}
        role="img"
        aria-label="Tlanner"
        className="brand-logo"
      >
        <rect x="46" y="27" width="16" height="60" rx="4" fill="var(--primary-2)" />
        <path
          d="M20,38 C20,38 35,50 45,50 C55,50 85,15 85,15"
          fill="none"
          stroke="var(--text)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 100"
      width={124}
      height={32}
      role="img"
      aria-label="Tlanner"
      className="brand-logo"
    >
      <g>
        <rect x="46" y="27" width="16" height="60" rx="4" fill="var(--primary-2)" />
        <path
          d="M20,38 C20,38 35,50 45,50 C55,50 85,15 85,15"
          fill="none"
          stroke="var(--text)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text
        x="110"
        y="83"
        fill="var(--text)"
        fontFamily="IBM Plex Sans, Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="70"
        letterSpacing="-1"
      >
        Tlanner
      </text>
    </svg>
  );
}

export function AppShell({ mode }: AppShellProps) {
  const navigate = useNavigate();
  const authed = Boolean(getToken());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (mode === 'public') {
    return (
      <div className="app">
        <header className="header">
          <div className="container header-inner">
            <Link className="brand" to={authed ? '/dashboard' : '/'}>
              <TlannerLogo />
            </Link>

            <nav className="nav" aria-label="Public navigation">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
              <NavLink className="nav-link" to="/login">
                Login
              </NavLink>
              <NavLink className="button button-primary" to="/register">
                Get started
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>

        <footer className="footer">
          <div className="container footer-inner">
            <span className="muted">© {new Date().getFullYear()} Tlanner</span>
            <span className="muted">Plan. Focus. Finish.</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="app app-shell-auth">
      <aside
        className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}
      >
        <div className="sidebar-header">
          <Link className="sidebar-brand" to={authed ? '/dashboard' : '/'}>
            <TlannerLogo compact={collapsed} />
          </Link>
          <button
            className="button button-ghost sidebar-toggle"
            onClick={() => setCollapsed((current) => !current)}
            type="button"
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {collapsed ? <LuPanelLeft size={18} /> : <LuPanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="App navigation">
          {authNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                className="sidebar-link"
                to={item.to}
                end
                onClick={() => setMobileOpen(false)}
              >
                <span className="sidebar-link-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar-link-text">
                  {collapsed ? item.shortLabel : item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <button
          className="button button-ghost sidebar-logout"
          onClick={() => {
            clearToken();
            navigate('/login', { replace: true });
            setMobileOpen(false);
          }}
          type="button"
        >
          <LuLogOut size={18} />
          <span>{collapsed ? 'Exit' : 'Logout'}</span>
        </button>
      </aside>

      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />

      <div className="app-content">
        <header className="mobile-topbar">
          <button
            className="button button-ghost"
            onClick={() => setMobileOpen((current) => !current)}
            type="button"
            aria-label="Toggle menu"
          >
            <LuPanelLeft size={18} />
          </button>
          <TlannerLogo compact />
        </header>
        <main className="main main-auth">
          <Outlet />
        </main>
        <RealtimeToasts />
      </div>
    </div>
  );
}
