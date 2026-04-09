import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Copy, Check, Settings } from 'lucide-react';
import type { Project, LineItem } from '../types/index';
import { loadProjects, saveProject } from '../lib/storage';
import { ALL_CANONICAL_KEYS } from '../lib/defaultProducts';

interface SettingsPageProps {
  onBack: () => void;
}

type Tab = 'aliases' | 'about';

interface UnmappedItem {
  project: Project;
  item: LineItem;
}

const SNIPPET = `// Copy boqIntegration.ts into your tool's src/lib/ directory
import { loadBOQProject, getBOQContextString } from './lib/boqIntegration';

// Same-origin (e.g. both on localhost or same deployed domain)
const project = loadBOQProject(projectId);
if (project) {
  const context = getBOQContextString(project);
  // Inject \`context\` into your AI system prompt or display it
}`;

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [tab, setTab] = useState<Tab>('aliases');
  const [projects, setProjects] = useState<Project[]>([]);
  const [copied, setCopied] = useState(false);
  // Track assigned keys per item: itemId → canonicalKey
  const [assignedKeys, setAssignedKeys] = useState<Record<string, string>>({});
  // Track custom key input per item
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  // Track whether we're showing custom input for an item
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});
  // Track search filter per item dropdown
  const [searchFilter, setSearchFilter] = useState<Record<string, string>>({});
  // Track confirmed (saved) items
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const unmappedItems: UnmappedItem[] = [];
  for (const project of projects) {
    for (const item of project.lineItems) {
      if (item.isCustom && !item.canonicalKey) {
        unmappedItems.push({ project, item });
      }
    }
  }

  const uniqueProjectCount = new Set(unmappedItems.map((u) => u.project.id)).size;

  function handleAssignKey(projectId: string, itemId: string, key: string) {
    if (!key) return;

    // Update in memory
    setAssignedKeys((prev) => ({ ...prev, [itemId]: key }));

    // Persist to localStorage
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedProject: Project = {
      ...project,
      lineItems: project.lineItems.map((li) =>
        li.id === itemId ? { ...li, canonicalKey: key } : li
      ),
    };
    saveProject(updatedProject);
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));
    setConfirmed((prev) => ({ ...prev, [itemId]: true }));
  }

  function handleCopySnippet() {
    navigator.clipboard.writeText(SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <ArrowLeft size={16} />
              Projects
            </button>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <div className="flex items-center gap-2">
              <Settings size={16} style={{ color: 'var(--color-accent)' }} />
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Settings
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div
        style={{
          background: 'var(--color-bg-sidebar)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 py-3">
            {(['aliases', 'about'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={
                  tab === t
                    ? {
                        background: 'var(--color-accent)',
                        color: '#fff',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }
                }
                onMouseEnter={(e) => {
                  if (tab !== t) e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (tab !== t) e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                {t === 'aliases' ? 'Product Aliases' : 'About / Integration'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {tab === 'aliases' && (
          <div>
            <div className="mb-6">
              <h1
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Product Aliases
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Map custom product names to canonical keys so all Beyond Alliance tools can recognise them correctly.
              </p>
            </div>

            {unmappedItems.length === 0 ? (
              /* All mapped success state */
              <div
                className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                <CheckCircle2 size={40} style={{ color: '#10b981' }} className="mb-4" />
                <h2
                  className="text-base font-semibold mb-1"
                  style={{ color: '#10b981' }}
                >
                  All products mapped
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Every custom item has a canonical key assigned.
                </p>
              </div>
            ) : (
              <div>
                {/* Warning banner */}
                <div
                  className="flex items-start gap-3 p-4 rounded-xl mb-6"
                  style={{
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.25)',
                  }}
                >
                  <AlertTriangle
                    size={18}
                    className="shrink-0 mt-0.5"
                    style={{ color: '#fbbf24' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                      {unmappedItems.length} custom item{unmappedItems.length !== 1 ? 's' : ''}{' '}
                      across {uniqueProjectCount} project{uniqueProjectCount !== 1 ? 's' : ''}
                    </span>{' '}
                    have no canonical key. Other tools may not recognise them.
                  </p>
                </div>

                {/* Table */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  {/* Table header */}
                  <div
                    className="grid text-xs font-semibold px-4 py-3"
                    style={{
                      background: 'var(--color-bg-sidebar)',
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                      gridTemplateColumns: '1fr 1fr 140px 280px 40px',
                    }}
                  >
                    <div>Project</div>
                    <div>Product Name</div>
                    <div>Scope</div>
                    <div>Assign Canonical Key</div>
                    <div></div>
                  </div>

                  {/* Table rows */}
                  {unmappedItems.map(({ project, item }) => {
                    const currentKey = assignedKeys[item.id] ?? item.canonicalKey ?? '';
                    const isConfirmed = confirmed[item.id] || !!item.canonicalKey;
                    const isShowingCustom = showCustomInput[item.id];
                    const filter = (searchFilter[item.id] ?? '').toLowerCase();

                    const filteredKeys = filter
                      ? ALL_CANONICAL_KEYS.filter((k) => k.includes(filter))
                      : ALL_CANONICAL_KEYS;

                    // Rebuild groups from filteredKeys
                    const filteredGroups: Record<string, string[]> = {};
                    for (const key of filteredKeys) {
                      const prefix = key.split('.')[0];
                      if (!filteredGroups[prefix]) filteredGroups[prefix] = [];
                      filteredGroups[prefix].push(key);
                    }

                    return (
                      <div
                        key={`${project.id}-${item.id}`}
                        className="grid items-center px-4 py-3 gap-x-4"
                        style={{
                          background: 'var(--color-bg-card)',
                          borderBottom: '1px solid var(--color-border)',
                          gridTemplateColumns: '1fr 1fr 140px 280px 40px',
                        }}
                      >
                        {/* Project */}
                        <div
                          className="text-sm truncate"
                          style={{ color: 'var(--color-text-secondary)' }}
                          title={project.name}
                        >
                          {project.name}
                        </div>

                        {/* Product */}
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                          title={item.product}
                        >
                          {item.product || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unnamed</span>}
                        </div>

                        {/* Scope */}
                        <div
                          className="text-xs truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {item.scope}
                        </div>

                        {/* Assign canonical key */}
                        <div>
                          {isShowingCustom ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customInputs[item.id] ?? ''}
                                onChange={(e) =>
                                  setCustomInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                placeholder="e.g. custom.my-device"
                                className="flex-1 rounded-md px-2 py-1.5 text-xs"
                                style={{
                                  background: 'var(--color-bg-input)',
                                  border: '1px solid var(--color-accent)',
                                  color: 'var(--color-text-primary)',
                                  outline: 'none',
                                }}
                              />
                              <button
                                onClick={() => {
                                  const v = customInputs[item.id]?.trim();
                                  if (v) handleAssignKey(project.id, item.id, v);
                                  setShowCustomInput((prev) => ({ ...prev, [item.id]: false }));
                                }}
                                className="px-2.5 py-1.5 rounded-md text-xs font-semibold"
                                style={{ background: 'var(--color-accent)', color: '#fff' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() =>
                                  setShowCustomInput((prev) => ({ ...prev, [item.id]: false }))
                                }
                                className="px-2.5 py-1.5 rounded-md text-xs"
                                style={{
                                  background: 'var(--color-bg-input)',
                                  color: 'var(--color-text-muted)',
                                  border: '1px solid var(--color-border)',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {/* Search box */}
                              <input
                                type="text"
                                value={searchFilter[item.id] ?? ''}
                                onChange={(e) =>
                                  setSearchFilter((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                placeholder="Search keys…"
                                className="rounded-md px-2 py-1 text-xs"
                                style={{
                                  background: 'var(--color-bg-input)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-primary)',
                                  outline: 'none',
                                }}
                              />
                              <select
                                value={currentKey}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === '__custom__') {
                                    setShowCustomInput((prev) => ({ ...prev, [item.id]: true }));
                                  } else {
                                    handleAssignKey(project.id, item.id, v);
                                  }
                                }}
                                className="rounded-md px-2 py-1.5 text-xs"
                                style={{
                                  background: 'var(--color-bg-input)',
                                  border: '1px solid var(--color-border)',
                                  color: currentKey ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                  outline: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <option value="">— Select a canonical key —</option>
                                {Object.entries(filteredGroups).map(([prefix, keys]) => (
                                  <optgroup key={prefix} label={prefix.toUpperCase()}>
                                    {keys.map((k) => (
                                      <option key={k} value={k}>
                                        {k}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                                <option value="__custom__">+ Create new key…</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Checkmark */}
                        <div className="flex items-center justify-center">
                          {isConfirmed ? (
                            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'about' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                About / Integration
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                How BOQ Builder connects to the Beyond Alliance tool ecosystem.
              </p>
            </div>

            {/* Architecture overview */}
            <div
              className="rounded-xl p-5 mb-5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <h2
                className="font-semibold text-sm mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Overview
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                BOQ Builder is the data foundation for the Beyond Alliance tool ecosystem. It stores
                structured project data in the browser's localStorage, which all other tools on the
                same origin can read without any API.
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { label: 'localStorage key', value: 'boq_projects' },
                  { label: 'Integration module', value: 'boqIntegration.ts' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs w-36 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      {label}
                    </span>
                    <code
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        color: 'var(--color-accent)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {value}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrated tools */}
            <div
              className="rounded-xl p-5 mb-5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <h2
                className="font-semibold text-sm mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Tools that integrate with BOQ Builder
              </h2>
              <ul className="flex flex-col gap-2.5">
                {[
                  { name: 'Brahmastra', desc: 'Engineering calibration — network audit, speaker calibration, room analysis' },
                  { name: 'Beyond Tech Expert', desc: 'Project-aware AI technical support, uses getBOQContextString() for context injection' },
                  { name: 'Beyond User Manual', desc: 'Room-by-room device documentation generator using getActiveDeviceList()' },
                ].map(({ name, desc }) => (
                  <li key={name} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: 'var(--color-accent)' }}
                    />
                    <div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                        — {desc}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Integration snippet */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: 'var(--color-bg-sidebar)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Integration snippet — getBOQContextString(project)
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={
                    copied
                      ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                      : {
                          background: 'var(--color-bg-input)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }
                  }
                >
                  {copied ? (
                    <>
                      <Check size={12} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy snippet
                    </>
                  )}
                </button>
              </div>
              <pre
                className="p-4 text-xs overflow-x-auto"
                style={{
                  background: 'var(--color-bg-base)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {SNIPPET}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
