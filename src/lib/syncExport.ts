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

export type SyncRequestState =
  | { mode: 'none' }
  | { mode: 'auto'; projectId: string; callbackOrigin: string }
  | { mode: 'pick'; callbackOrigin: string };  // no projectId — show project picker

/**
 * Call this once on app startup.
 * Detects sync-request URL params and returns the sync state.
 * - 'none'  → normal app
 * - 'auto'  → projectId known, auto-export immediately
 * - 'pick'  → opened by a tool but no project ID — show picker
 */
export function detectSyncRequest(): SyncRequestState {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('sync-request');
  const callbackOrigin = params.get('callback');

  if (rawId === null || !callbackOrigin) return { mode: 'none' };

  // Validate callback origin
  const ALLOWED_CALLBACKS = [
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3032',
    'https://brahmastra.vercel.app',
    'https://beyond-finesse-tools.vercel.app',
    'https://beyond-alliance.vercel.app',
  ];

  if (!ALLOWED_CALLBACKS.some((o) => callbackOrigin.startsWith(o))) {
    console.warn('[BOQ Sync] Untrusted callback origin:', callbackOrigin);
    return { mode: 'none' };
  }

  if (!rawId) {
    // No project ID — caller wants user to pick
    return { mode: 'pick', callbackOrigin };
  }

  return { mode: 'auto', projectId: rawId, callbackOrigin };
}

/**
 * Send a project to the opener and close the popup.
 */
export function sendSyncAndClose(projectId: string, callbackOrigin: string): boolean {
  const project = loadProject(projectId);
  if (!project) {
    console.warn('[BOQ Sync] Project not found:', projectId);
    return false;
  }
  if (window.opener) {
    window.opener.postMessage(
      { type: 'boq-sync', boqProject: project, syncedAt: new Date().toISOString() },
      callbackOrigin
    );
  }
  setTimeout(() => window.close(), 1200);
  return true;
}

/** @deprecated use detectSyncRequest + sendSyncAndClose */
export function handleSyncRequestIfPresent(): boolean {
  const state = detectSyncRequest();
  if (state.mode === 'auto') {
    return sendSyncAndClose(state.projectId, state.callbackOrigin);
  }
  return state.mode === 'pick';
}
