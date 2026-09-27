import { describe, expect, it } from 'vitest';
import type { AssessmentRecord } from '../rubric/types';
import { exportRecords, importRecords } from './transfer';

const base: AssessmentRecord = {
  id: 'a', createdAt: '2026-09-26T12:00:00.000Z', updatedAt: '2026-09-26T12:00:00.000Z',
  label: 'Ученик А', note: '',
  draft: { taskId: 'writing28', rubricYear: 2026, noAnswer: false, aspects: ['+', '+', '+', '+', '+', '+'],
    characterCount: 185, organizationErrors: 0, lexicalGrammarErrors: 0, hanziErrors: 0, punctuationErrors: 0 },
};
const other: AssessmentRecord = {
  ...base, id: 'b', label: 'Ученик Б',
  draft: { taskId: 'speaking1', rubricYear: 2026, noAnswer: false, aspects: [],
    questionAccepted: [true, false, true, true, null] },
};

describe('assessment JSON transfer', () => {
  it('round-trips records for multiple tasks without adding computed scores', () => {
    const json = exportRecords([base, other]);
    expect(JSON.parse(json).formatVersion).toBe(1);
    expect(json).not.toContain('finalTotal');
    const result = importRecords(json, []);
    expect(result).toEqual({ records: [base, other], added: 2, skipped: 0 });
  });

  it('skips duplicate IDs and preserves existing values', () => {
    const existing = [{ ...base, label: 'Существующая работа' }];
    const result = importRecords(exportRecords([base, other]), existing);
    expect(result).toEqual({ records: [...existing, other], added: 1, skipped: 1 });
    expect(existing).toHaveLength(1);
  });

  it('rejects unsupported format and malformed JSON', () => {
    expect(() => importRecords('{broken', [base])).toThrow();
    expect(() => importRecords(JSON.stringify({ formatVersion: 2, records: [] }), [base])).toThrow();
  });

  it('rejects invalid marks and out-of-range expert scores', () => {
    const badMark = structuredClone(base);
    badMark.draft.aspects[0] = 'unknown' as never;
    expect(() => importRecords(JSON.stringify({ formatVersion: 1, records: [badMark] }), [])).toThrow();
    const badExpert = structuredClone(base);
    badExpert.draft.expertLevels = { content: 99 };
    expect(() => importRecords(JSON.stringify({ formatVersion: 1, records: [badExpert] }), [])).toThrow();
  });

  it('rejects a mixed valid and invalid file without changing existing records', () => {
    const existing = [base];
    const bad = structuredClone(other);
    bad.draft.questionAccepted = [true, null] as never;
    expect(() => importRecords(JSON.stringify({ formatVersion: 1, records: [other, bad] }), existing)).toThrow();
    expect(existing).toEqual([base]);
  });

  it('rejects duplicate IDs within an imported file', () => {
    expect(() => importRecords(JSON.stringify({ formatVersion: 1, records: [base, base] }), [])).toThrow();
  });
});
