import { useState } from 'react';

export function ListForm({ onSubmit, onCancel, initialTitle = '', isLoading = false }) {
  const [title, setTitle] = useState(initialTitle);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onCancel}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',

          maxWidth: '400px',
          width: '90%',
          zIndex: 1001,
        }}
      >
        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: '0 0 var(--spacing-lg) 0', color: 'var(--color-text)' }}>
            {initialTitle ? 'Rename List' : 'Create New List'}
          </h3>

          <div className="form-group">
            <label htmlFor="listTitle">List Name</label>
            <input
              id="listTitle"
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter list name"
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style = {{ background: 'var(--color-primary-dark)'}}disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: '1rem', height: '1rem', marginRight: 'var(--spacing-sm)' }}></span>
                  Saving...
                </>
              ) : initialTitle ? (
                'Rename'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
