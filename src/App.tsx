import { useState } from 'react';
import ProjectsPage from './pages/ProjectsPage';
import BOQPage from './pages/BOQPage';
import SettingsPage from './pages/SettingsPage';
import { detectSyncRequest, sendSyncAndClose } from './lib/syncExport';
import { loadProjects } from './lib/storage';

type View =
  | { page: 'projects' }
  | { page: 'boq'; projectId: string }
  | { page: 'settings' };

export default function App() {
  const [syncState] = useState(() => detectSyncRequest());
  const [view, setView] = useState<View>({ page: 'projects' });
  const [syncSent, setSyncSent] = useState(false);

  // ── Sync mode: auto-export a specific project ─────────────────────────────
  if (syncState.mode === 'auto' && !syncSent) {
    sendSyncAndClose(syncState.projectId, syncState.callbackOrigin);
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>✓ Synced</div>
          <div style={{ fontSize: '13px', color: '#565a72' }}>Sending data to Beyond Brahmastra…</div>
        </div>
      </div>
    );
  }

  // ── Sync mode: pick a project to send ────────────────────────────────────
  if (syncState.mode === 'pick' && !syncSent) {
    const projects = loadProjects();
    const callbackOrigin = syncState.callbackOrigin;
    const callerName = callbackOrigin.includes('3032') || callbackOrigin.includes('beyond-alliance')
      ? 'Beyond Guides'
      : 'Beyond Brahmastra';

    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui', padding: '40px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                📋
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>Beyond BOQ</div>
                <div style={{ fontSize: '11px', color: '#565a72' }}>Sync request</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#8b8fa8', lineHeight: 1.5 }}>
              <strong style={{ color: '#fff' }}>{callerName}</strong> is requesting a BOQ sync.
              Select a project to send:
            </p>
          </div>

          {/* Project list */}
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#565a72', fontSize: '13px' }}>
              No projects found in BOQ Builder.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSyncSent(true);
                    sendSyncAndClose(p.id, callbackOrigin);
                  }}
                  style={{
                    background: '#0f1117',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: '#565a72' }}>
                    {p.client || 'No client'}
                    {p.projectCode ? ` · ${p.projectCode}` : ''}
                    {' · '}{p.rooms?.length ?? 0} rooms
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => window.close()}
            style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#565a72', fontSize: '13px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Show "sent" confirmation ───────────────────────────────────────────────
  if (syncSent) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>✓ Synced</div>
          <div style={{ fontSize: '13px', color: '#565a72' }}>Data sent. Closing…</div>
        </div>
      </div>
    );
  }

  // ── Normal app ─────────────────────────────────────────────────────────────
  if (view.page === 'boq') {
    return (
      <BOQPage
        projectId={view.projectId}
        onBack={() => setView({ page: 'projects' })}
      />
    );
  }

  if (view.page === 'settings') {
    return (
      <SettingsPage
        onBack={() => setView({ page: 'projects' })}
      />
    );
  }

  return (
    <ProjectsPage
      onOpenProject={(id) => setView({ page: 'boq', projectId: id })}
      onOpenSettings={() => setView({ page: 'settings' })}
    />
  );
}
