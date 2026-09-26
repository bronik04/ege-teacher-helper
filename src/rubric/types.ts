export type TaskId = 'writing28' | 'writing29' | 'speaking1' | 'speaking2' | 'speaking3';
export type AspectMark = '+' | '±' | '−' | null;
export type CriterionKey = 'content' | 'organization' | 'language' | 'script' | 'questions';

export interface RubricLevel {
  score: number;
  description: string;
}

export interface RubricCriterion {
  id: CriterionKey;
  title: string;
  maxScore: number;
  help: string;
  levels: RubricLevel[];
}

export interface RubricTask {
  id: TaskId;
  year: 2026;
  title: string;
  shortTitle: string;
  section: 'Письменная речь' | 'Говорение';
  maxScore: number;
  aspects: string[];
  criteria: RubricCriterion[];
  source: { url: string; pages: number[] };
}

export interface AssessmentDraft {
  taskId: TaskId;
  rubricYear: 2026;
  noAnswer: boolean;
  aspects: AspectMark[];
  questionAccepted?: (boolean | null)[];
  characterCount?: number | null;
  phraseCount?: number | null;
  assessedFragmentConfirmed?: boolean | null;
  plagiarismOver30?: boolean | null;
  organizationErrors?: number | null;
  lexicalGrammarErrors?: number | null;
  hanziErrors?: number | null;
  punctuationErrors?: number | null;
  phoneticErrors?: number | null;
  grossLexicalGrammarErrors?: number | null;
  grossPhoneticErrors?: number | null;
  expertLevels?: Partial<Record<'content' | 'organization' | 'language' | 'script', number>>;
}

export interface ScoreResult {
  criteria: Partial<Record<CriterionKey, number | null>>;
  provisionalTotal: number;
  finalTotal: number | null;
  missing: string[];
  reasons: string[];
}
