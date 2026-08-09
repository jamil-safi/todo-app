// src/pages/Profile.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AppShell from '../components/AppShell';

function initials(user) {
  const a = user.first_name?.[0] || user.username?.[0] || '';
  const b = user.last_name?.[0] || '';
  return (a + b).toUpperCase();
}

function Profile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const displayName =
    user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username;

  return (
    <AppShell>
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex" style={{ alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              flexShrink: 0,
            }}
          >
            {initials(user)}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{displayName}</h2>
            <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>
              @{user.username} · {user.email}
            </p>
          </div>
        </div>

        {isEditing ? (
          <ProfileEditForm user={user} onDone={() => setIsEditing(false)} onSaved={setUser} />
        ) : (
          <ProfileView user={user} onEdit={() => setIsEditing(true)} />
        )}
      </div>
    </AppShell>
  );
}

// ---------- Section wrapper used by both view & edit modes ----------
function Section({ icon, title, children, footer }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div
        className="flex"
        style={{
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
          paddingBottom: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>{title}</h4>
      </div>

      {children}

      {footer && (
        <div
          className="flex"
          style={{
            gap: 'var(--spacing-md)',
            justifyContent: 'flex-end',
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      className="flex-between"
      style={{
        padding: 'var(--spacing-md) 0',
        borderBottom: '1px solid var(--color-border-light)',
      }}
    >
      <span className="text-muted text-sm">{label}</span>
      <span style={{ fontWeight: 'var(--font-weight-medium)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ---------- Read-only display ----------
function ProfileView({ user, onEdit }) {
  return (
    <>
      <Section
        icon="👤"
        title="Personal Information"
        footer={
          <button onClick={onEdit} className="btn btn-primary btn-sm" style={{ background: 'var(--color-primary-dark)' }}>
            ✏️ Edit Profile
          </button>
        }
      >
        <InfoRow label="First Name" value={user.first_name || '—'} />
        <InfoRow label="Last Name" value={user.last_name || '—'} />
        <InfoRow label="Username" value={user.username} />
        <div style={{ padding: 'var(--spacing-md) 0' }} className="flex-between">
          <span className="text-muted text-sm">Email</span>
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{user.email}</span>
        </div>
      </Section>

      <Section icon="🔒" title="Security">
        <p className="text-muted text-sm" style={{ margin: 0 }}>
          Your password is hidden for security. Click "Edit Profile" above to change it — you'll need
          your current password to confirm.
        </p>
      </Section>
    </>
  );
}

// ---------- Editable form ----------
function ProfileEditForm({ user, onDone, onSaved }) {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = { first_name: firstName, last_name: lastName, current_password: currentPassword };
    if (newPassword) {
      payload.new_password = newPassword;
      payload.confirm_new_password = confirmNewPassword;
    }

    try {
      const data = await api.patch('/auth/me/', payload);
      onSaved(data);
      onDone();
    } catch (err) {
      const messages = err.data ? Object.values(err.data).flat().join(' ') : 'Update failed.';
      setError(messages);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section icon="👤" title="Personal Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label>Username</label>
          <input className="form-control" value={user.username} disabled />
          <div className="form-help">Username cannot be changed.</div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Email</label>
          <input className="form-control" value={user.email} disabled />
          <div className="form-help">Email cannot be changed.</div>
        </div>
      </Section>

      <Section icon="🔒" title="Change Password (optional)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              className="form-control"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
        </div>
        <p className="text-muted text-sm" style={{ margin: 'var(--spacing-sm) 0 0 0' }}>
          Leave blank to keep your current password.
        </p>
      </Section>

      <Section
        icon="✅"
        title="Confirm Changes"
        footer={
          <>
            <button type="button" onClick={onDone} className="btn btn-secondary btn-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ background: 'var(--color-primary-dark'}} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="currentPassword">
            Current Password <span style={{ color: 'var(--color-danger)' }}>*required</span>
          </label>
          <input
            id="currentPassword"
            type="password"
            className="form-control"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password to confirm any change"
            required
          />
        </div>

        {error && <div className="alert alert-danger" style={{ marginTop: 'var(--spacing-md)' }}>{error}</div>}
      </Section>
    </form>
  );
}

export default Profile;