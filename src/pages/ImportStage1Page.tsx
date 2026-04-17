import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileText, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import type { ScopeName, Project } from '../types/index';
import type { ParsedPRItem, ParsedDWGData, ImportDraft } from '../types/import';
import { IMPORT_DRAFT_KEY } from '../types/import';
import { generateId } from '../lib/boqUtils';
import { ThemeToggle } from '../components/ui/ThemeToggle';

interface ImportStage1PageProps {
  onContinue: () => void;
  onBack: () => void;
}

// ── Section → ScopeName mapping ──────────────────────────────────────────────

function mapSectionToScope(section: string): ScopeName {
  const s = section.toLowerCase();
  if (/control|main\s*control|processor/.test(s)) return 'Processors';
  if (/keypad|front\s*end/.test(s)) return 'Front End';
  if (/network(?!ing wifi)|networking/.test(s)) return 'Networking';
  if (/wifi|wi-fi|wireless|access\s*point/.test(s)) return 'Networking';
  if (/cctv|security|camera|surveillance/.test(s)) return 'Integrated Security';
  if (/\bav\b|audio|video|home\s*cinema|theatre/.test(s)) return 'AV';
  if (/db|infrastructure|panel|distribution/.test(s)) return 'Backend Infrastructure';
  if (/lighting|dimmer|dali/.test(s)) return 'Backend Lighting';
  if (/motor|blind|curtain/.test(s)) return 'Motors';
  if (/hvac|ac|air\s*con|temp/.test(s)) return 'Temp / AC';
  if (/ir|infrared/.test(s)) return 'IR';
  if (/sensor/.test(s)) return 'Sensors';
  if (/cable|conduit/.test(s)) return 'Cables';
  return 'General';
}

// ── Excel Parser ──────────────────────────────────────────────────────────────

async function parsePRExcel(file: File): Promise<ParsedPRItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target!.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as string[][];

        // Find header row (first row containing "description", "item", "qty", etc.)
        let headerRowIdx = -1;
        const colMap: Record<string, number> = {};

        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const row = rows[i];
          const lower = row.map((c) => String(c ?? '').toLowerCase().trim());
          const combined = lower.join('|');
          if (
            combined.includes('description') ||
            combined.includes('item') ||
            combined.includes('product') ||
            combined.includes('qty') ||
            combined.includes('quantity')
          ) {
            headerRowIdx = i;
            lower.forEach((c, idx) => {
              if (/description|item|product/.test(c) && colMap.product === undefined)
                colMap.product = idx;
              if (/make|brand/.test(c) && colMap.brand === undefined)
                colMap.brand = idx;
              if (/model/.test(c) && colMap.modelNumber === undefined)
                colMap.modelNumber = idx;
              if (/qty|quantity/.test(c) && colMap.qty === undefined)
                colMap.qty = idx;
              if (/remark|note/.test(c) && colMap.notes === undefined)
                colMap.notes = idx;
            });
            break;
          }
        }

        // Fallback: assume first row is header
        if (headerRowIdx === -1) {
          headerRowIdx = 0;
          rows[0]?.forEach((c, idx) => {
            const lower = String(c ?? '').toLowerCase().trim();
            if (/description|item|product/.test(lower) && colMap.product === undefined)
              colMap.product = idx;
            if (/make|brand/.test(lower) && colMap.brand === undefined)
              colMap.brand = idx;
            if (/model/.test(lower) && colMap.modelNumber === undefined)
              colMap.modelNumber = idx;
            if (/qty|quantity/.test(lower) && colMap.qty === undefined)
              colMap.qty = idx;
            if (/remark|note/.test(lower) && colMap.notes === undefined)
              colMap.notes = idx;
          });
          // If still nothing, map col 0 = product
          if (colMap.product === undefined) colMap.product = 0;
        }

        const items: ParsedPRItem[] = [];
        let currentScope: ScopeName = 'General';

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.every((c) => !c || String(c).trim() === '')) continue;

          const firstCell = String(row[0] ?? '').trim();
          const qtyCell = colMap.qty !== undefined ? String(row[colMap.qty] ?? '').trim() : '';
          const hasQty = qtyCell !== '' && !isNaN(Number(qtyCell)) && Number(qtyCell) > 0;
          const otherCells = row.slice(1);
          const hasOtherContent = otherCells.some((c) => c && String(c).trim() !== '');

          // Section header: col A has text, no qty, no other meaningful content
          if (firstCell && !hasQty && !hasOtherContent) {
            currentScope = mapSectionToScope(firstCell);
            continue;
          }

          const productIdx = colMap.product ?? 0;
          const product = String(row[productIdx] ?? '').trim();
          if (!product) continue;

          const qty = hasQty ? Number(qtyCell) : 1;

          items.push({
            id: generateId(),
            product,
            brand: colMap.brand !== undefined ? String(row[colMap.brand] ?? '').trim() : '',
            modelNumber:
              colMap.modelNumber !== undefined
                ? String(row[colMap.modelNumber] ?? '').trim()
                : '',
            qty,
            scope: currentScope,
            notes:
              colMap.notes !== undefined ? String(row[colMap.notes] ?? '').trim() : '',
            rawRow: i,
            roomAllocations: [],
          });
        }

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── DWG / PDF Binary String Extractor ────────────────────────────────────────

