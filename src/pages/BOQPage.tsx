import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, LineItem, Room } from '../types/index';
import { loadProject, saveProject } from '../lib/storage';
import { exportProjectJSON, generateId } from '../lib/boqUtils';
import TopBar from '../components/layout/TopBar';
import BOQTable from '../components/boq/BOQTable';
import RoomManager from '../components/boq/RoomManager';

interface BOQPageProps {
  projectId: string;
  onBack: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function BOQPage({ projectId, onBack }: BOQPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = loadProject(projectId);
    if (p) setProject(p);
  }, [projectId]);

  const triggerSave = useCallback((updatedProject: Project) => {
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const withTimestamp = { ...updatedProject, updatedAt: new Date().toISOString() };
      saveProject(withTimestamp);
      setSaveStatus('saved');
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  }, []);

  function updateProject(updates: Partial<Project>) {
    setProject((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      triggerSave(updated);
      return updated;
    });
  }

  function handleUpdateItem(id: string, updates: Partial<LineItem>) {
    setProject((prev) => {
      if (!prev) return prev;
      const updated: Project = {
        ...prev,
        lineItems: prev.lineItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      };
      triggerSave(updated);
      return updated;
    });
  }

  function handleDeleteItem(id: string) {
    setProject((prev) => {
      if (!prev) return prev;
      const updated: Project = {
        ...prev,
        lineItems: prev.lineItems.filter((item) => item.id !== id),
      };
      triggerSave(updated);
      return updated;
    });
  }

  function handleAddCustomItem(scope: string) {
    const newItem: LineItem = {
      id: generateId(),
      scope,
      product: '',
      brand: '',
      modelNumber: '',
      specs: '',
      notes: '',
      roomAllocations: [],
      included: true,
      isCustom: true,
    };
    setProject((prev) => {
      if (!prev) return prev;
      // Insert after last item of same scope
      const items = [...prev.lineItems];
      const lastScopeIdx = items.map((i) => i.scope).lastIndexOf(scope);
      if (lastScopeIdx >= 0) {
        items.splice(lastScopeIdx + 1, 0, newItem);
      } else {
        items.push(newItem);
      }
      const updated: Project = { ...prev, lineItems: items };
      triggerSave(updated);
      return updated;
    });
  }

  function handleRoomsChange(rooms: Room[]) {
    updateProject({ rooms });
  }

  if (!project) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-muted)' }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm">Loading project…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <TopBar
        project={project}
        onBack={onBack}
        onManageRooms={() => setShowRoomManager(true)}
        onExport={() => exportProjectJSON(project)}
        saveStatus={saveStatus}
      />

      {/* BOQ Table fills remaining height */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <BOQTable
          project={project}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onAddCustomItem={handleAddCustomItem}
        />
      </div>

      {/* Room Manager */}
      {showRoomManager && (
        <RoomManager
          rooms={project.rooms}
          onChange={handleRoomsChange}
          onClose={() => setShowRoomManager(false)}
        />
      )}
    </div>
  );
}
