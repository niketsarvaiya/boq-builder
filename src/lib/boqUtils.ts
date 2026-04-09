import type { LineItem, Project } from '../types/index';

export function getLineItemTotal(item: LineItem): number {
  return item.roomAllocations.reduce((sum, ra) => sum + (ra.qty || 0), 0);
}

export function getRoomTotal(project: Project, roomId: string): number {
  return project.lineItems
    .filter((item) => item.included)
    .reduce((sum, item) => {
      const ra = item.roomAllocations.find((r) => r.roomId === roomId);
      return sum + (ra?.qty ?? 0);
    }, 0);
}

export function getScopeTotals(
  lineItems: LineItem[],
  scope: string
): { count: number; total: number } {
  const items = lineItems.filter((item) => item.scope === scope && item.included);
  return {
    count: items.length,
    total: items.reduce((sum, item) => sum + getLineItemTotal(item), 0),
  };
}

export function exportProjectJSON(project: Project): void {
  const exportData = {
    boqVersion: '1.0',
    exportedAt: new Date().toISOString(),
    ...project,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BOQ_${project.projectCode || project.name}_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