const ROOM_KEYWORDS = [
  'BEDROOM', 'BATHROOM', 'KITCHEN', 'LIVING', 'DINING', 'LOUNGE', 'FOYER',
  'STUDY', 'LOBBY', 'TERRACE', 'BALCONY', 'STORE', 'STAFF', 'CORRIDOR',
  'PASSAGE', 'POWDER', 'UTILITY', 'LAUNDRY', 'MANDIR', 'WARDROBE',
];

const DEVICE_PATTERNS: [string, string][] = [
  ['Normal keypad', 'Keypad'],
  ['Camera', 'Camera'],
  ['Motion Sensor', 'Motion Sensor'],
  ['in wall speaker', 'Speaker'],
  ['indoor wi-fi', 'Access Point'],
  ['Bell push', 'Bell Push'],
];

const AV_BRANDS = ['SONOS', 'ANTHEM', 'MARTIN LOGAN', 'GALLO', 'BOSE', 'DENON', 'YAMAHA'];

function cleanMText(s: string): string {
  return s
    .replace(/\\p[^;]*;/g, '')
    .replace(/\\f[^;]*;/g, '')
    .replace(/\\H[\d.]+x;/g, '')
    .replace(/\\C\d+;/g, '')
    .replace(/\\c\d+;/g, '')
    .replace(/\\P/g, ' ')
    .replace(/[{}]/g, '')
    .trim();
}

