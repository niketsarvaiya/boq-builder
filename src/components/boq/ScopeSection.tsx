import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { LineItem, Room, RoomAllocation } from '../../types/index';
import { SCOPE_COLORS } from '../../lib/defaultProducts';
import { getLineItemTotal } from '../../lib/boqUtils';

interface ScopeSectionProps {
  scope: string;
  items: LineItem[];
  rooms: Room[];
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddCustomItem: (scope: string) => void;
  isEven: boolean;
}

export default function ScopeSection({
  scope,
  items,
  rooms,
  onUpdateItem,
  onDeleteItem,
  onAddCustomItem,
  isEven,
}: ScopeSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const color = SCOPE_COLORS[scope] ?? '#6366f1';
  const includedItems = items.filter((i) => i.included);
  const sectionTotal = includedItems.reduce((sum, i) => sum + getLineItemTotal(i), 0);

  function setRoomQty(item: LineItem, roomId: string, qty: number) {
    const existing = item.roomAllocations.find((ra) => ra.roomId === roomId);
    let newAllocations: RoomAllocation[];
    if (existing) {
      newAllocations = item.roomAllocations.map((ra) =>
        ra.roomId === roomId ? { ...ra, qty } : ra
      );
    } else {
      newAllocations = [...item.roomAllocations, { roomId, qty }];
    }
    onUpdateItem(item.id, { roomAllocations: newAllocations });
  }

  function getRoomQty(item: LineItem, roomId: string): number {
    return item.roomAllocations.find((ra) => ra.roomId === roomId)?.qty ?? 0;
  }

  const rowBg = isEven ? 'var(--color-bg-row-alt)' : 'var(--color-bg-card)';
  const altBg = isEven ? 'var(--color-bg-card)' : 'var(--color-bg-row-alt)';

  return (
    <>
      {/* Section header row */}
      <tr
        style={{
          background: 'var(--color-bg-sidebar)',
          borderLeft: `3px solid ${color}`,
        }}
      >
        <td
          colSpan={4 + rooms.length + 4}
          className="scope-header-sticky"
          style={{
            background: 'var(--color-bg-sidebar)',
            padding: 0,
          }}
        >
          <div
            className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none"
            style={{ borderLeft: `3px solid ${color}` }}
            onClick={() => setCollapsed((c) => !c)}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
            {/* Scope badge */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${color}20`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {scope}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {includedItems.length} active · {sectionTotal > 0 ? `${sectionTotal} total units` : 'no units assigned'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              ({items.length} items)
            </span>
          </div>
        </td>
      </tr>

      {/* Items */}
      {!collapsed &&
        items.map((item, idx) => {
          const total = getLineItemTotal(item);
          const bg = idx % 2 === 0 ? rowBg : altBg;

          return (
            <tr
              key={item.id}
              style={{
                background: bg,
                opacity: item.included ? 1 : 0.4,
                transition: 'opacity 0.15s',
              }}
            >
              {/* Col 1: Checkbox */}
              <td
                className="sticky-col-1"
                style={{
                  width: 40,
                  minWidth: 40,
                  padding: '6px 0',
                  textAlign: 'center',
                  background: bg,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={(e) => onUpdateItem(item.id, { included: e.target.checked })}
                  className="cursor-pointer"
                  style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }}
                />
              </td>

              {/* Col 2: Scope badge */}
              <td
                className="sticky-col-2"
                style={{
                  width: 90,
                  minWidth: 90,
                  padding: '6px 4px',
                  background: bg,
                }}
              >
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    background: `${color}18`,
                    color,
                    fontSize: '10px',
                  }}
                >
                  {scope}
                </span>
              </td>

              {/* Col 3: Product name */}
              <td
                className="sticky-col-3"
                style={{
                  width: 200,
                  minWidth: 200,
                  padding: '5px 4px',
                  background: bg,
                }}
              >
                {item.isCustom ? (
                  <input
                    type="text"
                    value={item.product}
                    onChange={(e) => onUpdateItem(item.id, { product: e.target.value })}
                    placeholder="Product name…"
                    className="cell-input"
                    style={{ fontWeight: 500 }}
                  />
                ) : (
                  <span
                    className="text-sm pl-1.5 block truncate"
                    style={{
                      color: 'var(--color-text-primary)',
                      fontWeight: 500,
                    }}
                    title={item.product}
                  >
                    {item.product}
                  </span>
                )}
              </td>

              {/* Room qty cols */}
              {rooms.map((room) => {
                const qty = getRoomQty(item, room.id);
                return (
                  <td
                    key={room.id}
                    style={{
                      width: 72,
                      minWidth: 72,
                      padding: '5px 4px',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      value={qty === 0 ? '' : qty}
                      placeholder="—"
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setRoomQty(item, room.id, isNaN(v) ? 0 : Math.max(0, v));
                      }}
                      className="room-cell"
                    />
                  </td>
                );
              })}

              {/* Total */}
              <td
                className="total-cell"
                style={{
                  width: 70,
                  minWidth: 70,
                  padding: '5px 6px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: 13,
                  color: total > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                }}
              >
                {total > 0 ? total : '—'}
              </td>

              {/* Brand */}
              <td style={{ width: 140, minWidth: 140, padding: '5px 4px' }}>
                <input
                  type="text"
                  value={item.brand}
                  onChange={(e) => onUpdateItem(item.id, { brand: e.target.value })}
                  placeholder="Brand"
                  className="cell-input"
                />
              </td>

              {/* Model # */}
              <td style={{ width: 130, minWidth: 130, padding: '5px 4px' }}>
                <input
                  type="text"
                  value={item.modelNumber}
                  onChange={(e) => onUpdateItem(item.id, { modelNumber: e.target.value })}
                  placeholder="Model #"
                  className="cell-input"
                />
              </td>

              {/* Specs */}
              <td style={{ width: 180, minWidth: 180, padding: '5px 4px' }}>
                <input
                  type="text"
                  value={item.specs}
                  onChange={(e) => onUpdateItem(item.id, { specs: e.target.value })}
                  placeholder="Specs / Notes"
                  className="cell-input"
                />
              </td>

              {/* Actions */}
              <td style={{ width: 40, minWidth: 40, padding: '5px 4px', textAlign: 'center' }}>
                {item.isCustom && (
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    title="Delete custom item"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}

      {/* Add custom item row */}
      {!collapsed && (
        <tr style={{ background: isEven ? rowBg : altBg }}>
          <td colSpan={4 + rooms.length + 4} style={{ padding: '4px 8px' }}>
            <button
              onClick={() => onAddCustomItem(scope)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                color: color,
                background: `${color}10`,
                border: `1px dashed ${color}40`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${color}1e`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${color}10`)}
            >
              <Plus size={12} />
              Add custom item to {scope}
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

