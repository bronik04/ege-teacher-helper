import { describe, expect, it } from 'vitest';
import { calculateAssessment } from './score';
import type { AssessmentDraft } from './types';

const w28 = (changes: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  taskId: 'writing28', rubricYear: 2026, noAnswer: false,
  aspects: ['+', '+', '+', '+', '+', '+'], characterCount: 170,
  organizationErrors: 0, lexicalGrammarErrors: 0, hanziErrors: 0, punctuationErrors: 0,
  ...changes,
});

const w29 = (changes: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  taskId: 'writing29', rubricYear: 2026, noAnswer: false,
  aspects: ['+', '+', '+', '+', '+'], characterCount: 180, plagiarismOver30: false,
  organizationErrors: 0, lexicalGrammarErrors: 0, hanziErrors: 0, punctuationErrors: 0,
  expertLevels: { language: 3 },
  ...changes,
});

describe('writing task 28', () => {
  it('awards eight for a complete accurate letter', () => {
    expect(calculateAssessment(w28()).finalTotal).toBe(8);
  });

  it('allows one partial aspect for full content credit', () => {
    expect(calculateAssessment(w28({ aspects: ['±', '+', '+', '+', '+', '+'] })).criteria.content).toBe(2);
  });

  it('zeroes every criterion after three missing aspects', () => {
    const result = calculateAssessment(w28({ aspects: ['−', '−', '−', '+', '+', '+'] }));
    expect(result.criteria).toEqual({ content: 0, organization: 0, language: 0, script: 0 });
    expect(result.finalTotal).toBe(0);
  });

  it('treats an absent answer as a final zero', () => {
    expect(calculateAssessment(w28({ noAnswer: true })).finalTotal).toBe(0);
  });

  it.each([
    [134, 0], [135, 8], [209, 8],
  ])('handles the %i-sign length boundary', (characterCount, expected) => {
    expect(calculateAssessment(w28({ characterCount })).finalTotal).toBe(expected);
  });

  it('requires confirmation that only the first 190 signs were assessed above 209', () => {
    const draft = w28({ characterCount: 210 });
    expect(calculateAssessment(draft).finalTotal).toBeNull();
    const confirmed = calculateAssessment({ ...draft, assessedFragmentConfirmed: true });
    expect(confirmed.finalTotal).toBe(8);
    expect(confirmed.reasons.join(' ')).toContain('190');
  });

  it('keeps an overlength zero provisional until its assessed fragment is confirmed', () => {
    const draft = w28({ characterCount: 210, aspects: ['−', '−', '−', '+', '+', '+'] });
    const pending = calculateAssessment(draft);
    expect(pending.criteria).toEqual({ content: 0, organization: 0, language: 0, script: 0 });
    expect(pending.finalTotal).toBeNull();
    expect(pending.missing.join(' ')).toContain('190');
    expect(calculateAssessment({ ...draft, assessedFragmentConfirmed: true }).finalTotal).toBe(0);
  });

  it('honors a written organization decision made by the expert', () => {
    const result = calculateAssessment(w28({ expertLevels: { organization: 0 } }));
    expect(result.criteria.organization).toBe(0);
    expect(result.finalTotal).toBe(6);
    expect(result.reasons.join(' ')).toContain('организации');
  });

  it('does not present an incomplete aspect list as a final score', () => {
    const result = calculateAssessment(w28({ aspects: ['+', null, '+', '+', '+', '+'] }));
    expect(result.finalTotal).toBeNull();
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('reproduces two worked FIPI 2026 letter totals', () => {
    // Writing guide, section II, printed pp. 99–101: K1/K2/K3/K4 = 2/1/1/1.
    expect(calculateAssessment(w28({
      aspects: ['±', '+', '+', '+', '+', '+'], organizationErrors: 2,
      lexicalGrammarErrors: 3, hanziErrors: 3, punctuationErrors: 2,
    })).finalTotal).toBe(5);
    // Writing guide, printed pp. 103–105: K1/K2/K3/K4 = 1/0/0/0.
    expect(calculateAssessment(w28({
      aspects: ['−', '±', '+', '+', '+', '+'], organizationErrors: 4,
      lexicalGrammarErrors: 6, hanziErrors: 11, punctuationErrors: 2,
    })).finalTotal).toBe(1);
  });
});

describe('writing task 29', () => {
  it('awards twelve when every criterion is complete', () => {
    expect(calculateAssessment(w29()).finalTotal).toBe(12);
  });

  it('maps one or two partial aspects to two content points', () => {
    expect(calculateAssessment(w29({ aspects: ['±', '+', '+', '+', '+'] })).criteria.content).toBe(2);
    expect(calculateAssessment(w29({ aspects: ['±', '±', '+', '+', '+'] })).criteria.content).toBe(2);
  });

  it('maps a missing plus a partial aspect to one content point', () => {
    expect(calculateAssessment(w29({ aspects: ['−', '±', '+', '+', '+'] })).criteria.content).toBe(1);
  });

  it.each([
    [143, 0], [144, 12], [220, 12],
  ])('handles the %i-sign length boundary', (characterCount, expected) => {
    expect(calculateAssessment(w29({ characterCount })).finalTotal).toBe(expected);
  });

  it('requires confirmation of the first 200 signs above 220', () => {
    expect(calculateAssessment(w29({ characterCount: 221 })).finalTotal).toBeNull();
    const confirmed = calculateAssessment(w29({ characterCount: 221, assessedFragmentConfirmed: true }));
    expect(confirmed.finalTotal).toBe(12);
    expect(confirmed.reasons.join(' ')).toContain('200');
  });

  it('keeps zero content provisional above 220 until the first 200 signs are confirmed', () => {
    const draft = w29({ characterCount: 221, aspects: ['−', '−', '−', '+', '+'] });
    const result = calculateAssessment(draft);
    expect(result.criteria).toEqual({ content: 0, organization: 0, language: 0, script: 0 });
    expect(result.finalTotal).toBeNull();
    expect(result.missing.join(' ')).toContain('200');
    expect(calculateAssessment({ ...draft, assessedFragmentConfirmed: true }).finalTotal).toBe(0);
  });

  it('requires an explicit task-29 language judgment even with zero errors', () => {
    const pending = calculateAssessment(w29({ expertLevels: {} }));
    expect(pending.criteria.language).toBeNull();
    expect(pending.finalTotal).toBeNull();
    expect(pending.missing.join(' ')).toContain('уровень лексико-грамматического');
    expect(calculateAssessment(w29({ expertLevels: { language: 2 } })).finalTotal).toBe(11);
  });

  it('honors a written task-29 organization decision', () => {
    const result = calculateAssessment(w29({ expertLevels: { language: 3, organization: 0 } }));
    expect(result.criteria.organization).toBe(0);
    expect(result.finalTotal).toBe(9);
  });

  it('zeroes every criterion after established textual copying over 30%', () => {
    const result = calculateAssessment(w29({ plagiarismOver30: true }));
    expect(result.criteria).toEqual({ content: 0, organization: 0, language: 0, script: 0 });
    expect(result.finalTotal).toBe(0);
  });

  it('requires the expert to answer the copying question', () => {
    expect(calculateAssessment(w29({ plagiarismOver30: null })).finalTotal).toBeNull();
  });

  it('reproduces two worked FIPI 2026 essay totals', () => {
    // Writing guide, printed pp. 122–124: K1/K2/K3/K4 = 2/3/2/2.
    expect(calculateAssessment(w29({
      aspects: ['±', '±', '+', '+', '+'], lexicalGrammarErrors: 3,
      hanziErrors: 2, punctuationErrors: 1, expertLevels: { language: 2 },
    })).finalTotal).toBe(9);
    // Writing guide, printed pp. 126–128: K1/K2/K3/K4 = 1/3/0/0.
    // Its K1 outcome differs from the formal rubric for two partial marks;
    // the visible expert level records that contextual judgment.
    expect(calculateAssessment(w29({
      aspects: ['±', '±', '+', '+', '+'], lexicalGrammarErrors: 6,
      hanziErrors: 6, punctuationErrors: 1, expertLevels: { content: 1, script: 0, language: 0 },
    })).finalTotal).toBe(4);
  });
});
