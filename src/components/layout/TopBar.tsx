import { ArrowLeft, Download, Settings2, CheckCircle2, Loader2 } from 'lucide-react';
import type { Project } from '../../types/index';

interface TopBarProps {
  project: Project;
  onBack: () => void;
  onManageRooms: () => void;
  onExport: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

export default function TopBar({
  project,
  onBack,
  onManageRooms,
  onExport,
  saveStatus,
}: TopBarProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 h-14 shrink-0"
      style={{
        background: 'var(--color-bg-sidebar)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-input)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
      >
        <ArrowLeft size={15} />
        <span className="hidden sm:inline">Projects</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

      {/* Branding */}
      <div className="flex items-center gap-2 mr-1">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          B
        </div>
        <span
          className="text-xs font-semibold tracking-widest uppercase hidden sm:inline"
          style={{ color: 'var(--color-accent)' }}
        >
          BOQ Builder
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 hidden sm:block" style={{ background: 'var(--color-border)' }} />

      {/* Project info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className="font-semibold text-sm truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {project.name}
          </span>
          {project.client && (
            <span
              className="text-xs truncate hidden sm:inline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              · {project.client}
            </span>
          )}
          {project.projectCode && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded hidden md:inline"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--color-accent)',
              }}
            >
              {project.projectCode}
            </span>
          )}
        </div>
        {project.location && (
          <div
            className="text-xs truncate hidden sm:block"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {project.location}
          </div>
        )}
      </div>

      {/* Save status */}
      <div
        className="flex items-center gap-1.5 text-xs min-w-[60px] justify-end"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {saveStatus === 'saving' && (
          <>
            <Loader2 size={12} className="animate-spin" />
            <span className="hidden sm:inline">Saving…</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
            <span className="hidden sm:inline" style={{ color: 'var(--color-success)' }}>Saved</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onManageRooms}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-bg-input)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.borderColor = 'var(--color-border-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          <Settings2 size={14} />
          <span className="hidden sm:inline">Rooms</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export JSON</span>
        </button>
      </div>
    </div>
  );
}
