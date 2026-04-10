import { useState } from 'react';
import ProjectsPage from './pages/ProjectsPage';
import BOQPage from './pages/BOQPage';
import SettingsPage from './pages/SettingsPage';
import { handleSyncRequestIfPresent } from './lib/syncExport';

type View =
  | { page: 'projects' }
  | { page: 'boq'; projectId: string }
  | { page: 'settings' };

export default function App() {
  // Handle Brahmastra sync request if opened via popup
  const [isSyncMode] = useState(() => handleSyncRequestIfPresent());
  const [view, setView] = useState<View>({ page: 'projects' });

  if (isSyncMode) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>✓ BOQ Synced</div>
          <div style={{ fontSize: '13px', color: '#565a72' }}>Sending data to Brahmastra…</div>
        </div>
      </div>
    );
  }

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
