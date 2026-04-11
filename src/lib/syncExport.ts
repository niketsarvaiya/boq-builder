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

function loadAllProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Project[];
  } catch {
    return [];
  }
}

function loadProject(id: string): Project | null {
  return loadAllProjects().find((p) => p.id === id) ?? null;
}

export type SyncRequestState =
  | { mode: 'none' }
  | { mode: 'all';  callbackOrigin: string }           // send ALL projects and close
  | { mode: 'auto'; projectId: string; callbackOrigin: string }
  | { mode: 'pick'; callbackOrigin: string };

const ALLOWED_CALLBACKS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3032',
  'https://brahmastra.vercel.app',
  'https://beyond-finesse-tools.vercel.app',
  'https://beyond-alliance.vercel.app',
];

export function detectSyncRequest(): SyncRequestState {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('sync-request');
  const callbackOrigin = params.get('callback');

  if (rawId === null || !callbackOrigin) return { mode: 'none' };

  if (!ALLOWED_CALLBACKS.some((o) => callbackOrigin.startsWith(o))) {
    console.warn('[BOQ Sync] Untrusted callback origin:', callbackOrigin);
    return { mode: 'none' };
  }

  // sync-request=all → send every project and close immediately
  if (rawId === 'all') return { mode: 'all', callbackOrigin };

  // sync-request=  (empty) → show project picker
  if (!rawId) return { mode: 'pick', callbackOrigin };

  return { mode: 'auto', projectId: rawId, callbackOrigin };
}

/** Send ALL projects to the opener then close the popup. */
export function sendAllAndClose(callbackOrigin: string): void {
  const projects = loadAllProjects();
  if (window.opener) {
    window.opener.postMessage(
      { type: 'boq-sync-all', projects, syncedAt: new Date().toISOString() },
      callbackOrigin
    );
  }
  setTimeout(() => window.close(), 800);
}

/** Send a single project to the opener then close the popup. */
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
  setTimeout(() => window.close(), 800);
  return true;
}
