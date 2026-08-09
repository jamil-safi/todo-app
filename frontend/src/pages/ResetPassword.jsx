// src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/auth/password-reset/confirm/', {
        uid,
        token,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const messages = err.data ? Object.values(err.data).flat().join(' ') : 'Reset failed.';
      setError(messages);
    } finally {
      setSubmitting(false);
    }
  }

  if (!uid || !token) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--spacing-md)' }}>
        <div className="card">
          <div className="alert alert-danger">Invalid reset link. Please request a new one.</div>
          <Link to="/forgot-password" className="btn btn-secondary btn-block">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--spacing-md)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-header">
          <h2 className="card-title">Reset Password</h2>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Enter your new password below
          </p>
        </div>

        <div className="card-body">
          {success ? (
            <div className="alert alert-success">
              Password reset successfully. Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-block"
              >
                {submitting ? (
                  <span className="flex-center gap-sm">
                    <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
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

export default ResetPassword;
