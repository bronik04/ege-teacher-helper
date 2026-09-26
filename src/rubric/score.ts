import type { AssessmentDraft, ScoreResult } from './types';
import { scoreWritten28, scoreWritten29 } from './score-writing';

export function calculateAssessment(draft: AssessmentDraft): ScoreResult {
  if (draft.rubricYear !== 2026) throw new Error('Поддерживаются только критерии ФИПИ-2026.');
  switch (draft.taskId) {
    case 'writing28': return scoreWritten28(draft);
    case 'writing29': return scoreWritten29(draft);
    default: throw new Error(`Расчёт задания ${draft.taskId} пока не добавлен.`);
  }
}
