import { describe, expect, it } from 'vitest';
import { calculateAssessment } from './score';
import type { AssessmentDraft } from './types';

const s1 = (changes: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  taskId: 'speaking1', rubricYear: 2026, noAnswer: false, aspects: [],
  questionAccepted: [true, true, true, true, true], ...changes,
});
const s2 = (changes: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  taskId: 'speaking2', rubricYear: 2026, noAnswer: false,
  aspects: ['+', '+', '+', '+', '+'], phraseCount: 11,
  hasIntroduction: true, hasConclusion: true, isLogical: true, linksAdequate: true,
  lexicalGrammarErrors: 0, phoneticErrors: 0, ...changes,
});
const s3 = (changes: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  taskId: 'speaking3', rubricYear: 2026, noAnswer: false,
  aspects: ['+', '+', '+', '+'], phraseCount: 13,
  hasIntroduction: true, hasConclusion: true, organizationErrors: 0,
  lexicalGrammarErrors: 0, grossLexicalGrammarErrors: 0,
  phoneticErrors: 0, grossPhoneticErrors: 0, ...changes,
});

describe('speaking task 1', () => {
  it('counts five accepted questions as five points', () => {
    expect(calculateAssessment(s1()).finalTotal).toBe(5);
  });

  it('counts only questions accepted by the expert', () => {
    // FIPI 2026 guide, printed pp. 27–29: hospital-address example rejected,
    // clear working-hours example accepted.
    expect(calculateAssessment(s1({ questionAccepted: [false, true, true, false, true] })).finalTotal).toBe(3);
  });

  it('does not treat an unmarked question as rejected', () => {
    expect(calculateAssessment(s1({ questionAccepted: [true, null, true, true, true] })).finalTotal).toBeNull();
  });

  it('returns final zero for no answer', () => {
    expect(calculateAssessment(s1({ noAnswer: true })).finalTotal).toBe(0);
  });
});

describe('speaking task 2', () => {
  it('awards the 3+2+2 maximum for a complete answer', () => {
    const result = calculateAssessment(s2());
    expect(result.criteria).toEqual({ content: 3, organization: 2, language: 2 });
    expect(result.finalTotal).toBe(7);
  });

  it('scores a missing reason for taking the photo as partial content', () => {
    // FIPI 2026 guide, printed p. 34: “friend took the photo” makes aspect 4 absent.
    expect(calculateAssessment(s2({ aspects: ['+', '+', '+', '−', '+'] })).criteria.content).toBe(2);
  });

  it('scores two missing photo explanations as one content point', () => {
    // FIPI 2026 guide, printed pp. 34–35: aspects 4 and 5 may both be absent.
    expect(calculateAssessment(s2({ aspects: ['+', '+', '+', '−', '−'] })).criteria.content).toBe(1);
  });

  it.each([[5, 0], [6, 1], [8, 2], [10, 3]])('caps content at %i phrases', (phraseCount, expected) => {
    expect(calculateAssessment(s2({ phraseCount })).criteria.content).toBe(expected);
  });

  it('zeroes every criterion at five phrases', () => {
    expect(calculateAssessment(s2({ phraseCount: 5 })).criteria).toEqual({ content: 0, organization: 0, language: 0 });
  });

  it('uses the exact lexical and phonetic error bands', () => {
    expect(calculateAssessment(s2({ lexicalGrammarErrors: 2, phoneticErrors: 3 })).criteria.language).toBe(2);
    expect(calculateAssessment(s2({ lexicalGrammarErrors: 4, phoneticErrors: 5 })).criteria.language).toBe(1);
    expect(calculateAssessment(s2({ lexicalGrammarErrors: 5, phoneticErrors: 0 })).criteria.language).toBe(0);
    expect(calculateAssessment(s2({ lexicalGrammarErrors: 0, phoneticErrors: 6 })).criteria.language).toBe(0);
  });

  it('asks for organization observations instead of assuming they are perfect', () => {
    expect(calculateAssessment(s2({ hasIntroduction: null })).finalTotal).toBeNull();
  });
});

describe('speaking task 3', () => {
  it('awards the 3+2+3 maximum for a complete answer', () => {
    const result = calculateAssessment(s3());
    expect(result.criteria).toEqual({ content: 3, organization: 2, language: 3 });
    expect(result.finalTotal).toBe(8);
  });

  it('uses the FIPI 2026 explained missing and partial aspect cases', () => {
    // Speaking guide, printed p. 47: one absent → 2; one absent plus one partial → 1.
    expect(calculateAssessment(s3({ aspects: ['−', '+', '+', '+'] })).criteria.content).toBe(2);
    expect(calculateAssessment(s3({ aspects: ['−', '±', '+', '+'] })).criteria.content).toBe(1);
  });

  it.each([[5, 0], [6, 1], [9, 2], [12, 3]])('caps content at %i phrases', (phraseCount, expected) => {
    expect(calculateAssessment(s3({ phraseCount })).criteria.content).toBe(expected);
  });

  it('zeroes all criteria when communication is zero', () => {
    expect(calculateAssessment(s3({ aspects: ['−', '−', '−', '+'] })).criteria).toEqual({ content: 0, organization: 0, language: 0 });
  });

  it('uses the 2026 organization error thresholds', () => {
    expect(calculateAssessment(s3({ organizationErrors: 1 })).criteria.organization).toBe(2);
    expect(calculateAssessment(s3({ organizationErrors: 2 })).criteria.organization).toBe(1);
    expect(calculateAssessment(s3({ organizationErrors: 4 })).criteria.organization).toBe(1);
    expect(calculateAssessment(s3({ organizationErrors: 5 })).criteria.organization).toBe(0);
    expect(calculateAssessment(s3({ hasIntroduction: false })).criteria.organization).toBe(1);
    expect(calculateAssessment(s3({ hasIntroduction: false, hasConclusion: false })).criteria.organization).toBe(0);
  });

  it('distinguishes gross errors and leaves an unclassified six-error case to the expert', () => {
    expect(calculateAssessment(s3({ lexicalGrammarErrors: 2, grossLexicalGrammarErrors: 0 })).criteria.language).toBe(3);
    expect(calculateAssessment(s3({ lexicalGrammarErrors: 4, grossLexicalGrammarErrors: 2 })).criteria.language).toBe(2);
    expect(calculateAssessment(s3({ lexicalGrammarErrors: 5, grossLexicalGrammarErrors: 3 })).criteria.language).toBe(1);
    expect(calculateAssessment(s3({ lexicalGrammarErrors: 6, grossLexicalGrammarErrors: 3 })).finalTotal).toBeNull();
  });
});
