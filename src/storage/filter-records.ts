import type { AssessmentRecord, TaskId } from '../rubric/types';
import { calculateAssessment } from '../rubric/score';

export interface RecordFilters {
  query: string;
  taskId: TaskId | 'all';
  status: 'all' | 'complete' | 'draft';
}

export function filterRecords(records: AssessmentRecord[], filters: RecordFilters): AssessmentRecord[] {
  const query = filters.query.trim().toLocaleLowerCase('ru-RU');
  return records.filter((record) => {
    if (query && !(record.label || 'Без метки').toLocaleLowerCase('ru-RU').includes(query)) return false;
    if (filters.taskId !== 'all' && record.draft.taskId !== filters.taskId) return false;
    if (filters.status === 'all') return true;
    const complete = calculateAssessment(record.draft).finalTotal !== null;
    return filters.status === 'complete' ? complete : !complete;
  });
}
