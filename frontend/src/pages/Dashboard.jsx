// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import TaskPanel from '../components/TaskPanel';

function Dashboard() {
  const [selectedListId, setSelectedListId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // If we arrived here from another page (e.g. clicked a list while on Profile),
    // use the list passed via navigation state instead of re-fetching the default.
    if (location.state?.listId) {
      setSelectedListId(location.state.listId);
      return;
    }

    async function fetchDefaultList() {
      try {
        const data = await api.get('/todos/lists/');
        if (data.results && data.results.length > 0) {
          const defaultList = data.results.find((l) => l.is_default) || data.results[0];
          setSelectedListId(defaultList.id);
        }
      } catch (err) {
        console.error('Failed to fetch default list:', err);
      }
    }
    fetchDefaultList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell selectedListId={selectedListId} onSelectList={setSelectedListId}>
      {selectedListId ? (
        <TaskPanel listId={selectedListId} />
      ) : (
        <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>📋</div>
          <h2 style={{ margin: 0 }}>No list selected</h2>
          <p className="text-muted" style={{ margin: 0 }}>
            Select a list from the sidebar to view and manage its tasks
          </p>
        </div>
      )}
    </AppShell>
  );
}

export default Dashboard;