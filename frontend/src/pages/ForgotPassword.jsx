// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.post('/auth/password-reset/request/', { email });
      setMessage(data.message);
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--spacing-md)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-header">
          <h2 className="card-title">Forgot Password?</h2>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="card-body">
          {message ? (
            <div className="alert alert-success">{message}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-block"
              >
                {submitting ? (
                  <span className="flex-center gap-sm">
                    <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>

        <div className="card-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
