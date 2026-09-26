import type { AssessmentDraft, CriterionKey, ScoreResult } from './types';

const WRITING_KEYS: CriterionKey[] = ['content', 'organization', 'language', 'script'];

function count(value: number | null | undefined): number | null {
  return Number.isSafeInteger(value) && value! >= 0 ? value! : null;
}

function expertLevel(draft: AssessmentDraft, key: Exclude<CriterionKey, 'questions'>, max: number): number | null {
  const value = draft.expertLevels?.[key];
  return value !== undefined && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
}

function zero(reason: string): ScoreResult {
  return {
    criteria: { content: 0, organization: 0, language: 0, script: 0 },
    provisionalTotal: 0, finalTotal: 0, missing: [], reasons: [reason],
  };
}

function assemble(criteria: ScoreResult['criteria'], missing: string[], reasons: string[]): ScoreResult {
  const provisionalTotal = WRITING_KEYS.reduce((sum, key) => sum + (criteria[key] ?? 0), 0);
  return {
    criteria, provisionalTotal,
    finalTotal: missing.length || WRITING_KEYS.some((key) => criteria[key] === null) ? null : provisionalTotal,
    missing, reasons,
  };
}

function aspectCounts(draft: AssessmentDraft, required: number, missing: string[]): { absent: number; partial: number } | null {
  if (draft.aspects.length !== required || draft.aspects.some((mark) => mark === null)) {
    missing.push('Оцените все аспекты содержания.');
    return null;
  }
  return {
    absent: draft.aspects.filter((mark) => mark === '−').length,
    partial: draft.aspects.filter((mark) => mark === '±').length,
  };
}

function lengthCheck(draft: AssessmentDraft, minimum: number, ceiling: number, fragment: number,
  missing: string[], reasons: string[]): 'short' | 'ok' | 'missing' {
  const length = count(draft.characterCount);
  if (length === null) {
    missing.push('Укажите число знаков.');
    return 'missing';
  }
  if (length < minimum) return 'short';
  if (length > ceiling) {
    reasons.push(`При превышении объёма оцениваются только первые ${fragment} знаков.`);
    if (draft.assessedFragmentConfirmed !== true) {
      missing.push(`Подтвердите оценивание только первых ${fragment} знаков.`);
    }
  }
  return 'ok';
}

function organization(errors: number | null | undefined, max: 2 | 3, missing: string[]): number | null {
  const n = count(errors);
  if (n === null) {
    missing.push('Укажите число ошибок в организации.');
    return null;
  }
  if (max === 2) return n <= 1 ? 2 : n <= 3 ? 1 : 0;
  return n === 0 ? 3 : n <= 2 ? 2 : n <= 4 ? 1 : 0;
}

function language(draft: AssessmentDraft, max: 2 | 3, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'language', max);
  if (override !== null) {
    reasons.push('Уровень лексико-грамматического оформления уточнён экспертом по шкале ФИПИ.');
    return override;
  }
  const n = count(draft.lexicalGrammarErrors);
  if (n === null) {
    missing.push('Укажите число лексико-грамматических ошибок.');
    return null;
  }
  if (max === 2) return n <= 2 ? 2 : n <= 4 ? 1 : 0;
  return n <= 1 ? 3 : n <= 3 ? 2 : n === 4 ? 1 : 0;
}

function script28(draft: AssessmentDraft, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'script', 2);
  if (override !== null) {
    reasons.push('Уровень иероглифики уточнён экспертом по шкале ФИПИ.');
    return override;
  }
  const hanzi = count(draft.hanziErrors);
  const punctuation = count(draft.punctuationErrors);
  if (hanzi === null || punctuation === null) {
    missing.push('Укажите число иероглифических и пунктуационных ошибок.');
    return null;
  }
  if (hanzi <= 2 && punctuation <= 2) return 2;
  return hanzi + punctuation <= 6 ? 1 : 0;
}

function script29(draft: AssessmentDraft, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'script', 3);
  if (override !== null) {
    reasons.push('Уровень иероглифики уточнён экспертом по шкале ФИПИ.');
    return override;
  }
  const hanzi = count(draft.hanziErrors);
  const punctuation = count(draft.punctuationErrors);
  if (hanzi === null || punctuation === null) {
    missing.push('Укажите число иероглифических и пунктуационных ошибок.');
    return null;
  }
  if (hanzi === 0 && punctuation === 0) return 3;
  if (hanzi <= 2 && punctuation <= 2) return 2;
  if (hanzi <= 4 && punctuation <= 4) return 1;
  if (hanzi >= 5 && punctuation >= 5) return 0;
  missing.push('Выберите уровень иероглифики для смешанного числа ошибок.');
  return null;
}

export function scoreWritten28(draft: AssessmentDraft): ScoreResult {
  if (draft.noAnswer) return zero('Ответ на задание отсутствует.');
  const missing: string[] = [];
  const reasons: string[] = [];
  const length = lengthCheck(draft, 135, 209, 190, missing, reasons);
  if (length === 'short') return zero('Менее 135 знаков: ответ не подлежит проверке.');
  const aspects = aspectCounts(draft, 6, missing);
  let content: number | null = null;
  if (aspects) {
    content = aspects.absent >= 3 || aspects.partial >= 5 ? 0
      : aspects.absent === 0 && aspects.partial <= 1 ? 2 : 1;
    const override = expertLevel(draft, 'content', 2);
    if (override !== null) {
      content = override;
      reasons.push('Балл за содержание уточнён экспертом по шкале ФИПИ.');
    }
  }
  if (content === 0) return zero('Ноль за решение коммуникативной задачи обнуляет всё задание.');
  const criteria = {
    content,
    organization: organization(draft.organizationErrors, 2, missing),
    language: language(draft, 2, missing, reasons),
    script: script28(draft, missing, reasons),
  };
  return assemble(criteria, missing, reasons);
}

export function scoreWritten29(draft: AssessmentDraft): ScoreResult {
  if (draft.noAnswer) return zero('Ответ на задание отсутствует.');
  const missing: string[] = [];
  const reasons: string[] = [];
  const length = lengthCheck(draft, 144, 220, 200, missing, reasons);
  if (length === 'short') return zero('Менее 144 знаков: ответ не подлежит проверке.');
  if (draft.plagiarismOver30 === true) return zero('Установлено текстуальное совпадение свыше 30%.');
  if (draft.plagiarismOver30 !== false) missing.push('Укажите результат проверки текстуальных совпадений.');
  const aspects = aspectCounts(draft, 5, missing);
  let content: number | null = null;
  if (aspects) {
    const { absent, partial } = aspects;
    content = absent === 0 && partial === 0 ? 3
      : absent === 0 && partial <= 2 ? 2
        : absent === 0 && partial <= 4 ? 1
          : absent <= 2 && partial === 0 ? 1
            : absent === 1 && partial <= 2 ? 1 : 0;
    const override = expertLevel(draft, 'content', 3);
    if (override !== null) {
      content = override;
      reasons.push('Балл за содержание уточнён экспертом по шкале ФИПИ.');
    }
  }
  if (content === 0) return zero('Ноль за решение коммуникативной задачи обнуляет всё задание.');
  const criteria = {
    content,
    organization: organization(draft.organizationErrors, 3, missing),
    language: language(draft, 3, missing, reasons),
    script: script29(draft, missing, reasons),
  };
  return assemble(criteria, missing, reasons);
}
