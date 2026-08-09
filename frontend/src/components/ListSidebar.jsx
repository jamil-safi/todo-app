// src/components/ListSidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { AlertDialog, useAlertDialog } from './AlertDialog';
import { ListForm } from './ListForm';

function ListSidebar({ selectedListId, onSelectList }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('default'); // default | alphabetical | count
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { dialog, showAlert, closeAlert, handleConfirm } = useAlertDialog();
  const menuRef = useRef(null);

  useEffect(() => {
    fetchLists();
  }, [sortBy]);

  useEffect(() => {
    function handleClickOutside() {
      setSortMenuOpen(false);
    }
    if (sortMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sortMenuOpen]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  async function fetchLists() {
    setLoading(true);
    const data = await api.get('/todos/lists/');
    let sortedLists = [...data.results];

    if (sortBy === 'alphabetical') {
      sortedLists.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'count') {
      sortedLists.sort((a, b) => b.task_count - a.task_count);
    } else if (sortBy === 'created_at') {
      sortedLists.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setLists(sortedLists);
    setLoading(false);
  }

  async function handleCreateList(title) {
    setIsSubmitting(true);
    try {
      await api.post('/todos/lists/', { title, display_order: lists.length });
      setShowListForm(false);
      await fetchLists();
    } catch (err) {
      alert(err.data?.title?.[0] || 'Could not create list.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRenameList(title) {
    if (!editingList || title === editingList.title) {
      setEditingList(null);
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/todos/lists/${editingList.id}/`, { title });
      setEditingList(null);
      await fetchLists();
    } catch (err) {
      alert(err.data?.title?.[0] || 'Could not rename list.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteList(list) {
    showAlert({
      title: 'Delete List?',
      message: `Are you sure you want to delete "${list.title}"? This will delete all its tasks too.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await api.delete(`/todos/lists/${list.id}/`);
          if (selectedListId === list.id) onSelectList(null);
          await fetchLists();
        } catch (err) {
          alert(err.data?.detail || 'Could not delete this list.');
        }
      },
    });
    setOpenMenuId(null);
  }

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'alphabetical', label: 'A–Z' },
    { value: 'count', label: 'Most Tasks' },
  ];
  
  if (loading)
    return (
      <div className="flex-center flex-col gap-md">
        <div className="spinner"></div>
        <p className="text-muted">Loading lists...</p>
      </div>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Fixed Top Controls */}
      <div
        style={{
          padding: 'var(--spacing-md) 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-lg)' }}>
          My Lists
        </h4>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', position: 'relative' }}>
          <button
            onClick={() => setShowListForm(true)}
            className="btn btn-secondary btn-block btn-md"
            style={{ flex: 1 , border: "1px solid #7c3aed"}}
            title="Create new list" 
          >
            ➕ New List
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSortMenuOpen(!sortMenuOpen);
            }}
            className="btn btn-secondary btn-sm"
            style={{
              flexShrink: 0,
              width: '2.25rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Sort lists"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5v14M11 19l-4-4M11 19l4-4" />
              <line x1="15" y1="6" x2="21" y2="6" />
              <line x1="15" y1="10" x2="19" y2="10" />
              <line x1="15" y1="14" x2="17" y2="14" />
            </svg>
          </button>

          {sortMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 'var(--spacing-sm)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 'var(--z-dropdown)',
                minWidth: '160px',
                overflow: 'hidden',
              }}
            >
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setSortMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: sortBy === option.value ? 'var(--color-surface-hover)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    fontWeight: sortBy === option.value ? 'var(--font-weight-medium)' : 'normal',
                  }}
                  onMouseEnter={(e) => {
                    if (sortBy !== option.value) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (sortBy !== option.value) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable List */}
      <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          paddingRight: '8px',
        }}>
         
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {lists.map((list) => (
            <li
              key={list.id}
              onClick={() => onSelectList(list.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-sm)',
                cursor: 'pointer',
                backgroundColor:
                  list.id === selectedListId ? 'var(--color-primary)' : 'transparent',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-base)',
                border: `1px solid ${
                  list.id === selectedListId ? 'var(--color-border-light)' : 'transparent'
                }`,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (list.id !== selectedListId) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
              onMouseLeave={(e) => {
                if (list.id !== selectedListId) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  
                }}
              >
                {list.title}{' '}
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    opacity: 0.7,
                  }}
                >
                  ({list.task_count})
                </span>
                {list.is_default}
              </span>

              {!list.is_default && (
                    <div
                      ref={openMenuId === list.id ? menuRef : null}
                      style={{ position: 'relative' }}
                    >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === list.id ? null : list.id);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.5rem' }}
                    title="List options"
                  >
                    ⋮
                  </button>

                  {openMenuId === list.id && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: 'var(--spacing-sm)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 10,
                        minWidth: '150px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingList(list);
                          setOpenMenuId(null);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: 'var(--spacing-md)',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text)',
                          transition: 'background-color var(--transition-base)',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--color-surface-hover)')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: 'var(--spacing-md)',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-danger)',
                          transition: 'background-color var(--transition-base)',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--color-surface-hover)')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showListForm && (
        <ListForm
          onSubmit={handleCreateList}
          onCancel={() => setShowListForm(false)}
          isLoading={isSubmitting}
        />
      )}

      {editingList && (
        <ListForm
          initialTitle={editingList.title}
          onSubmit={handleRenameList}
          onCancel={() => setEditingList(null)}
          isLoading={isSubmitting}
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
    </div>
  );
}

export default ListSidebar;