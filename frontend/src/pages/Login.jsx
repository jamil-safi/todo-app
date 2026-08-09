// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(username, password);

      // Remove the success message from history
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.data?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex-center"
      style={{ minHeight: '100vh', padding: 'var(--spacing-md)' }}
    >
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>📝</div>

          <h1
            style={{
              margin: '0.5rem 0 0.25rem 0',
              fontSize: '2rem',
              fontWeight: '700',
            }}
          >
            TaskFlow
          </h1>

          <p className="text-muted">
            Organize your tasks efficiently
          </p>
        </div>

        <div className="card-header">
          <h2 className="card-title">Welcome Back</h2>
          <p
            className="text-muted"
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            Log in to manage your tasks
          </p>
        </div>

        <div className="card-body">

          {/* Success message after signup */}
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username or Email</label>
              <input
                id="username"
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-block"
              style={{
                marginTop: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-primary-dark)',
              }}
            >
              {submitting ? (
                <span className="flex-center gap-sm">
                  <span
                    className="spinner"
                    style={{ width: '1rem', height: '1rem' }}
                  ></span>
                  Logging in...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>

        <div
          className="card-footer"
          style={{
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-third)',
              }}
            >
              Sign up
            </Link>
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                color: 'var(--color-third)',
              }}
            >
              Forgot password?
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;