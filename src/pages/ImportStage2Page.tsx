import { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, ArrowRight,
  CheckCircle2, AlertTriangle, Search, Zap, Pencil,
} from 'lucide-react';
import type { Room, LineItem, ScopeName } from '../types/index';
import type { ParsedPRItem, ParsedDWGData, ImportDraft } from '../types/import';
import { IMPORT_DRAFT_KEY } from '../types/import';
import { saveProject } from '../lib/storage';
import { generateId } from '../lib/boqUtils';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const ALL_SCOPES: ScopeName[] = [
  'Processors', 'Front End', 'Backend Lighting', 'Temp / AC', 'IR', 'Motors',
  'AV', 'Networking', 'Integrated Security', 'Cables', 'Backend Infrastructure',
  'Sensors', 'General',
];

interface ImportStage2PageProps {
  onComplete: (projectId: string) => void;
  onBack: () => void;
}

// ── Stage indicator (shared) ──────────────────────────────────────────────────

function StageIndicator({ current }: { current: 1 | 2 | 3 }) {
  const stages = ['Upload', 'Map Rooms', 'Intelligence'];
  return (
    <div className="flex items-center gap-0">
      {stages.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done
                    ? 'var(--color-accent)'
                    : active
                    ? 'rgba(99,102,241,0.15)'
                    : 'var(--color-bg-input)',
                  color: done ? '#fff' : active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  border: active ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-border)',
                }}
              >
                {done ? '✓' : n}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              >
                {label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="w-8 h-px mx-2" style={{ background: done ? 'var(--color-accent)' : 'var(--color-border)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Verification flag logic ───────────────────────────────────────────────────

type VerificationFlag = 'match' | 'pr-only' | 'dwg-annotation';

function getFlag(item: ParsedPRItem, dwg: ParsedDWGData): VerificationFlag {
  const prod = item.product.toLowerCase();
  const dc = dwg.deviceCounts;

  if (item.scope === 'Front End' && (dc['Keypad'] ?? 0) > 0) return 'match';
  if (item.scope === 'Integrated Security' && /camera/i.test(prod) && (dc['Camera'] ?? 0) > 0) return 'match';
  if (item.scope === 'Networking' && /access\s*point|gwn76/i.test(prod) && (dc['Access Point'] ?? 0) > 0) return 'match';
  if (item.scope === 'Networking' && /wi-fi|wireless/i.test(prod) && (dc['Access Point'] ?? 0) > 0) return 'match';

  if (item.scope === 'AV') {
    const annotMatch = dwg.avAnnotations.some((a) =>
      a.toLowerCase().includes(item.brand?.toLowerCase() || '__') ||
      a.toLowerCase().includes(item.product.toLowerCase().split(' ')[0]),
    );
    if (annotMatch) return 'match';
  }

  return 'pr-only';
}

function FlagBadge({ flag }: { flag: VerificationFlag }) {
  if (flag === 'match') {
    return (
      <span title="Confirmed in drawing" className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
        <CheckCircle2 size={10} /> Match
      </span>
    );
  }
  if (flag === 'dwg-annotation') {
    return (
      <span title="From DWG annotation" className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
        <Search size={10} /> DWG only
      </span>
    );
  }
  return (
    <span title="PR only – not found in drawing" className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
      <AlertTriangle size={10} /> PR only
    </span>
  );
}


// ── Room Allocation panel ─────────────────────────────────────────────────────

interface AllocationPanelProps {
  item: ParsedPRItem;
  rooms: { id: string; name: string }[];
  onUpdate: (itemId: string, roomId: string, qty: number) => void;
  onClose: () => void;
}

function AllocationPanel({ item, rooms, onUpdate, onClose }: AllocationPanelProps) {
  const totalAllocated = item.roomAllocations.reduce((s, r) => s + r.qty, 0);
  const remaining = item.qty - totalAllocated;

  return (
    <div
      className="rounded-xl p-4 mt-2 flex flex-col gap-3"
      style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-accent)', borderTopWidth: '2px' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Assign qty per room
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: remaining === 0 ? '#10b981' : remaining < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {totalAllocated} / {item.qty} allocated
          </span>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>✕</button>
        </div>
      </div>

      {rooms.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No rooms yet — add rooms in the left panel first.
        </p>
      )}

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {rooms.map((room) => {
          const alloc = item.roomAllocations.find((r) => r.roomId === room.id);
          const qty = alloc?.qty ?? 0;
          return (
            <div key={room.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {room.name}
              </span>
              <input
                type="number"
                min={0}
                value={qty === 0 ? '' : qty}
                placeholder="0"
                onChange={(e) => onUpdate(item.id, room.id, Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 rounded px-1.5 py-1 text-xs text-center"
                style={{
                  background: 'var(--color-bg-input)',
                  border: `1px solid ${qty > 0 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ImportStage2Page({ onComplete, onBack }: ImportStage2PageProps) {
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [prItems, setPrItems] = useState<ParsedPRItem[]>([]);
  const [dwgData, setDwgData] = useState<ParsedDWGData>({ rooms: [], deviceCounts: {}, avAnnotations: [] });
  const [newRoomName, setNewRoomName] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ product: '', brand: '', modelNumber: '', qty: '1', scope: 'General' as ScopeName });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(IMPORT_DRAFT_KEY);
      if (!raw) return;
      const d: ImportDraft = JSON.parse(raw);
      setDraft(d);
      setPrItems(d.prItems);
      setDwgData(d.dwgData);
      // Seed rooms from DWG extraction
      setRooms(
        d.dwgData.rooms.map((name, i) => ({ id: `room-${i}-${generateId()}`, name })),
      );
    } catch { /* ignore */ }
  }, []);

  // ── Room actions ──────────────────────────────────────────────────────────

  function addRoom() {
    const name = newRoomName.trim();
    if (!name) return;
    setRooms((prev) => [...prev, { id: generateId(), name }]);
    setNewRoomName('');
    setShowAddRoom(false);
  }

  function deleteRoom(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    // Remove allocations for deleted room
    setPrItems((prev) =>
      prev.map((item) => ({
        ...item,
        roomAllocations: item.roomAllocations.filter((a) => a.roomId !== id),
      })),
    );
  }

  // ── Allocation actions ────────────────────────────────────────────────────

  function updateAllocation(itemId: string, roomId: string, qty: number) {
    setPrItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        let allocs = item.roomAllocations.filter((a) => a.roomId !== roomId);
        if (qty > 0) allocs = [...allocs, { roomId, qty }];
        return { ...item, roomAllocations: allocs };
      }),
    );
  }

  // ── Delete PR item ────────────────────────────────────────────────────────

  function deleteItem(id: string) {
    setPrItems((prev) => prev.filter((item) => item.id !== id));
  }

  // ── Update item scope ─────────────────────────────────────────────────────

  function updateScope(id: string, scope: ScopeName) {
    setPrItems((prev) => prev.map((item) => item.id === id ? { ...item, scope } : item));
    setEditingScopeId(null);
  }

  // ── Add item manually ─────────────────────────────────────────────────────

  function handleAddItem() {
    if (!addForm.product.trim()) return;
    const newItem: ParsedPRItem = {
      id: generateId(),
      product: addForm.product.trim(),
      brand: addForm.brand.trim(),
      modelNumber: addForm.modelNumber.trim(),
      qty: Math.max(1, parseInt(addForm.qty) || 1),
      scope: addForm.scope,
      notes: 'Added manually',
      rawRow: -1,
      roomAllocations: [],
    };
    setPrItems((prev) => [...prev, newItem]);
    setAddForm({ product: '', brand: '', modelNumber: '', qty: '1', scope: 'General' });
    setShowAddForm(false);
  }

  // ── Add AV annotation as item ─────────────────────────────────────────────

  function addAnnotationAsItem(annotation: string) {
    const newItem: ParsedPRItem = {
      id: generateId(),
      product: annotation,
      brand: '',
      modelNumber: '',
      qty: 1,
      scope: 'AV',
      notes: 'From DWG annotation',
      rawRow: -1,
      roomAllocations: [],
    };
    setPrItems((prev) => [...prev, newItem]);
  }

  // ── Freeze & Generate BOQ ─────────────────────────────────────────────────

  function handleFreeze() {
    if (!draft) return;

    const now = new Date().toISOString();

    const finalRooms: Room[] = rooms.map((r, idx) => ({
      id: r.id,
      name: r.name,
      order: idx,
    }));

    const lineItems: LineItem[] = prItems.map((item) => ({
      id: generateId(),
      scope: item.scope,
      product: item.product,
      brand: item.brand,
      modelNumber: item.modelNumber,
      specs: '',
      notes: item.notes,
      roomAllocations: item.roomAllocations,
      included: true,
      isCustom: false,
    }));

    const project = {
      ...draft.project,
      rooms: finalRooms,
      lineItems,
      updatedAt: now,
    };

    saveProject(project);
    localStorage.removeItem(IMPORT_DRAFT_KEY);
    onComplete(project.id);
  }

  // ── Group items by scope ──────────────────────────────────────────────────

  const scopeGroups: Record<string, ParsedPRItem[]> = {};
  for (const item of prItems) {
    if (!scopeGroups[item.scope]) scopeGroups[item.scope] = [];
    scopeGroups[item.scope].push(item);
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg-base)' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading draft…</p>
        </div>
      </div>
    );
  }

  const alreadyAnnotated = new Set(
    dwgData.avAnnotations.filter((a) => prItems.some((i) => i.product === a))
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-base)' }}>
      {/* Header */}
      <header style={{ background: 'var(--color-bg-sidebar)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
              <ArrowLeft size={14} />
              Back
            </button>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <span className="text-sm font-semibold truncate max-w-xs" style={{ color: 'var(--color-text-primary)' }}>
              {draft.project.name}
            </span>
          </div>

          <StageIndicator current={2} />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleFreeze}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}>
              Freeze & Generate BOQ
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* 3-column body */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── LEFT: Rooms ─────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col overflow-y-auto shrink-0"
          style={{
            width: '240px',
            borderRight: '1px solid var(--color-border)',
            background: 'var(--color-bg-sidebar)',
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Rooms ({rooms.length})
            </p>
          </div>

          <div className="flex-1 px-3 py-3 flex flex-col gap-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {room.name}
                </span>
                <button
                  onClick={() => deleteRoom(room.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Add room */}
            {showAddRoom ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addRoom(); if (e.key === 'Escape') setShowAddRoom(false); }}
                  placeholder="Room name"
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-xs"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-accent)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
                <button onClick={addRoom} className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}>
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddRoom(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
                style={{ color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <Plus size={12} /> Add room manually
              </button>
            )}
          </div>
        </aside>

        {/* ── MIDDLE: PR Items ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              PR Items ({prItems.length})
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Click an item to assign room quantities · hover for edit/delete
            </p>
          </div>

          {Object.entries(scopeGroups).map(([scope, items]) => (
            <div key={scope}>
              {/* Scope header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider px-2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {scope}
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item) => {
                  const flag = getFlag(item, dwgData);
                  const isExpanded = expandedItemId === item.id;
                  const isEditingScope = editingScopeId === item.id;
                  const totalAllocated = item.roomAllocations.reduce((s, r) => s + r.qty, 0);

                  return (
                    <div key={item.id}>
                      <div
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: isExpanded ? 'rgba(99,102,241,0.06)' : 'var(--color-bg-card)',
                          border: `1px solid ${isExpanded ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.borderColor = 'var(--color-accent)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                      >
                        {/* Main clickable area */}
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => { setExpandedItemId(isExpanded ? null : item.id); setEditingScopeId(null); }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {item.product}
                            </span>
                            <FlagBadge flag={flag} />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.brand && (
                              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.brand}</span>
                            )}
                            {item.modelNumber && (
                              <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{item.modelNumber}</span>
                            )}
                          </div>
                        </div>

                        {/* Scope badge / inline scope editor */}
                        <div className="relative shrink-0">
                          {isEditingScope ? (
                            <select
                              autoFocus
                              value={item.scope}
                              onChange={(e) => updateScope(item.id, e.target.value as ScopeName)}
                              onBlur={() => setEditingScopeId(null)}
                              className="text-xs rounded px-1.5 py-1"
                              style={{
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-accent)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ALL_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <button
                              title="Click to change scope"
                              onClick={(e) => { e.stopPropagation(); setEditingScopeId(item.id); }}
                              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
                              style={{
                                background: 'var(--color-bg-input)',
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-accent)';
                                e.currentTarget.style.color = 'var(--color-accent)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                              }}
                            >
                              {item.scope}
                              <Pencil size={9} />
                            </button>
                          )}
                        </div>

                        {/* Qty + expand */}
                        <div
                          className="flex items-center gap-2 shrink-0"
                          onClick={() => { setExpandedItemId(isExpanded ? null : item.id); setEditingScopeId(null); }}
                        >
                          <div className="text-right">
                            <div className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                              {totalAllocated > 0 ? totalAllocated : item.qty}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {totalAllocated > 0 ? `/${item.qty}` : 'qty'}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />}
                        </div>

                        {/* Delete button */}
                        <button
                          title="Delete item"
                          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {isExpanded && (
                        <AllocationPanel
                          item={item}
                          rooms={rooms}
                          onUpdate={updateAllocation}
                          onClose={() => setExpandedItemId(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Add Item Form ──────────────────────────────────────────────── */}
          {showAddForm ? (
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-accent)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Add Item Manually</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'product', placeholder: 'Product description *', span: 2 },
                  { key: 'brand', placeholder: 'Brand / Make', span: 1 },
                  { key: 'modelNumber', placeholder: 'Model number', span: 1 },
                ].map(({ key, placeholder, span }) => (
                  <input
                    key={key}
                    type="text"
                    placeholder={placeholder}
                    value={addForm[key as keyof typeof addForm]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{
                      gridColumn: `span ${span}`,
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  />
                ))}
                <input
                  type="number"
                  placeholder="Qty"
                  min={1}
                  value={addForm.qty}
                  onChange={(e) => setAddForm((f) => ({ ...f, qty: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
                <select
                  value={addForm.scope}
                  onChange={(e) => setAddForm((f) => ({ ...f, scope: e.target.value as ScopeName }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                >
                  {ALL_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!addForm.product.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: addForm.product.trim() ? 'var(--color-accent)' : 'var(--color-bg-input)',
                    color: addForm.product.trim() ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors self-start"
              style={{ color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              <Plus size={14} />
              Add Item Manually
            </button>
          )}
        </main>

        {/* ── RIGHT: DWG Summary ───────────────────────────────────────────── */}
        <aside
          className="flex flex-col overflow-y-auto shrink-0"
          style={{
            width: '280px',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-bg-sidebar)',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Drawing Summary
            </p>
          </div>

          {/* Device counts */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Device Counts
            </p>
            {Object.keys(dwgData.deviceCounts).length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No device blocks detected in drawing.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(dwgData.deviceCounts).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{cat}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AV Annotations */}
          <div className="px-4 py-3 flex-1">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              AV Annotations
            </p>
            {dwgData.avAnnotations.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No AV brand annotations found.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {dwgData.avAnnotations.map((annotation, i) => {
                  const already = alreadyAnnotated.has(annotation);
                  return (
                    <div key={i} className="rounded-lg px-3 py-2.5 flex flex-col gap-2"
                      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {annotation}
                      </p>
                      {already ? (
                        <span className="text-xs" style={{ color: '#10b981' }}>✓ Already in BOQ</span>
                      ) : (
                        <button
                          onClick={() => addAnnotationAsItem(annotation)}
                          className="self-start flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                          style={{
                            background: 'rgba(59,130,246,0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59,130,246,0.2)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.18)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                        >
                          <Zap size={11} /> + Add to BOQ
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
