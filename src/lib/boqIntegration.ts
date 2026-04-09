/**
 * BOQ Integration Layer — v1.0
 * ─────────────────────────────────────────────────────────────────
 * This module is the canonical shared interface between BOQ Builder
 * and all downstream Beyond Alliance tools:
 *
 *   • Brahmastra (beyond-finesse-tools) — engineering calibration
 *   • Beyond Tech Expert (beyond-tech-genius) — technical support AI
 *   • Beyond User Manual — user guide generator
 *   • Any future tools
 *
 * HOW IT WORKS
 * ─────────────
 * 1. BOQ Builder stores project data in localStorage under key:
 *    `boq_projects`  (array of Project objects)
 *
 * 2. Other tools running on the same origin (localhost or deployed
 *    domain) can call `loadBOQProjects()` or `loadBOQProject(id)`
 *    to read live project data with no API required.
 *
 * 3. For cross-origin / deployed tool contexts, use the JSON export
 *    from BOQ Builder and call `parseBOQExport(json)` to load it.
 *
 * 4. Helper views are provided for common use cases in each tool.
 *
 * INTEGRATION GUIDE FOR OTHER TOOLS
 * ──────────────────────────────────
 * Copy this file into the consuming tool's `src/lib/` directory.
 * No extra dependencies needed — pure TypeScript.
 *
 * Usage in Brahmastra (network audit, speaker calibration, etc.):
 *   const project = loadBOQProject(selectedProjectId);
 *   const networking = getBOQScope(project, 'Networking');
 *   const apCount = getProductTotal(project, 'Access Point');
 *   const roomAPs = getRoomBreakdown(project, 'Access Point');
 *
 * Usage in Beyond Tech Expert:
 *   const project = loadBOQProject(id);
 *   const summary = getBOQSummary(project);
 *   // → feed summary into AI context for project-aware responses
 *
 * Usage in Beyond User Manual:
 *   const project = loadBOQProject(id);
 *   const devices = getActiveDeviceList(project);
 *   // → generate room-by-room device documentation
 */

// ─── Types (mirrored from BOQ Builder — keep in sync) ───────────

export interface Room {
  id: string;
  name: string;
  order: number;
}

export interface RoomAllocation {
  roomId: string;
  qty: number;
}

export interface LineItem {
  id: string;
  scope: string;
  product: string;
  brand: string;
  modelNumber: string;
  specs: string;
  notes: string;
  roomAllocations: RoomAllocation[];
  included: boolean;
  isCustom?: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  projectCode: string;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  lineItems: LineItem[];
}

export interface BOQExportFile {
  boqVersion: string;
  exportedAt: string;
  id: string;
  name: string;
  client: string;
  location: string;
  projectCode: string;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  lineItems: LineItem[];
}

// ─── localStorage Keys (must match BOQ Builder) ──────────────────

const STORAGE_KEY = 'boq_projects';

// ─── Core loaders ────────────────────────────────────────────────

/**
 * Load all projects from localStorage (same-origin only).
 * Returns empty array if no data or not on same origin.
 */
export function loadBOQProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

/**
 * Load a single project by ID from localStorage.
 */
export function loadBOQProject(id: string): Project | null {
  const projects = loadBOQProjects();
  return projects.find((p) => p.id === id) ?? null;
}

/**
 * Parse a BOQ JSON export file (from the Export JSON button).
 * Use this when tools are on different origins / deployed separately.
 */
export function parseBOQExport(json: string): Project | null {
  try {
    const data = JSON.parse(json) as BOQExportFile;
    if (!data.boqVersion || !data.lineItems || !data.rooms) return null;
    const { boqVersion: _v, exportedAt: _e, ...project } = data;
    return project as Project;
  } catch {
    return null;
  }
}

// ─── Scope & Product Helpers ─────────────────────────────────────

/**
 * Get all active (included) line items for a specific scope.
 * e.g. getBOQScope(project, 'Networking')
 */
export function getBOQScope(project: Project, scope: string): LineItem[] {
  return project.lineItems.filter(
    (item) => item.included && item.scope === scope
  );
}

/**
 * Get total quantity of a specific product across all rooms.
 * e.g. getProductTotal(project, 'Access Point') → 6
 */
export function getProductTotal(project: Project, product: string): number {
  const item = project.lineItems.find(
    (i) => i.included && i.product.toLowerCase() === product.toLowerCase()
  );
  if (!item) return 0;
  return item.roomAllocations.reduce((sum, ra) => sum + (ra.qty || 0), 0);
}

/**
 * Get per-room breakdown for a product.
 * e.g. getRoomBreakdown(project, 'Access Point')
 * → [{ room: 'Living Room', qty: 2 }, { room: 'Master Bedroom', qty: 1 }, ...]
 */
export function getRoomBreakdown(
  project: Project,
  product: string
): Array<{ roomId: string; roomName: string; qty: number }> {
  const item = project.lineItems.find(
    (i) => i.included && i.product.toLowerCase() === product.toLowerCase()
  );
  if (!item) return [];

  return item.roomAllocations
    .filter((ra) => ra.qty > 0)
    .map((ra) => {
      const room = project.rooms.find((r) => r.id === ra.roomId);
      return {
        roomId: ra.roomId,
        roomName: room?.name ?? 'Unknown Room',
        qty: ra.qty,
      };
    });
}

