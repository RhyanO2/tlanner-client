import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="container">
      <section className="landing-minimal">
        <div className="landing-hero">
          <div className="landing-hero-main">
            <p className="landing-free-chip">Free Beta Access</p>
            <h1 className="landing-title">
              Build focus today, scale your workflow tomorrow.
              <span className="landing-title-highlight">
                {' '}
                Start free in beta.
              </span>
            </h1>
            <p className="landing-subtitle">
              Tlanner helps you organize workspaces, tasks and focus sessions in
              one clean flow. Access is free during beta while we evolve
              advanced features for future plans.
            </p>
            <div className="landing-cta">
              <Link className="button button-primary" to="/register">
                Start free beta
              </Link>
              <Link className="button button-secondary" to="/login">
                Sign in
              </Link>
            </div>
          </div>

          <div className="landing-hero-side">
            <p className="landing-kicker">What you get in beta</p>
            <ul className="landing-list">
              <li>Unlimited workspaces and task management.</li>
              <li>Realtime collaboration updates.</li>
              <li>Pomodoro timer for deep focus sessions.</li>
            </ul>
          </div>
        </div>

        <div className="landing-columns">
          <div className="landing-block">
            <p className="landing-kicker">How it works</p>
            <ol className="landing-list">
              <li>Create a workspace for each project or area.</li>
              <li>Add tasks and set priority and status.</li>
              <li>Use Pomodoro to keep focus and complete tasks.</li>
            </ol>
          </div>

          <div className="landing-block">
            <p className="landing-kicker">Why teams use Tlanner</p>
            <ul className="landing-list">
              <li>Clear statuses: pending, in progress and done.</li>
              <li>Realtime sync between connected users.</li>
              <li>Minimal interface with focus on execution.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
