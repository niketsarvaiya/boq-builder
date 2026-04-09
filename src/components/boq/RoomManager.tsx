import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import type { Room } from '../../types/index';
import { generateId } from '../../lib/boqUtils';
import Modal from '../ui/Modal';

const ROOM_PRESETS = [
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Kitchen',
  'Dining',
  'Passage',
  'Foyer',
  'Den',
  'Study',
  'Balcony',
  'Terrace',
  'Utility',
  'Puja Room',
  'Guest Room',
  'Home Theatre',
];

interface RoomManagerProps {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
  onClose: () => void;
}

export default function RoomManager({ rooms, onChange, onClose }: RoomManagerProps) {
  const [newRoomName, setNewRoomName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function addRoom(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newRoom: Room = {
      id: generateId(),
      name: trimmed,
      order: rooms.length,
    };
    onChange([...rooms, newRoom]);
    setNewRoomName('');
  }

  function moveRoom(id: string, dir: 'up' | 'down') {
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const newRooms = [...rooms];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newRooms.length) return;
    [newRooms[idx], newRooms[swapIdx]] = [newRooms[swapIdx], newRooms[idx]];
    onChange(newRooms.map((r, i) => ({ ...r, order: i })));
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setEditingName(room.name);
  }

  function commitEdit(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    onChange(rooms.map((r) => (r.id === id ? { ...r, name: trimmed } : r)));
    setEditingId(null);
  }

  function deleteRoom(id: string) {
    onChange(rooms.filter((r) => r.id !== id).map((r, i) => ({ ...r, order: i })));
    setDeleteConfirm(null);
  }

  return (
    <Modal title="Manage Rooms" onClose={onClose} width="520px">
      <div className="flex flex-col gap-4">
        {/* Existing rooms */}
        {rooms.length === 0 ? (
          <div
            className="text-sm py-6 text-center rounded-lg"
            style={{
              color: 'var(--color-text-muted)',
              border: '1px dashed var(--color-border)',
            }}
          >
            No rooms yet. Add your first room below.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
              >
                {/* Order arrows */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveRoom(room.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 rounded transition-opacity"
                    style={{
                      color: 'var(--color-text-muted)',
                      opacity: idx === 0 ? 0.2 : 1,
                    }}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => moveRoom(room.id, 'down')}
                    disabled={idx === rooms.length - 1}
                    className="p-0.5 rounded transition-opacity"
                    style={{
                      color: 'var(--color-text-muted)',
                      opacity: idx === rooms.length - 1 ? 0.2 : 1,
                    }}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>

                {/* Room number */}
                <span
                  className="text-xs font-mono w-5 text-center shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {idx + 1}
                </span>

                {/* Name / edit */}
                {editingId === room.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(room.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 rounded px-2 py-0.5 text-sm"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-accent)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    className="flex-1 text-sm cursor-pointer"
                    style={{ color: 'var(--color-text-primary)' }}
                    onClick={() => startEdit(room)}
                    title="Click to rename"
                  >
                    {room.name}
                  </span>
                )}

                {/* Edit confirm / delete */}
                {editingId === room.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => commitEdit(room.id)}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-success)' }}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : deleteConfirm === room.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-danger)' }}>
                      Delete?
                    </span>
                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: 'var(--color-danger)', color: '#fff' }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-muted)' }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(room.id)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Presets */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Quick Add Presets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ROOM_PRESETS.filter((p) => !rooms.some((r) => r.name === p)).map((preset) => (
              <button
                key={preset}
                onClick={() => addRoom(preset)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                  e.currentTarget.style.color = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom add */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Custom Room Name
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addRoom(newRoomName); }}
              placeholder="e.g. Gym, Garage, Server Room…"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
            <button
              onClick={() => addRoom(newRoomName)}
              disabled={!newRoomName.trim()}
              className="flex items-center gap-1.5 px-4 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: newRoomName.trim() ? 'var(--color-accent)' : 'var(--color-bg-input)',
                color: newRoomName.trim() ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {/* Done */}
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
