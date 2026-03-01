import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container">
      <section className="card not-found-card" aria-label="Page not found">
        <p className="landing-free-chip">404</p>
        <h2 className="page-title">Page not found</h2>
        <p className="muted not-found-copy">
          The page you tried to access does not exist or has been moved.
        </p>
        <div className="landing-cta">
          <Link className="button button-primary" to="/">
            Go to home
          </Link>
          <Link className="button button-secondary" to="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
