// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { calculateAssessment } from '../rubric/score';
import type { AssessmentRecord } from '../rubric/types';
import { deleteRecord, loadRecords, saveRecord } from './records';

const example: AssessmentRecord = {
  id: 'record-1', createdAt: '2026-09-26T12:00:00.000Z', updatedAt: '2026-09-26T12:00:00.000Z',
  label: 'Ученик А', note: 'Проверка устного ответа',
  draft: { taskId: 'speaking1', rubricYear: 2026, noAnswer: false, aspects: [],
    questionAccepted: [true, true, true, true, true] },
};

beforeEach(() => window.localStorage.clear());

describe('browser assessment records', () => {
  it('stores raw marks and recalculates the total after reopening', () => {
    saveRecord(window.localStorage, example);
    const [reopened] = loadRecords(window.localStorage);
    expect(reopened.draft.rubricYear).toBe(2026);
    expect(reopened.draft.questionAccepted).toEqual([true, true, true, true, true]);
    expect(calculateAssessment(reopened.draft).finalTotal).toBe(5);
    saveRecord(window.localStorage, {
      ...reopened, updatedAt: '2026-09-26T12:05:00.000Z',
      draft: { ...reopened.draft, questionAccepted: [false, true, true, true, true] },
    });
    expect(loadRecords(window.localStorage)).toHaveLength(1);
    expect(calculateAssessment(loadRecords(window.localStorage)[0].draft).finalTotal).toBe(4);
  });

  it('removes only the selected record', () => {
    saveRecord(window.localStorage, example);
    saveRecord(window.localStorage, { ...example, id: 'record-2' });
    deleteRecord(window.localStorage, 'record-1');
    expect(loadRecords(window.localStorage).map((record) => record.id)).toEqual(['record-2']);
  });

  it('reports malformed stored data without overwriting it', () => {
    window.localStorage.setItem('ege-assessments-v1', '{broken');
    expect(() => loadRecords(window.localStorage)).toThrow();
    expect(window.localStorage.getItem('ege-assessments-v1')).toBe('{broken');
  });

  it('reports a storage write failure without changing the current record', () => {
    saveRecord(window.localStorage, example);
    const failingStorage = {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: () => { throw new Error('quota exceeded'); },
    } as unknown as Storage;
    expect(() => saveRecord(failingStorage, { ...example, id: 'record-2' })).toThrow('quota exceeded');
    expect(loadRecords(window.localStorage)).toHaveLength(1);
  });

  it('keeps incomplete records as drafts rather than a completed score', () => {
    saveRecord(window.localStorage, {
      ...example, draft: { ...example.draft, questionAccepted: [true, null, true, true, true] },
    });
    expect(calculateAssessment(loadRecords(window.localStorage)[0].draft).finalTotal).toBeNull();
  });
});
