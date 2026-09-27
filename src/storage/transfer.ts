import type { AssessmentRecord } from '../rubric/types';
import { validateRecords } from './records';

export function exportRecords(records: AssessmentRecord[]): string {
  validateRecords(records);
  return JSON.stringify({ formatVersion: 1, records }, null, 2);
}

export function importRecords(json: string, existing: AssessmentRecord[]): {
  records: AssessmentRecord[]; added: number; skipped: number;
} {
  let parsed: unknown;
  try { parsed = JSON.parse(json); }
  catch { throw new Error('Файл не содержит корректный JSON.'); }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)
    || !('formatVersion' in parsed) || parsed.formatVersion !== 1 || !('records' in parsed)) {
    throw new Error('Неподдерживаемый формат файла проверок.');
  }
  const incoming = validateRecords(parsed.records);
  validateRecords(existing);
  const known = new Set(existing.map((record) => record.id));
  const records = [...existing];
  let added = 0;
  let skipped = 0;
  for (const record of incoming) {
    if (known.has(record.id)) skipped += 1;
    else { records.push(record); known.add(record.id); added += 1; }
  }
  return { records, added, skipped };
}