async function parseDrawingFile(file: File): Promise<ParsedDWGData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bytes = new Uint8Array(e.target!.result as ArrayBuffer);

        // Extract all printable ASCII strings >= 5 chars
        const strings: string[] = [];
        let current = '';
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i];
          if (b >= 0x20 && b <= 0x7e) {
            current += String.fromCharCode(b);
          } else {
            if (current.length >= 5) strings.push(current);
            current = '';
          }
        }
        if (current.length >= 5) strings.push(current);

        const rooms = new Set<string>();
        const deviceCounts: Record<string, number> = {};
        const avSet = new Set<string>();

        for (const raw of strings) {
          const cleaned = cleanMText(raw);
          if (!cleaned) continue;

          // Bold text entity (Century Gothic font marker in DWG MTEXT)
          if (raw.includes('Century Gothic') && raw.includes('b1')) {
            const parts = raw.split(';');
            const text = cleanMText(parts[parts.length - 1]);
            if (text.length > 2) rooms.add(text);
          }

          // ALL CAPS room keywords
          if (cleaned.length > 4 && cleaned === cleaned.toUpperCase() && /^[A-Z\s]+$/.test(cleaned)) {
            const upper = cleaned.toUpperCase();
            if (ROOM_KEYWORDS.some((kw) => upper.includes(kw))) {
              rooms.add(cleaned);
            }
          }

          // Device block counts
          for (const [pattern, category] of DEVICE_PATTERNS) {
            if (cleaned.toLowerCase().includes(pattern.toLowerCase())) {
              deviceCounts[category] = (deviceCounts[category] || 0) + 1;
            }
          }

          // AV annotations
          const upper = cleaned.toUpperCase();
          if (AV_BRANDS.some((b) => upper.includes(b))) {
            avSet.add(cleaned);
          }
        }

        resolve({
          rooms: Array.from(rooms),
          deviceCounts,
          avAnnotations: Array.from(avSet),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Drop Zone component ───────────────────────────────────────────────────────

interface DropZoneProps {
  label: string;
  accept: string;
  acceptLabel: string;
  file: File | null;
  icon: React.ReactNode;
  onFile: (f: File) => void;
}

function DropZone({ label, accept, acceptLabel, file, icon, onFile }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl p-6 cursor-pointer transition-all"
      style={{
        border: `2px dashed ${file ? 'var(--color-accent)' : dragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
        background: file
          ? 'rgba(99,102,241,0.06)'
          : dragging
          ? 'rgba(99,102,241,0.04)'
          : 'var(--color-bg-input)',
        minHeight: '160px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {file ? (
        <>
          <CheckCircle2 size={28} style={{ color: 'var(--color-accent)' }} />
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {file.name}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB · Click to change
            </p>
          </div>
        </>
      ) : (
        <>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            {icon}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Drop file here or click to browse
            </p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-accent)' }}>
              {acceptLabel}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Stage indicator ───────────────────────────────────────────────────────────

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
                style={{
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className="w-8 h-px mx-2"
                style={{ background: done ? 'var(--color-accent)' : 'var(--color-border)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ImportStage1Page({ onContinue, onBack }: ImportStage1PageProps) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [prFile, setPrFile] = useState<File | null>(null);
  const [dwgFile, setDwgFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = projectName.trim() && prFile && dwgFile;

  async function handleParse() {
    if (!canContinue) return;
    setParsing(true);
    setError(null);

    try {
      const [prItems, dwgData] = await Promise.all([
        parsePRExcel(prFile!),
        parseDrawingFile(dwgFile!),
      ]);

      const now = new Date().toISOString();
      const project: Project = {
        id: generateId(),
        name: projectName.trim(),
        client: clientName.trim(),
        location: '',
        projectCode: '',
        createdAt: now,
        updatedAt: now,
        rooms: [],
        lineItems: [],
      };

      const draft: ImportDraft = { project, prItems, dwgData, stage: 2 };
      localStorage.setItem(IMPORT_DRAFT_KEY, JSON.stringify(draft));
      onContinue();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Parse error: ${err.message}`
          : 'Failed to parse files. Check that the Excel file is a valid .xlsx and try again.',
      );
    } finally {
      setParsing(false);
    }
  }

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
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <ArrowLeft size={14} />
              Projects
            </button>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Import from PR + Drawing
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Stage indicator */}
        <div className="flex justify-center">
          <StageIndicator current={1} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 flex flex-col gap-7"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Upload Documents
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Provide the Purchase Request spreadsheet and the System Drawing file. We'll extract
              products, rooms, and device counts automatically.
            </p>
          </div>

          {/* Project details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Project Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Villa Arjun — Smart Home"
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Mr. Sharma"
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{
                  background: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
            </div>
          </div>

          {/* Drop zones */}
          <div className="flex gap-4">
            <DropZone
              label="Purchase Request"
              accept=".xlsx"
              acceptLabel=".xlsx"
              file={prFile}
              icon={<FileSpreadsheet size={22} style={{ color: 'var(--color-accent)' }} />}
              onFile={setPrFile}
            />
            <DropZone
              label="System Drawing"
              accept=".dwg,.pdf"
              acceptLabel=".dwg · .pdf"
              file={dwgFile}
              icon={<FileText size={22} style={{ color: 'var(--color-accent)' }} />}
              onFile={setDwgFile}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--color-danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'var(--color-bg-input)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <button
              onClick={handleParse}
              disabled={!canContinue || parsing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: canContinue && !parsing ? 'var(--color-accent)' : 'var(--color-bg-input)',
                color: canContinue && !parsing ? '#fff' : 'var(--color-text-muted)',
                cursor: canContinue && !parsing ? 'pointer' : 'not-allowed',
              }}
            >
              {parsing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Parsing…
                </>
              ) : (
                <>
                  Parse & Continue
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help text */}
        <div
          className="rounded-xl p-4 text-xs"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <p className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            What gets extracted?
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>PR (.xlsx)</strong> — Product names, brands, models, quantities, and scope
              sections from the spreadsheet
            </li>
            <li>
              <strong>Drawing (.dwg / .pdf)</strong> — Room labels, device block counts (keypads,
              cameras, APs), and AV equipment annotations
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
