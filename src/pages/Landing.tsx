import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-left">
          <div className="badge">Task management, without the noise</div>
          <h1 className="hero-title">
            Tlanner helps you plan today and finish what matters.
          </h1>
          <p className="hero-subtitle">
            A fast, minimal and secure task manager. Perfect for work, study and
            daily planning
          </p>
          <div className="hero-cta">
            <Link className="button button-primary" to="/register">
              Create account
            </Link>
            <Link className="button button-secondary" to="/login">
              I already have an account
            </Link>
          </div>

          <div className="hero-stats">
            {/* <div className="stat">
              <div className="stat-value">Fast</div>
              <div className="stat-label">Vite + React UI</div>
            </div>
            <div className="stat">
              <div className="stat-value">Secure</div>
              <div className="stat-label">JWT protected routes</div>
            </div> */}
            <div className="stat">
              <div className="stat-value">Simple</div>
              <div className="stat-label">Pending → In progress → Done</div>
            </div>
            <div className="stat">
              <div className="stat-value">Workspaces</div>
              <div className="stat-label">
                Separate work, study and personal tasks
              </div>
            </div>
            <div className="stat">
              <div className="stat-value">Priorities</div>
              <div className="stat-label"> High → Medium → Low</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="card card-glow">
            <div className="card-title">Your day at a glance</div>
            <div className="task task-pending">
              <div className="task-title">Draft sprint plan</div>
              <div className="pill pill-pending">pending</div>
            </div>
            <div className="task task-progress">
              <div className="task-title">Implement auth flow</div>
              <div className="pill pill-progress">in progress</div>
            </div>
            <div className="task task-done">
              <div className="task-title">Ship dashboard UI</div>
              <div className="pill pill-done">done</div>
            </div>
            <div className="card-footer muted">
              Connect to your Tlanner API and manage your tasks.
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <div className="feature-title">Clean workflow</div>
          <div className="feature-text">
            A simple status model that mirrors how you actually work.
          </div>
        </div>
        <div className="feature">
          <div className="feature-title">Google calendar sync</div>
          <div className="feature-text">
            Syncronize your progress with google calendar
          </div>
        </div>
        <div className="feature">
          <div className="feature-title">AI integration</div>
          <div className="feature-text">
            AI-powered task planning and prioritization.
          </div>
        </div>
      </section>
    </div>
  );
}
