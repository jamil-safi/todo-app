// src/components/TaskPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import TaskItem from './TaskItem';
import { TaskForm } from './TaskForm';
import { AlertDialog, useAlertDialog } from './AlertDialog';

function TaskPanel({ listId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listTitle, setListTitle] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | completed | important
  const [ordering, setOrdering] = useState('display_order');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = creating, object = editing
  const [isSaving, setIsSaving] = useState(false);

  const { dialog, showAlert, closeAlert, handleConfirm } = useAlertDialog();

  useEffect(() => {
    if (listId) {
      fetchTasks();
      fetchListDetails();
    }
  }, [listId, search, statusFilter, ordering]);

async function fetchListDetails() {
  try {
    const data = await api.get(`/todos/lists/${listId}/`);
    setListTitle(data.title);
  } catch (err) {
    setListTitle('');
  }
}

  async function fetchTasks() {
    setLoading(true);
    const params = new URLSearchParams({ list: listId });
    if (search) params.set('search', search);
    if (statusFilter === 'active') params.set('is_completed', 'false');
    if (statusFilter === 'completed') params.set('is_completed', 'true');
    if (statusFilter === 'important') params.set('is_important', 'true');
    if (ordering) params.set('ordering', ordering);

    const data = await api.get(`/todos/tasks/?${params.toString()}`);
    setTasks(data.results);
    setLoading(false);
  }

  function openCreateForm() {
    setEditingTask(null);
    setShowTaskForm(true);
  }

  function openEditForm(task) {
    setEditingTask(task);
    setShowTaskForm(true);
  }

  function closeForm() {
    setShowTaskForm(false);
    setEditingTask(null);
  }

  async function handleFormSubmit(payload) {
    setIsSaving(true);
    try {
      if (editingTask) {
        await api.patch(`/todos/tasks/${editingTask.id}/`, payload);
      } else {
        await api.post('/todos/tasks/', { list: listId, ...payload });
      }
      closeForm();
      await fetchTasks();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleComplete(task) {
    await api.patch(`/todos/tasks/${task.id}/`, { is_completed: !task.is_completed });
    fetchTasks();
  }

  async function handleToggleImportant(task) {
    await api.patch(`/todos/tasks/${task.id}/`, { is_important: !task.is_important });
    fetchTasks();
  }

  function handleDelete(taskId, taskTitle) {
    showAlert({
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${taskTitle}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        await api.delete(`/todos/tasks/${taskId}/`);
        await fetchTasks();
      },
    });
  }

  return (
    <>
      <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-md) 0' }}>
          {listTitle ? `${listTitle} - Tasks` : 'Tasks'}
        </h2>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <button onClick={openCreateForm} className="btn btn-secondary btn-block btn-md" style={{ border: "1px solid #7c3aed"}}>
              ➕ Add Task
            </button>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ fontSize: 'var(--font-size-sm)' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="all">All Tasks</option>
                <option value="active">Active Only</option>
                <option value="completed">Completed Only</option>
                <option value="important">Important Only</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="form-control"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="display_order">Sort: Default</option>
                <option value="due_date">Sort: Due Date (Early)</option>
                <option value="-due_date">Sort: Due Date (Late)</option>
                <option value="-created_at">Sort: Newest</option>
                <option value="created_at">Sort: Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div className="flex-center flex-col gap-md" style={{ padding: 'var(--spacing-xl)' }}>
              <div className="spinner"></div>
              <p className="text-muted">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex-center flex-col gap-md" style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: '2.5rem' }}>📭</div>
              <p style={{ margin: 0 }}>No tasks match your filters</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={() => handleToggleComplete(task)}
                  onToggleImportant={() => handleToggleImportant(task)}
                  onDelete={() => handleDelete(task.id, task.title)}
                  onEdit={openEditForm}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          initialTask={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isLoading={isSaving}
        />
      )}

      <AlertDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        isDangerous={dialog.isDangerous}
        onConfirm={handleConfirm}
        onCancel={closeAlert}
      />
    </>
  );
}

export default TaskPanel;