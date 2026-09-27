import type { AssessmentDraft } from '../rubric/types';
import { isAssessmentDraft } from './records';

export const WORKING_DRAFT_KEY = 'ege-working-draft-v1';

export interface WorkingDraft {
  draft: AssessmentDraft;
  label: string;
  note: string;
  recordId: string | null;
  createdAt: string | null;
}

function isWorkingDraft(value: unknown): value is WorkingDraft {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return Object.keys(item).length === 5
    && isAssessmentDraft(item.draft)
    && typeof item.label === 'string' && item.label.length <= 100
    && typeof item.note === 'string' && item.note.length <= 1000
    && (item.recordId === null || (typeof item.recordId === 'string' && item.recordId.length > 0))
    && (item.createdAt === null || (typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))))
    && (item.recordId === null) === (item.createdAt === null);
}

export function loadWorkingDraft(storage: Storage): WorkingDraft | null {
  const raw = storage.getItem(WORKING_DRAFT_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isWorkingDraft(parsed)) return parsed;
  } catch { /* Report the same error for malformed JSON and invalid data. */ }
  throw new Error('Автосохранённый черновик повреждён.');
}

export function saveWorkingDraft(storage: Storage, working: WorkingDraft): void {
  if (!isWorkingDraft(working)) throw new Error('Черновик содержит недопустимые данные.');
  storage.setItem(WORKING_DRAFT_KEY, JSON.stringify(working));
}

export function clearWorkingDraft(storage: Storage): void {
  storage.removeItem(WORKING_DRAFT_KEY);
}
