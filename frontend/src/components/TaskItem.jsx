// src/components/TaskItem.jsx

function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

function DateBadge({ color, children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.9rem',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${color || 'var(--color-primary-light)'}`,
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: color || 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function TaskItem({ task, onToggleComplete, onToggleImportant, onDelete, onEdit }) {
  const isOverdue =
    task.due_date &&
    !task.is_completed &&
    new Date(task.due_date) < new Date().setHours(0, 0, 0, 0);

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <div
      className="card"
      onClick={() => onEdit(task)}
      style={{
        padding: 'var(--spacing-md)',
        transition: 'all var(--transition-base)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--color-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      <div
        className="flex"
        style={{
          gap: 'var(--spacing-md)',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div className="flex" style={{ flex: 1, gap: 'var(--spacing-md)', alignItems: 'center', minWidth: 0 }}>
          {/* Complete toggle button */}
          <button
            onClick={(e) => {
              stop(e);
              onToggleComplete();
            }}
            title={task.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
            style={{
              flexShrink: 0,
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: `2px solid ${task.is_completed ? 'var(--color-success)' : 'var(--color-border)'}`,
              background: task.is_completed ? 'var(--color-success)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'all var(--transition-base)',
            }}
          >
            {task.is_completed && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                textDecoration: task.is_completed ? 'line-through' : 'none',
                color: task.is_completed
                  ? 'var(--color-text-tertiary)'
                  : isOverdue
                    ? 'var(--color-danger)'
                    : 'var(--color-text)',
                fontSize: 'var(--font-size-base)',
                fontWeight: task.is_important ? 'var(--font-weight-medium)' : 'normal',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.title}
              {isOverdue && ' ⚠️'}
            </span>

            {task.description && (
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {truncate(task.description, 45)}
              </span>
            )}
          </div>
        </div>

        <div className="flex" style={{ gap: 'var(--spacing-sm)', alignItems: 'center', flexShrink: 0 }}>
          {task.due_date && (
            <DateBadge color={isOverdue ? 'var(--color-danger)' : undefined}>
              📅 {new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </DateBadge>
          )}

          {!task.is_completed && task.reminder_at && (
            <DateBadge>
              ⏰ {new Date(task.reminder_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              {' , '}
              {new Date(task.reminder_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </DateBadge>
          )}

          {task.is_completed && task.completed_at && (
            <DateBadge color="var(--color-success)">
              ✅ {new Date(task.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </DateBadge>
          )}

          {/* Important toggle button */}
          <button
            onClick={(e) => {
              stop(e);
              onToggleImportant();
            }}
            title={task.is_important ? 'Unmark as important' : 'Mark as important'}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={task.is_important ? 'var(--color-warning)' : 'none'}
              stroke="var(--color-warning)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              stop(e);
              onDelete();
            }}
            title="Delete task"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-danger)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskItem;