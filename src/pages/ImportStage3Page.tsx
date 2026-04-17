import { useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ArrowLeft, FolderOpen } from 'lucide-react';
import type { LineItem } from '../types/index';
import { runIntelligenceRules } from '../lib/intelligenceRules';
import type { Suggestion, Severity } from '../lib/intelligenceRules';

interface ImportStage3PageProps {
  projectId: string;
  projectName: string;
  lineItems: LineItem[];
  onOpenEditor: (projectId: string) => void;
  onGoBack: () => void;
}

// ── Stage Indicator ──────────────────────────────────────────────────────────

function StageIndicator() {
  const stages = ['Upload Files', 'Map Rooms', 'Intelligence Report'];
  return (
    <div className="flex items-center gap-0">
      {stages.map((label, i) => {
        const isDone = i < 2;
        const isActive = i === 2;
        return (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div
                className="h-px w-10"
                style={{ background: isDone || isActive ? 'var(--color-accent)' : 'var(--color-border)' }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: isDone
                    ? 'var(--color-accent)'
                    : isActive
                    ? 'rgba(99,102,241,0.15)'
                    : 'var(--color-bg-input)',
                  border: isActive
                    ? '2px solid var(--color-accent)'
                    : isDone
                    ? 'none'
                    : '2px solid var(--color-border)',
                  color: isDone ? '#fff' : isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className="text-xs whitespace-nowrap"
                style={{
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  error: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.25)',
    icon: <AlertCircle size={15} />,
    label: 'Error',
  },
  warning: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    icon: <AlertTriangle size={15} />,
    label: 'Warning',
  },
  info: {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.25)',
    icon: <Info size={15} />,
    label: 'Info',
  },
};

// ── Suggestion Card ───────────────────────────────────────────────────────────

function SuggestionCard({ s }: { s: Suggestion }) {
  const cfg = SEVERITY_CONFIG[s.severity];
  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
    >
      {/* Left colour bar */}
      <div className="w-1 shrink-0" style={{ background: cfg.color }} />

      <div className="flex-1 p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-1.5">
          <span style={{ color: cfg.color, marginTop: '1px' }}>{cfg.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ background: cfg.color + '22', color: cfg.color }}
              >
                {cfg.label}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: 'var(--color-bg-input)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {s.category}
              </span>
            </div>
            <p
              className="mt-1.5 text-sm font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {s.title}
            </p>
          </div>
        </div>

        {/* Detail */}
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)', paddingLeft: '22px' }}>
          {s.detail}
        </p>

        {/* Affected items */}
        {s.affectedItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-5">
            {s.affectedItems.slice(0, 5).map((item, j) => (
              <span
                key={j}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {item}
              </span>
            ))}
            {s.affectedItems.length > 5 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-text-muted)' }}
              >
                +{s.affectedItems.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ImportStage3Page({
  projectId,
  projectName,
  lineItems,
  onOpenEditor,
  onGoBack,
}: ImportStage3PageProps) {
  const suggestions = useMemo(() => runIntelligenceRules(lineItems), [lineItems]);

  const errorCount = suggestions.filter((s) => s.severity === 'error').length;
  const warningCount = suggestions.filter((s) => s.severity === 'warning').length;
  const infoCount = suggestions.filter((s) => s.severity === 'info').length;

  const allClear = suggestions.length === 0;

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Suggestion[]>();
    for (const s of suggestions) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return map;
  }, [suggestions]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-base)' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--color-bg-sidebar)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              B
            </div>
            <div>
              <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                Import from PR + Drawing
              </span>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {projectName}
              </p>
            </div>
          </div>
          <StageIndicator />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            BOQ Intelligence Report
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Automated cross-checks against your imported items.
          </p>
        </div>

        {/* Summary bar */}
        <div
          className="flex items-center gap-4 rounded-xl px-5 py-4 mb-7"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {allClear ? (
            <div className="flex items-center gap-2.5">
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                All checks passed — no issues found
              </span>
            </div>
          ) : (
            <>
              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                  <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {infoCount > 0 && (
                <div className="flex items-center gap-2">
                  <Info size={16} style={{ color: '#3b82f6' }} />
                  <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                    {infoCount} info
                  </span>
                </div>
              )}
              <div className="flex-1" />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {lineItems.filter((i) => i.included).length} active line items checked
              </span>
            </>
          )}
        </div>

        {/* Suggestions grouped by category */}
        {allClear ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <CheckCircle size={32} style={{ color: '#22c55e' }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              BOQ looks good!
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No infrastructure conflicts or missing items detected.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <h2
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {category}
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((s) => (
                    <SuggestionCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div
          className="flex items-center justify-between mt-8 pt-6"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <ArrowLeft size={15} />
            Go Back &amp; Edit Mapping
          </button>

          <button
            onClick={() => onOpenEditor(projectId)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
          >
            <FolderOpen size={15} />
            Open BOQ Editor
          </button>
        </div>
      </main>
    </div>
  );
}
