import { describe, expect, it } from 'vitest';
import { filterRecords } from './filter-records';
import type { AssessmentRecord, TaskId } from '../rubric/types';

function record(id: string, label: string, taskId: TaskId, complete: boolean): AssessmentRecord {
  return {
    id, label, note: '', createdAt: '2026-09-27T10:00:00.000Z', updatedAt: '2026-09-27T10:00:00.000Z',
    draft: taskId === 'speaking1'
      ? { taskId, rubricYear: 2026, noAnswer: false, aspects: [],
        questionAccepted: complete ? [true, true, true, true, true] : [true, null, null, null, null] }
      : { taskId, rubricYear: 2026, noAnswer: complete,
        aspects: taskId === 'writing28' ? Array(6).fill(null) : Array(5).fill(null) },
  };
}

const records = [
  record('a', 'Анна', 'speaking1', true),
  record('b', 'Аня', 'speaking1', false),
  record('c', 'Борис', 'writing28', true),
  record('d', '', 'writing29', false),
];

describe('saved work filters', () => {
  it('combines a case-insensitive label search with task and status', () => {
    expect(filterRecords(records, { query: '  анН ', taskId: 'speaking1', status: 'complete' })
      .map((item) => item.id)).toEqual(['a']);
  });

  it('treats a zero-point finished work as complete', () => {
    expect(filterRecords(records, { query: '', taskId: 'all', status: 'complete' })
      .map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('can find an unlabeled draft by its displayed name', () => {
    expect(filterRecords(records, { query: 'без метки', taskId: 'all', status: 'draft' })
      .map((item) => item.id)).toEqual(['d']);
  });
});
