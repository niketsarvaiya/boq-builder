import type { LineItem } from '../../types/index';
import { SCOPE_ORDER } from '../../lib/defaultProducts';
import { getRoomTotal } from '../../lib/boqUtils';
import ScopeSection from './ScopeSection';
import type { Project } from '../../types/index';

interface BOQTableProps {
  project: Project;
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddCustomItem: (scope: string) => void;
}

export default function BOQTable({
  project,
  onUpdateItem,
  onDeleteItem,
  onAddCustomItem,
}: BOQTableProps) {
  const { rooms, lineItems } = project;

  // Group items by scope, preserving SCOPE_ORDER
  const groupedByScope = new Map<string, LineItem[]>();
  for (const scope of SCOPE_ORDER) {
    groupedByScope.set(scope, []);
  }
  for (const item of lineItems) {
    if (!groupedByScope.has(item.scope)) {
      groupedByScope.set(item.scope, []);
    }
    groupedByScope.get(item.scope)!.push(item);
  }

  // Compute room totals (included items only)
  const roomTotals = rooms.map((room) => getRoomTotal(project, room.id));
  const grandTotal = roomTotals.reduce((a, b) => a + b, 0);

  const colCount = 4 + rooms.length + 4;

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <table
        style={{
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          tableLayout: 'fixed',
        }}
      >
        {/* Column widths */}
        <colgroup>
          <col style={{ width: 40 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 200 }} />
          {rooms.map((r) => (
            <col key={r.id} style={{ width: 72 }} />
          ))}
          <col style={{ width: 70 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 180 }} />
          <col style={{ width: 40 }} />
        </colgroup>

        {/* Sticky header */}
        <thead>
          <tr
            style={{
              background: 'var(--color-bg-table-header)',
              position: 'sticky',
              top: 0,
              zIndex: 20,
            }}
          >
            {/* Checkbox */}
            <th
              className="sticky-col-1"
              style={{
                width: 40,
                padding: '10px 0',
                textAlign: 'center',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              ✓
            </th>
            {/* Scope */}
            <th
              className="sticky-col-2"
              style={{
                width: 90,
                padding: '10px 4px',
                textAlign: 'left',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Scope
            </th>
            {/* Product */}
            <th
              className="sticky-col-3"
              style={{
                width: 200,
                padding: '10px 8px',
                textAlign: 'left',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Product
            </th>
            {/* Room columns */}
            {rooms.map((room) => (
              <th
                key={room.id}
                style={{
                  width: 72,
                  padding: '10px 4px',
                  textAlign: 'center',
                  background: 'var(--color-bg-table-header)',
                  borderBottom: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 72,
                }}
                title={room.name}
              >
                {room.name.length > 8 ? room.name.slice(0, 7) + '…' : room.name}
              </th>
            ))}
            {/* Total */}
            <th
              style={{
                width: 70,
                padding: '10px 6px',
                textAlign: 'center',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-accent)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Total
            </th>
            {/* Brand */}
            <th
              style={{
                width: 140,
                padding: '10px 8px',
                textAlign: 'left',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Brand
            </th>
            {/* Model */}
            <th
              style={{
                width: 130,
                padding: '10px 8px',
                textAlign: 'left',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Model #
            </th>
            {/* Specs */}
            <th
              style={{
                width: 180,
                padding: '10px 8px',
                textAlign: 'left',
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Specs / Notes
            </th>
            {/* Actions */}
            <th
              style={{
                width: 40,
                background: 'var(--color-bg-table-header)',
                borderBottom: '1px solid var(--color-border)',
              }}
            />
          </tr>
        </thead>

        <tbody>
          {/* Empty state for no rooms */}
          {rooms.length === 0 && (
            <tr>
              <td
                colSpan={colCount}
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span style={{ fontSize: 32 }}>🏠</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    No rooms configured
                  </p>
                  <p className="text-xs">Click "Rooms" in the top bar to add rooms to this project.</p>
                </div>
              </td>
            </tr>
          )}

          {/* Scope sections */}
          {Array.from(groupedByScope.entries()).map(([scope, items], scopeIdx) => {
            if (items.length === 0) return null;
            return (
              <ScopeSection
                key={scope}
                scope={scope}
                items={items}
                rooms={rooms}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onAddCustomItem={onAddCustomItem}
                isEven={scopeIdx % 2 === 0}
              />
            );
          })}

          {/* Totals row */}
          {rooms.length > 0 && (
            <tr
              style={{
                position: 'sticky',
                bottom: 0,
                zIndex: 15,
                background: 'var(--color-bg-sidebar)',
                borderTop: '2px solid var(--color-border)',
              }}
            >
              {/* Empty checkbox col */}
              <td
                className="sticky-col-1"
                style={{
                  background: 'var(--color-bg-sidebar)',
                  padding: '8px 0',
                  borderTop: '2px solid var(--color-border)',
                }}
              />
              {/* Scope col */}
              <td
                className="sticky-col-2"
                style={{
                  background: 'var(--color-bg-sidebar)',
                  padding: '8px 4px',
                  borderTop: '2px solid var(--color-border)',
                }}
              />
              {/* Label */}
              <td
                className="sticky-col-3"
                style={{
                  background: 'var(--color-bg-sidebar)',
                  padding: '8px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  borderTop: '2px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                }}
              >
                Room Totals
              </td>
              {/* Per-room totals */}
              {rooms.map((room, ri) => (
                <td
                  key={room.id}
                  style={{
                    width: 72,
                    padding: '8px 4px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    color: roomTotals[ri] > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    borderTop: '2px solid var(--color-border)',
                  }}
                >
                  {roomTotals[ri] > 0 ? roomTotals[ri] : '—'}
                </td>
              ))}
              {/* Grand total */}
              <td
                style={{
                  width: 70,
                  padding: '8px 6px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  color: grandTotal > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                  background: 'rgba(99,102,241,0.08)',
                  borderTop: '2px solid var(--color-border)',
                }}
              >
                {grandTotal > 0 ? grandTotal : '—'}
              </td>
              {/* Brand / model / specs / actions */}
              <td colSpan={4} style={{ borderTop: '2px solid var(--color-border)' }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

