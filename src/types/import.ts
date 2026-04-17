import type { ScopeName, Project } from './index';

export interface ParsedPRItem {
  id: string;           // generated for stage-2 tracking
  product: string;
  brand: string;
  modelNumber: string;
  qty: number;
  scope: ScopeName;
  notes: string;
  rawRow: number;
  roomAllocations: { roomId: string; qty: number }[];
}

export interface ParsedDWGData {
  rooms: string[];
  deviceCounts: Record<string, number>;
  avAnnotations: string[];
}

export interface ImportDraft {
  project: Project;
  prItems: ParsedPRItem[];
  dwgData: ParsedDWGData;
  stage: number;
}

export const IMPORT_DRAFT_KEY = 'boq_import_draft';
