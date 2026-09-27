import type { RubricTask } from './types';

export function criterionCode(task: RubricTask, index: number): string | null {
  return task.id === 'speaking1' ? null : `К${index + 1}`;
}
