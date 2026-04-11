import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Trash2, MapPin, User, Clock, Layers, Settings } from 'lucide-react';
import type { Project } from '../types/index';
import { loadProjects, saveProject, deleteProject } from '../lib/storage';
import { createDefaultLineItems } from '../lib/defaultProducts';
import { generateId } from '../lib/boqUtils';
import Modal from '../components/ui/Modal';

interface ProjectsPageProps {
  onOpenProject: (id: string) => void;
  onOpenSettings: () => void;
}

interface NewProjectForm {
  name: string;
  client: string;
  location: string;
  projectCode: string;
}

const EMPTY_FORM: NewProjectForm = { name: '', client: '', location: '', projectCode: '' };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectsPage({ onOpenProject, onOpenSettings }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  function handleCreate() {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId(),
      name: form.name.trim(),
      client: form.client.trim(),
      location: form.location.trim(),
      projectCode: form.projectCode.trim(),
      createdAt: now,
      updatedAt: now,
      rooms: [],
      lineItems: createDefaultLineItems(),
    };
    saveProject(project);
    setProjects((prev) => [...prev, project]);
    setShowNew(false);
    setForm(EMPTY_FORM);
    onOpenProject(project.id);
  }

  function handleDelete(id: string) {
    deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  }

  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Header */}
      <header
        style={{
          background: 'var(--color-bg-sidebar)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-lg tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Beyond BOQ
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: 'var(--color-accent)',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  v1.0
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                by Beyond Alliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              title="Settings"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.color = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              <Settings size={16} />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {sortedProjects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Layers size={36} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No projects yet
            </h2>
            <p
              className="text-sm mb-8 max-w-md"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Create your first BOQ to start defining scopes, room allocations, brands, and quantities
              for your smart home or AV integration project.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
            >
              <Plus size={16} />
              Create First Project
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Projects
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {sortedProjects.map((project) => {
                const activeItems = project.lineItems.filter((i) => i.included).length;
                const totalItems = project.lineItems.length;

                return (
                  <div
                    key={project.id}
                    className="relative rounded-xl p-5 cursor-pointer transition-all fade-in"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                    }}
                    onClick={() => onOpenProject(project.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                      e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-bg-card)';
                    }}
                  >
                    {/* Delete button */}
                    <button
                      className="absolute top-3 right-3 p-1.5 rounded-md transition-colors z-10"
                      style={{ color: 'var(--color-text-muted)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(project.id);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Project name */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(99,102,241,0.12)' }}
                      >
                        <FolderOpen size={18} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <div className="min-w-0 pr-6">
                        <h3
                          className="font-semibold text-sm truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {project.name}
                        </h3>
                        {project.projectCode && (
                          <span
                            className="text-xs font-mono"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {project.projectCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col gap-1.5 mb-4">
                      {project.client && (
                        <div className="flex items-center gap-2">
                          <User size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                            {project.client}
                          </span>
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                            {project.location}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Updated {timeAgo(project.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div
                      className="flex gap-4 pt-4"
                      style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                      <div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          {activeItems}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Active / {totalItems} items
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {project.rooms.length}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Rooms
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* New Project Modal */}
      {showNew && (
        <Modal title="New Project" onClose={() => { setShowNew(false); setForm(EMPTY_FORM); }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
            className="flex flex-col gap-4"
          >
            {[
              { key: 'name', label: 'Project Name', placeholder: 'e.g. Villa Arjun — Smart Home', required: true },
              { key: 'client', label: 'Client Name', placeholder: 'e.g. Mr. Arjun Sharma', required: false },
              { key: 'location', label: 'Location', placeholder: 'e.g. Juhu, Mumbai', required: false },
              { key: 'projectCode', label: 'Project Code', placeholder: 'e.g. BA-2025-042', required: false },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={form[key as keyof NewProjectForm]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={required}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
              </div>
            ))}

            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              The project will be pre-loaded with all standard products (inactive). Toggle items on as you define scope.
            </p>

            <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => { setShowNew(false); setForm(EMPTY_FORM); }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-bg-input)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.name.trim()}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: form.name.trim() ? 'var(--color-accent)' : 'var(--color-bg-input)',
                  color: form.name.trim() ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <Modal
          title="Delete Project"
          onClose={() => setDeleteConfirm(null)}
          width="380px"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {projects.find((p) => p.id === deleteConfirm)?.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-bg-input)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-5 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--color-danger)', color: '#fff' }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
