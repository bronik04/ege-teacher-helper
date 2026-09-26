import type { AssessmentDraft, ScoreResult } from './types';

function count(value: number | null | undefined): number | null {
  return Number.isSafeInteger(value) && value! >= 0 ? value! : null;
}

function expertLevel(draft: AssessmentDraft, key: 'content' | 'organization' | 'language', max: number): number | null {
  const value = draft.expertLevels?.[key];
  return value !== undefined && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
}

function zero(reason: string): ScoreResult {
  return {
    criteria: { content: 0, organization: 0, language: 0 },
    provisionalTotal: 0, finalTotal: 0, missing: [], reasons: [reason],
  };
}

function assemble(content: number | null, organization: number | null, language: number | null,
  missing: string[], reasons: string[]): ScoreResult {
  const provisionalTotal = (content ?? 0) + (organization ?? 0) + (language ?? 0);
  return {
    criteria: { content, organization, language }, provisionalTotal,
    finalTotal: missing.length || content === null || organization === null || language === null
      ? null : provisionalTotal,
    missing, reasons,
  };
}

function markedAspects(draft: AssessmentDraft, required: number, missing: string[]) {
  if (draft.aspects.length !== required || draft.aspects.some((mark) => mark === null)) {
    missing.push('Оцените все аспекты содержания.');
    return null;
  }
  return {
    absent: draft.aspects.filter((mark) => mark === '−').length,
    partial: draft.aspects.filter((mark) => mark === '±').length,
  };
}

function monologueContent(draft: AssessmentDraft, task: 2 | 3, missing: string[], reasons: string[]): number | null {
  const phrases = count(draft.phraseCount);
  if (phrases === null) {
    missing.push('Укажите число фраз.');
    return null;
  }
  if (phrases <= 5) return 0;
  const marked = markedAspects(draft, task === 2 ? 5 : 4, missing);
  if (!marked) return null;
  const { absent, partial } = marked;
  let byAspects: number | null;
  if (absent === 0 && partial === 0) byAspects = 3;
  else if ((absent === 1 && partial === 0) || (absent === 0 && partial <= 2)) byAspects = 2;
  else if (task === 2 && ((absent === 2 && partial === 0) || (absent === 0 && partial === 5))) byAspects = 1;
  else if (task === 3 && ((absent === 2 && partial === 0) || (absent === 1 && partial === 1)
    || (absent === 0 && partial === 3))) byAspects = 1;
  else if (absent >= 3 || (task === 3 && absent === 2 && partial >= 1)
    || (task === 3 && absent === 1 && partial === 3)) byAspects = 0;
  else byAspects = null;

  const override = expertLevel(draft, 'content', 3);
  if (override !== null) {
    byAspects = override;
    reasons.push('Балл за содержание уточнён экспертом по шкале ФИПИ.');
  }
  if (byAspects === null) {
    missing.push('Выберите уровень содержания для смешанных отметок.');
    return null;
  }
  const byLength = task === 2
    ? phrases <= 7 ? 1 : phrases <= 9 ? 2 : 3
    : phrases <= 8 ? 1 : phrases <= 11 ? 2 : 3;
  return Math.min(byAspects, byLength);
}

function organization2(draft: AssessmentDraft, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'organization', 2);
  if (override !== null) {
    reasons.push('Уровень организации выбран экспертом по шкале ФИПИ.');
    return override;
  }
  const flags = [draft.hasIntroduction, draft.hasConclusion, draft.isLogical, draft.linksAdequate];
  if (flags.some((flag) => typeof flag !== 'boolean')) {
    missing.push('Отметьте вступление, заключение, логичность и средства связи.');
    return null;
  }
  if (flags.every(Boolean)) return 2;
  if (draft.isLogical === false || (draft.hasIntroduction === false && draft.hasConclusion === false)) return 0;
  return 1;
}