/**
 * Get all active devices per room.
 * Returns a map of roomName → list of { product, brand, model, qty }
 * Useful for User Manual room-by-room device documentation.
 */
export function getDevicesByRoom(project: Project): Map<
  string,
  Array<{ product: string; brand: string; model: string; qty: number; scope: string }>
> {
  const map = new Map<
    string,
    Array<{ product: string; brand: string; model: string; qty: number; scope: string }>
  >();

  // Init map with all rooms
  project.rooms.forEach((room) => {
    map.set(room.name, []);
  });

  // Fill allocations
  project.lineItems
    .filter((item) => item.included)
    .forEach((item) => {
      item.roomAllocations
        .filter((ra) => ra.qty > 0)
        .forEach((ra) => {
          const room = project.rooms.find((r) => r.id === ra.roomId);
          if (!room) return;
          const list = map.get(room.name) ?? [];
          list.push({
            product: item.product,
            brand: item.brand,
            model: item.modelNumber,
            qty: ra.qty,
            scope: item.scope,
          });
          map.set(room.name, list);
        });
    });

  return map;
}

/**
 * Get a flat list of all active devices (for AI context, manuals, etc.)
 * Sorted by scope → product.
 */
export function getActiveDeviceList(project: Project): Array<{
  scope: string;
  product: string;
  brand: string;
  model: string;
  specs: string;
  totalQty: number;
  rooms: Array<{ name: string; qty: number }>;
}> {
  return project.lineItems
    .filter((item) => item.included)
    .map((item) => {
      const totalQty = item.roomAllocations.reduce(
        (sum, ra) => sum + (ra.qty || 0),
        0
      );
      const rooms = item.roomAllocations
        .filter((ra) => ra.qty > 0)
        .map((ra) => {
          const room = project.rooms.find((r) => r.id === ra.roomId);
          return { name: room?.name ?? 'Unknown', qty: ra.qty };
        });
      return {
        scope: item.scope,
        product: item.product,
        brand: item.brand,
        model: item.modelNumber,
        specs: item.specs,
        totalQty,
        rooms,
      };
    })
    .sort((a, b) =>
      a.scope !== b.scope
        ? a.scope.localeCompare(b.scope)
        : a.product.localeCompare(b.product)
    );
}

// ─── Summary Views ────────────────────────────────────────────────

/**
 * High-level project summary. Good for AI context injection or
 * dashboards in other tools.
 */
export function getBOQSummary(project: Project): {
  projectName: string;
  client: string;
  location: string;
  projectCode: string;
  totalRooms: number;
  activeScopes: string[];
  totalActiveItems: number;
  totalUnits: number;
  scopeBreakdown: Array<{ scope: string; itemCount: number; unitCount: number }>;
} {
  const activeItems = project.lineItems.filter((i) => i.included);
  const totalUnits = activeItems.reduce(
    (sum, item) =>
      sum + item.roomAllocations.reduce((s, ra) => s + (ra.qty || 0), 0),
    0
  );

  // Group by scope
  const scopeMap = new Map<string, { items: number; units: number }>();
  activeItems.forEach((item) => {
    const entry = scopeMap.get(item.scope) ?? { items: 0, units: 0 };
    entry.items += 1;
    entry.units += item.roomAllocations.reduce(
      (s, ra) => s + (ra.qty || 0),
      0
    );
    scopeMap.set(item.scope, entry);
  });

  return {
    projectName: project.name,
    client: project.client,
    location: project.location,
    projectCode: project.projectCode,
    totalRooms: project.rooms.length,
    activeScopes: Array.from(scopeMap.keys()),
    totalActiveItems: activeItems.length,
    totalUnits,
    scopeBreakdown: Array.from(scopeMap.entries()).map(
      ([scope, { items, units }]) => ({
        scope,
        itemCount: items,
        unitCount: units,
      })
    ),
  };
}

/**
 * Format BOQ summary as a plain-text string for AI context injection.
 * Use this in Beyond Tech Expert's system prompt or context window.
 */
export function getBOQContextString(project: Project): string {
  const summary = getBOQSummary(project);
  const devices = getActiveDeviceList(project);

  const lines: string[] = [
    `PROJECT: ${summary.projectName}`,
    `CLIENT: ${summary.client || 'N/A'}`,
    `LOCATION: ${summary.location || 'N/A'}`,
    `PROJECT CODE: ${summary.projectCode || 'N/A'}`,
    `ROOMS (${summary.totalRooms}): ${project.rooms
      .sort((a, b) => a.order - b.order)
      .map((r) => r.name)
      .join(', ')}`,
    '',
    `ACTIVE SCOPE (${summary.activeScopes.length} categories, ${summary.totalActiveItems} product types, ${summary.totalUnits} total units):`,
    '',
  ];

  let currentScope = '';
  devices.forEach((d) => {
    if (d.scope !== currentScope) {
      currentScope = d.scope;
      lines.push(`[${d.scope}]`);
    }
    const roomStr =
      d.rooms.length > 0
        ? ` → ${d.rooms.map((r) => `${r.name}(${r.qty})`).join(', ')}`
        : '';
    const brandStr = d.brand ? ` | ${d.brand}` : '';
    const modelStr = d.model ? ` ${d.model}` : '';
    lines.push(
      `  • ${d.product}${brandStr}${modelStr} — qty: ${d.totalQty}${roomStr}`
    );
  });

  return lines.join('\n');
}
