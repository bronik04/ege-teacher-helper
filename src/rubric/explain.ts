import type { AssessmentDraft, CriterionKey, ScoreResult } from './types';

function countWord(value: number, one: string, few: string, many: string): string {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  const last = value % 10;
  return last === 1 ? one : last >= 2 && last <= 4 ? few : many;
}

function withExpert(draft: AssessmentDraft, key: 'content' | 'organization' | 'language' | 'script', evidence: string): string {
  return draft.expertLevels?.[key] === undefined ? evidence : `${evidence} Балл выбран экспертом по шкале ФИПИ.`;
}

export function explainCriterion(draft: AssessmentDraft, result: ScoreResult, key: CriterionKey): string | null {
  if (result.criteria[key] === null || result.criteria[key] === undefined) return null;
  if (draft.noAnswer) return 'Ответ отсутствует.';
  if (key === 'questions') {
    return `Засчитано ${draft.questionAccepted?.filter((accepted) => accepted === true).length ?? 0} из 5 вопросов.`;
  }
  if (key !== 'content' && result.criteria.content === 0) {
    return 'Обнулено вместе с заданием: К1 = 0.';
  }
  if (key === 'content' && result.criteria.content === 0) {
    const blockingReason = result.reasons.find((reason) => reason.startsWith('Менее ') || reason.startsWith('Установлено текстуальное совпадение'));
    if (blockingReason) return blockingReason;
    if (draft.taskId.startsWith('speaking') && draft.phraseCount != null && draft.phraseCount <= 5) {
      return `${draft.phraseCount} ${countWord(draft.phraseCount, 'фраза', 'фразы', 'фраз')}: К1 = 0.`;
    }
  }
  if (key === 'content' && draft.taskId.startsWith('writing') && draft.characterCount != null) {
    const full = draft.aspects.filter((mark) => mark === '+').length;
    const partial = draft.aspects.filter((mark) => mark === '±').length;
    const absent = draft.aspects.filter((mark) => mark === '−').length;
    return withExpert(draft, key, `Аспекты: +${full}, ±${partial}, −${absent}; ${draft.characterCount} ${countWord(draft.characterCount, 'знак', 'знака', 'знаков')}.`);
  }
  if (key === 'content' && draft.taskId.startsWith('speaking') && draft.phraseCount != null) {
    const full = draft.aspects.filter((mark) => mark === '+').length;
    const partial = draft.aspects.filter((mark) => mark === '±').length;
    const absent = draft.aspects.filter((mark) => mark === '−').length;
    return withExpert(draft, key, `Аспекты: +${full}, ±${partial}, −${absent}; ${draft.phraseCount} ${countWord(draft.phraseCount, 'фраза', 'фразы', 'фраз')}.`);
  }
  if (key === 'organization' && draft.taskId.startsWith('writing') && draft.organizationErrors != null) {
    const errors = draft.organizationErrors;
    return withExpert(draft, key, `${errors} ${countWord(errors, 'ошибка', 'ошибки', 'ошибок')} в организации.`);
  }
  if (key === 'language' && draft.taskId.startsWith('writing') && draft.lexicalGrammarErrors != null) {
    return withExpert(draft, key, `Лексико-грамматических ошибок: ${draft.lexicalGrammarErrors}.`);
  }
  if (key === 'script' && draft.taskId.startsWith('writing') && draft.hanziErrors != null && draft.punctuationErrors != null) {
    return withExpert(draft, key, `Иероглифических ошибок: ${draft.hanziErrors}; пунктуационных: ${draft.punctuationErrors}.`);
  }
  if (key === 'organization' && draft.taskId === 'speaking2') {
    if ([draft.hasIntroduction, draft.hasConclusion, draft.isLogical, draft.linksAdequate].some((value) => value == null)) {
      return draft.expertLevels?.organization !== undefined ? 'Балл выбран экспертом по шкале ФИПИ.' : null;
    }
    const absent = [
      draft.hasIntroduction === false && 'вступления',
      draft.hasConclusion === false && 'заключения',
      draft.isLogical === false && 'логики',
      draft.linksAdequate === false && 'средств связи',
    ].filter(Boolean);
    const evidence = absent.length ? `Нет ${absent.join(', ')}.` : 'Вступление, заключение, логика и связи отмечены.';
    return withExpert(draft, key, evidence);
  }
  if (key === 'organization' && draft.taskId === 'speaking3' && draft.organizationErrors != null) {
    if (draft.hasIntroduction == null || draft.hasConclusion == null) {
      return draft.expertLevels?.organization !== undefined ? 'Балл выбран экспертом по шкале ФИПИ.' : null;
    }
    const intro = draft.hasIntroduction ? 'вступление есть' : 'нет вступления';
    const conclusion = draft.hasConclusion ? 'заключение есть' : 'нет заключения';
    const structure = draft.hasIntroduction && draft.hasConclusion ? 'вступление и заключение есть' : `${intro}, ${conclusion}`;
    return withExpert(draft, key, `${draft.organizationErrors} ${countWord(draft.organizationErrors, 'ошибка', 'ошибки', 'ошибок')} в организации; ${structure}.`);
  }
  if (key === 'language' && draft.taskId === 'speaking2') {
    if (draft.lexicalGrammarErrors == null || draft.phoneticErrors == null) {
      return draft.expertLevels?.language !== undefined ? 'Балл выбран экспертом по шкале ФИПИ.' : null;
    }
    return withExpert(draft, key, `Лексико-грамматических ошибок: ${draft.lexicalGrammarErrors}; фонетических: ${draft.phoneticErrors}.`);
  }
  if (key === 'language' && draft.taskId === 'speaking3') {
    if ([draft.lexicalGrammarErrors, draft.grossLexicalGrammarErrors, draft.phoneticErrors, draft.grossPhoneticErrors].some((value) => value == null)) {
      return draft.expertLevels?.language !== undefined ? 'Балл выбран экспертом по шкале ФИПИ.' : null;
    }
    return withExpert(draft, key, `Лексико-грамматических ошибок: ${draft.lexicalGrammarErrors} (грубых: ${draft.grossLexicalGrammarErrors}); фонетических: ${draft.phoneticErrors} (грубых: ${draft.grossPhoneticErrors}).`);
  }
  if (draft.expertLevels?.[key] !== undefined) return 'Балл выбран экспертом по шкале ФИПИ.';
  return null;
}