function organization3(draft: AssessmentDraft, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'organization', 2);
  if (override !== null) {
    reasons.push('Уровень организации выбран экспертом по шкале ФИПИ.');
    return override;
  }
  const errors = count(draft.organizationErrors);
  if (errors === null || typeof draft.hasIntroduction !== 'boolean' || typeof draft.hasConclusion !== 'boolean') {
    missing.push('Укажите ошибки организации, наличие вступления и заключения.');
    return null;
  }
  if (errors >= 5 || (!draft.hasIntroduction && !draft.hasConclusion)) return 0;
  if (errors >= 2 || !draft.hasIntroduction || !draft.hasConclusion) return 1;
  return 2;
}

function language2(draft: AssessmentDraft, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'language', 2);
  if (override !== null) {
    reasons.push('Языковое оформление уточнено экспертом по шкале ФИПИ.');
    return override;
  }
  const grammar = count(draft.lexicalGrammarErrors);
  const phonetic = count(draft.phoneticErrors);
  if (grammar === null || phonetic === null) {
    missing.push('Укажите лексико-грамматические и фонетические ошибки.');
    return null;
  }
  if (grammar <= 2 && phonetic <= 3) return 2;
  if (grammar <= 4 && phonetic <= 5) return 1;
  return 0;
}

function language3(draft: AssessmentDraft, missing: string[], reasons: string[]): number | null {
  const override = expertLevel(draft, 'language', 3);
  if (override !== null) {
    reasons.push('Языковое оформление уточнено экспертом по шкале ФИПИ.');
    return override;
  }
  const grammar = count(draft.lexicalGrammarErrors);
  const grossGrammar = count(draft.grossLexicalGrammarErrors);
  const phonetic = count(draft.phoneticErrors);
  const grossPhonetic = count(draft.grossPhoneticErrors);
  if (grammar === null || grossGrammar === null || phonetic === null || grossPhonetic === null
    || grossGrammar > grammar || grossPhonetic > phonetic) {
    missing.push('Укажите общее число ошибок и число грубых ошибок каждого вида.');
    return null;
  }
  if (grammar <= 2 && grossGrammar === 0 && phonetic <= 2 && grossPhonetic === 0) return 3;
  if (grammar <= 4 && grossGrammar <= 2 && phonetic <= 4 && grossPhonetic <= 2) return 2;
  if (grammar <= 5 && grossGrammar <= 3 && phonetic <= 5 && grossPhonetic <= 3) return 1;
  if ((grammar >= 7 && grossGrammar > 3) || (phonetic >= 7 && grossPhonetic > 3)) return 0;
  missing.push('Выберите уровень языка для пограничного сочетания ошибок.');
  return null;
}

export function scoreSpeaking1(draft: AssessmentDraft): ScoreResult {
  if (draft.noAnswer) {
    return { criteria: { questions: 0 }, provisionalTotal: 0, finalTotal: 0,
      missing: [], reasons: ['Ответ на задание отсутствует.'] };
  }
  const accepted = draft.questionAccepted ?? [];
  const score = accepted.filter((value) => value === true).length;
  if (accepted.length !== 5 || accepted.some((value) => value === null)) {
    return { criteria: { questions: null }, provisionalTotal: score, finalTotal: null,
      missing: ['Оцените все пять вопросов.'], reasons: [] };
  }
  return { criteria: { questions: score }, provisionalTotal: score, finalTotal: score,
    missing: [], reasons: [] };
}

export function scoreSpeaking2(draft: AssessmentDraft): ScoreResult {
  if (draft.noAnswer) return zero('Ответ на задание отсутствует.');
  const missing: string[] = [];
  const reasons: string[] = [];
  const content = monologueContent(draft, 2, missing, reasons);
  if (content === 0) return zero('Ноль за решение коммуникативной задачи обнуляет всё задание.');
  return assemble(content, organization2(draft, missing, reasons), language2(draft, missing, reasons), missing, reasons);
}

export function scoreSpeaking3(draft: AssessmentDraft): ScoreResult {
  if (draft.noAnswer) return zero('Ответ на задание отсутствует.');
  const missing: string[] = [];
  const reasons: string[] = [];
  const content = monologueContent(draft, 3, missing, reasons);
  if (content === 0) return zero('Ноль за решение коммуникативной задачи обнуляет всё задание.');
  return assemble(content, organization3(draft, missing, reasons), language3(draft, missing, reasons), missing, reasons);
}
