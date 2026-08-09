// src/components/AppShell.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useResizable } from '../hooks/useResizable';
import ListSidebar from './ListSidebar';

// Shared app shell: left sidebar (branding, lists, profile/logout) + a right content area.
// Used by both Dashboard and Profile so the sidebar always looks and behaves the same.
function AppShell({ children, selectedListId = null, onSelectList = null }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { width: sidebarWidth, startDragging } = useResizable({
    min: 350,
    max: 450,
    defaultWidth: 350,
    storageKey: 'sidebarWidth',
  });

  function handleSelectList(id) {
    if (onSelectList) {
      // Already on the Dashboard — just switch the selected list in place.
      onSelectList(id);
    } else {
      // Coming from another page (e.g. Profile) — navigate to Dashboard with the chosen list.
      navigate('/dashboard', { state: { listId: id } });
    }
    if (isMobile) setSidebarOpen(false);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg)', position: 'relative' }}>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 'var(--z-fixed)' }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: isMobile ? '280px' : `${sidebarWidth}px`,
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (sidebarOpen ? 0 : '-280px') : 'auto',
          top: 0,
          zIndex: 'var(--z-fixed)',
          transition: isMobile ? 'left var(--transition-base)' : 'none',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>📝 TaskHub</h3>
            <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--font-size-sm)' }}>
              {user.first_name} {user.last_name}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
          <ListSidebar selectedListId={selectedListId} onSelectList={handleSelectList} />
        </div>

        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
          }}
        >
        <Link
          to="/profile"
          className="btn btn-secondary btn-block btn-md"
          style={{ border: "1px solid #5b21b6" }}
        >
          👤 Profile
        </Link>
          <button onClick={logout} className="btn btn-danger btn-block btn-md">
            Logout
          </button>
        </div>

        {!isMobile && (
          <div
            onMouseDown={startDragging}
            style={{
              position: 'absolute',
              right: -3,
              top: 0,
              width: 6,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 'var(--z-sticky)',
            }}
            title="Drag to resize"
          />
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--color-bg)', minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ margin: 'var(--spacing-md)', alignSelf: 'flex-start' }}
          >
            ☰ Lists
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default AppShell;