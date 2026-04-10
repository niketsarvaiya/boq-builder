/**
 * BOQ Builder → Brahmastra sync export handler
 * Detected on app load — if ?sync-request=<id>&callback=<origin> is in the URL,
 * we auto-export the project and postMessage back to the opener.
 */

const STORAGE_KEY = 'boq_projects';

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  projectCode: string;
  createdAt: string;
  updatedAt: string;
  rooms: unknown[];
  lineItems: unknown[];
}

function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const projects = JSON.parse(raw) as Project[];
    return projects.find((p) => p.id === id) ?? null;
  } catch {
    return null;
  }
}

/**
 * Call this once on app startup.
 * If sync-request params are found, post the project to the opener and show a brief UI.
 * Returns true if a sync request was handled (caller can show sync UI).
 */
export function handleSyncRequestIfPresent(): boolean {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('sync-request');
  const callbackOrigin = params.get('callback');

  if (!projectId || !callbackOrigin) return false;

  // Validate callback origin (basic whitelist)
  const ALLOWED_CALLBACKS = [
    'http://localhost:5174',
    'http://localhost:3000',
    'https://brahmastra.vercel.app',
    'https://beyond-finesse-tools.vercel.app',
  ];

  if (!ALLOWED_CALLBACKS.some((o) => callbackOrigin.startsWith(o))) {
    console.warn('[BOQ Sync] Untrusted callback origin:', callbackOrigin);
    return false;
  }

  const project = loadProject(projectId);
  if (!project) {
    console.warn('[BOQ Sync] Project not found:', projectId);
    return false;
  }

  // Send to opener
  if (window.opener) {
    window.opener.postMessage(
      {
        type: 'boq-sync',
        boqProject: project,
        syncedAt: new Date().toISOString(),
      },
      callbackOrigin
    );
  }

  // Auto-close after short delay
  setTimeout(() => window.close(), 1500);
  return true;
}
