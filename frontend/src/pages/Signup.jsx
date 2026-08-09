// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

      try {
        await signup(formData);
        navigate('/login', {
          state: {
            message: '🎉Account created successfully. log in now!',
          },
        });
      } catch (err) {
      setErrors(err.data || { general: 'Signup failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--spacing-md)' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>📝</div>

          <h1 style={{
            margin: '0.5rem 0 0.25rem 0',
            fontSize: '2rem',
            fontWeight: '700',
          }}>
            TaskFlow
          </h1>

          <p className="text-muted">
            Organize your tasks efficiently
          </p>
        </div>
        <div className="card-header">
          <h2 className="card-title">Create Account</h2>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Sign up to start organizing your tasks
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <Field label="Username" name="username" value={formData.username} onChange={handleChange} error={errors.username} />
            <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <Field label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} />
            <Field label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} />
            <Field label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} />
            <Field label="Confirm Password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} error={errors.confirm_password} />

            {errors.general && <div className="alert alert-danger">{errors.general}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-block"
              style={{ marginTop: 'var(--spacing-lg)' , backgroundColor: 'var(--color-primary-dark)' }}
            >
              {submitting ? (
                <span className="flex-center gap-sm">
                  <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
                  Signing up...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        </div>

        <div className="card-footer" style={{ flexDirection: 'column' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
            Already have an account?{' '}

            <Link to="/login" style={{ fontWeight: 'var(--font-weight-medium)' , color: 'var(--color-third )' }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// A small reusable sub-component for each form field, so we don't repeat this markup 6 times
function Field({ label, name, type = 'text', value, onChange, error }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        required
        className={`form-control ${error ? 'is-invalid' : ''}`}
      />
      {error && <div className="form-error">{Array.isArray(error) ? error[0] : error}</div>}
    </div>
  );
}

export default Signup;
