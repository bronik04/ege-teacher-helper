import { FIPI_2026 } from '../rubric/fipi2026';
import type { AssessmentDraft, AssessmentRecord, AspectMark, TaskId } from '../rubric/types';

export const STORAGE_KEY = 'ege-assessments-v1';
const TASK_IDS = Object.keys(FIPI_2026) as TaskId[];
const MARKS: AspectMark[] = ['+', '±', '−', null];
const COUNTS: (keyof AssessmentDraft)[] = [
  'characterCount', 'phraseCount', 'organizationErrors', 'lexicalGrammarErrors',
  'hanziErrors', 'punctuationErrors', 'phoneticErrors',
  'grossLexicalGrammarErrors', 'grossPhoneticErrors',
];
const FLAGS: (keyof AssessmentDraft)[] = [
  'hasIntroduction', 'hasConclusion', 'isLogical', 'linksAdequate',
  'assessedFragmentConfirmed', 'plagiarismOver30',
];

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validDraft(value: unknown): value is AssessmentDraft {
  if (!object(value) || !TASK_IDS.includes(value.taskId as TaskId) || value.rubricYear !== 2026
    || typeof value.noAnswer !== 'boolean' || !Array.isArray(value.aspects)) return false;
  const task = FIPI_2026[value.taskId as TaskId];
  if (value.aspects.length !== task.aspects.length || !value.aspects.every((mark) => MARKS.includes(mark))) return false;
  if (value.questionAccepted !== undefined && (!Array.isArray(value.questionAccepted)
    || value.questionAccepted.length !== 5
    || !value.questionAccepted.every((answer: unknown) => answer === null || typeof answer === 'boolean'))) return false;
  if (task.id === 'speaking1' && !Array.isArray(value.questionAccepted)) return false;
  for (const key of COUNTS) {
    const field = value[key];
    if (field !== undefined && field !== null && (!Number.isSafeInteger(field) || (field as number) < 0)) return false;
  }
  for (const key of FLAGS) {
    const field = value[key];
    if (field !== undefined && field !== null && typeof field !== 'boolean') return false;
  }
  if (value.expertLevels !== undefined) {
    if (!object(value.expertLevels)) return false;
    for (const [key, level] of Object.entries(value.expertLevels)) {
      const criterion = task.criteria.find((item) => item.id === key);
      if (!criterion || !Number.isInteger(level) || (level as number) < 0 || (level as number) > criterion.maxScore) return false;
    }
  }
  return true;
}

export function isAssessmentRecord(value: unknown): value is AssessmentRecord {
  if (!object(value)) return false;
  return typeof value.id === 'string' && value.id.length > 0
    && typeof value.createdAt === 'string' && !Number.isNaN(Date.parse(value.createdAt))
    && typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt))
    && typeof value.label === 'string' && typeof value.note === 'string'
    && validDraft(value.draft);
}

export function validateRecords(value: unknown): AssessmentRecord[] {
  if (!Array.isArray(value) || !value.every(isAssessmentRecord)) {
    throw new Error('Данные проверок повреждены или имеют неподдерживаемый формат.');
  }
  const ids = value.map((record) => record.id);
  if (new Set(ids).size !== ids.length) throw new Error('В данных проверок повторяются идентификаторы.');
  return value;
}

export function loadRecords(storage: Storage): AssessmentRecord[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try { return validateRecords(JSON.parse(raw)); }
  catch (error) { throw new Error('Не удалось прочитать сохранённые работы.', { cause: error }); }
}

export function writeRecords(storage: Storage, records: AssessmentRecord[]): void {
  validateRecords(records);
  storage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function saveRecord(storage: Storage, record: AssessmentRecord): void {
  if (!isAssessmentRecord(record)) throw new Error('Проверка содержит недопустимые данные.');
  const records = loadRecords(storage);
  const index = records.findIndex((item) => item.id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
  writeRecords(storage, records);
}

export function deleteRecord(storage: Storage, id: string): void {
  writeRecords(storage, loadRecords(storage).filter((record) => record.id !== id));
}
