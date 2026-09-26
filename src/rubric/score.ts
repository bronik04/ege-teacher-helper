import type { AssessmentDraft, ScoreResult } from './types';
import { scoreWritten28, scoreWritten29 } from './score-writing';
import { scoreSpeaking1, scoreSpeaking2, scoreSpeaking3 } from './score-speaking';

export function calculateAssessment(draft: AssessmentDraft): ScoreResult {
  if (draft.rubricYear !== 2026) throw new Error('Поддерживаются только критерии ФИПИ-2026.');
  switch (draft.taskId) {
    case 'writing28': return scoreWritten28(draft);
    case 'writing29': return scoreWritten29(draft);
    case 'speaking1': return scoreSpeaking1(draft);
    case 'speaking2': return scoreSpeaking2(draft);
    case 'speaking3': return scoreSpeaking3(draft);
  }
}
