import { describe, expect, it } from 'vitest';
import { explainCriterion } from './explain';
import { calculateAssessment } from './score';
import type { AssessmentDraft } from './types';

const letter = (changes: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  taskId: 'writing28', rubricYear: 2026, noAnswer: false,
  aspects: ['+', '+', '+', '+', '+', '+'], characterCount: 170,
  organizationErrors: 0, lexicalGrammarErrors: 0, hanziErrors: 0, punctuationErrors: 0,
  ...changes,
});

describe('score explanations', () => {
  it('attributes the other zero criteria to a zero in K1', () => {
    const draft = letter({ aspects: ['−', '−', '−', '+', '+', '+'] });
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'organization')).toBe('Обнулено вместе с заданием: К1 = 0.');
    expect(explainCriterion(draft, result, 'language')).toBe('Обнулено вместе с заданием: К1 = 0.');
  });

  it('shows aspect marks and length behind a writing content score', () => {
    const draft = letter({ aspects: ['+', '±', '−', '+', '+', '+'] });
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'content')).toBe('Аспекты: +4, ±1, −1; 170 знаков.');
  });

  it('labels a manually selected criterion score as an expert decision', () => {
    const draft = letter({ organizationErrors: 2, expertLevels: { organization: 0 } });
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'organization')).toBe('2 ошибки в организации. Балл выбран экспертом по шкале ФИПИ.');
  });

  it('shows language and script error counts separately', () => {
    const draft = letter({ lexicalGrammarErrors: 3, hanziErrors: 2, punctuationErrors: 1 });
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'language')).toBe('Лексико-грамматических ошибок: 3.');
    expect(explainCriterion(draft, result, 'script')).toBe('Иероглифических ошибок: 2; пунктуационных: 1.');
  });

  it('explains the spoken dialogue through accepted questions', () => {
    const draft: AssessmentDraft = { taskId: 'speaking1', rubricYear: 2026, noAnswer: false,
      aspects: [], questionAccepted: [true, false, true, false, false] };
    expect(explainCriterion(draft, calculateAssessment(draft), 'questions')).toBe('Засчитано 2 из 5 вопросов.');
  });

  it('explains content, organization and language in spoken task 2', () => {
    const draft: AssessmentDraft = { taskId: 'speaking2', rubricYear: 2026, noAnswer: false,
      aspects: ['+', '+', '+', '+', '−'], phraseCount: 8,
      hasIntroduction: true, hasConclusion: false, isLogical: true, linksAdequate: true,
      lexicalGrammarErrors: 3, phoneticErrors: 1 };
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'content')).toBe('Аспекты: +4, ±0, −1; 8 фраз.');
    expect(explainCriterion(draft, result, 'organization')).toBe('Нет заключения.');
    expect(explainCriterion(draft, result, 'language')).toBe('Лексико-грамматических ошибок: 3; фонетических: 1.');
  });

  it('explains organization and gross language errors in spoken task 3', () => {
    const draft: AssessmentDraft = { taskId: 'speaking3', rubricYear: 2026, noAnswer: false,
      aspects: ['+', '+', '+', '+'], phraseCount: 12,
      hasIntroduction: true, hasConclusion: true, organizationErrors: 2,
      lexicalGrammarErrors: 3, grossLexicalGrammarErrors: 1,
      phoneticErrors: 2, grossPhoneticErrors: 1 };
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'organization')).toBe('2 ошибки в организации; вступление и заключение есть.');
    expect(explainCriterion(draft, result, 'language')).toBe('Лексико-грамматических ошибок: 3 (грубых: 1); фонетических: 2 (грубых: 1).');
  });

  it('explains a short written answer before the aspect marks', () => {
    const draft = letter({ characterCount: 120 });
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'content')).toBe('Менее 135 знаков: ответ не подлежит проверке.');
  });

  it('labels expert content and language levels in written task 29', () => {
    const draft = letter({ taskId: 'writing29', aspects: ['+', '+', '+', '+', '+'], plagiarismOver30: false,
      expertLevels: { content: 2, language: 3 } });
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'content')).toBe('Аспекты: +5, ±0, −0; 170 знаков. Балл выбран экспертом по шкале ФИПИ.');
    expect(explainCriterion(draft, result, 'language')).toBe('Лексико-грамматических ошибок: 0. Балл выбран экспертом по шкале ФИПИ.');
  });

  it('does not explain a pending criterion', () => {
    const draft = letter({ organizationErrors: null });
    expect(explainCriterion(draft, calculateAssessment(draft), 'organization')).toBeNull();
  });

  it('explains expert scores without inventing missing error counts', () => {
    const draft = letter({ organizationErrors: null, expertLevels: { organization: 1 } });
    expect(explainCriterion(draft, calculateAssessment(draft), 'organization')).toBe('Балл выбран экспертом по шкале ФИПИ.');
  });

  it('identifies the phrase limit when a spoken answer is zeroed', () => {
    const draft: AssessmentDraft = { taskId: 'speaking2', rubricYear: 2026, noAnswer: false,
      aspects: [null, null, null, null, null], phraseCount: 5 };
    const result = calculateAssessment(draft);
    expect(explainCriterion(draft, result, 'content')).toBe('5 фраз: К1 = 0.');
  });

  it('identifies the plagiarism reason before the aspect marks', () => {
    const draft = letter({ taskId: 'writing29', aspects: ['+', '+', '+', '+', '+'], plagiarismOver30: true });
    expect(explainCriterion(draft, calculateAssessment(draft), 'content')).toBe('Установлено текстуальное совпадение свыше 30%.');
  });
});
