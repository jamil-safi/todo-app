// src/components/TaskForm.jsx
import { useState } from 'react';

export function TaskForm({ onSubmit, onCancel, isLoading = false, initialTask = null }) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [dueDate, setDueDate] = useState(initialTask?.due_date || '');
  const [reminderAt, setReminderAt] = useState(
    initialTask?.reminder_at ? initialTask.reminder_at.slice(0, 16) : ''
  );
  const [isImportant, setIsImportant] = useState(initialTask?.is_important || false);
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null,
      is_important: isImportant,
    };

    Promise.resolve(onSubmit(payload)).catch((err) => {
      const messages = err.data
        ? Object.values(err.data).flat().join(' ')
        : 'Could not save task.';
      setError(messages);
    });
  }

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
          maxWidth: '480px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          zIndex: 1001,
          // animation: 'slideIn 200ms ease-out',

        }}
      >
        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: '0 0 var(--spacing-lg) 0', color: 'var(--color-text)' }}>
            {initialTask ? 'Edit Task' : 'New Task'}
          </h3>

          <div className="form-group">
            <label htmlFor="taskTitle">Title</label>
            <input
              id="taskTitle"
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="taskDescription">Description</label>
            <textarea
              id="taskDescription"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail (optional)"
              rows={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label htmlFor="taskDueDate">Due Date</label>
              <input
                id="taskDueDate"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="taskReminder">Reminder</label>
              <input
                id="taskReminder"
                type="datetime-local"
                className="form-control"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <input
              id="taskImportant"
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label htmlFor="taskImportant" style={{ margin: 0, cursor: 'pointer' }}>
              Mark as important ⭐
            </label>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
            <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background : 'var(--color-primary-dark)' }} disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: '1rem', height: '1rem', marginRight: 'var(--spacing-sm)' }}></span>
                  Saving...
                </>
              ) : initialTask ? (
                'Save Changes'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}