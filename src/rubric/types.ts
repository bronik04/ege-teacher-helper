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
