import { describe, expect, it } from 'vitest';
import { REFERENCE_EXAMPLES } from './reference-examples';
import type { TaskId } from './types';

const tasks: TaskId[] = ['writing28', 'writing29', 'speaking1', 'speaking2', 'speaking3'];

describe('teacher example content', () => {
  it('offers a sourced and a teaching example for every task', () => {
    for (const task of tasks) {
      const examples = REFERENCE_EXAMPLES[task].examples;
      expect(examples.some((item) => item.kind === 'official'), task).toBe(true);
      expect(examples.some((item) => item.kind === 'educational'), task).toBe(true);
      for (const example of examples) {
        expect(example.id).toBeTruthy();
        expect(example.page).toBeGreaterThan(0);
        expect(example.prompt).toBeTruthy();
        expect(example.excerpt).toBeTruthy();
        expect(['fragment', 'full']).toContain(example.excerptKind);
        expect(example.criteria.length).toBeGreaterThan(0);
        expect(example.criteria.every((criterion) => criterion.code && criterion.reason)).toBe(true);
      }
    }
    const ids = tasks.flatMap((task) => REFERENCE_EXAMPLES[task].examples.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps published scores equal to the explained criterion scores', () => {
    for (const task of tasks) {
      for (const example of REFERENCE_EXAMPLES[task].examples.filter((item) => item.kind === 'official')) {
        if (example.total !== null) {
          expect(example.criteria.reduce((sum, criterion) => sum + criterion.score, 0), example.id).toBe(example.total);
        }
      }
    }
    const letter = REFERENCE_EXAMPLES.writing28.examples.find((item) => item.id === 'writing28-fipi-101');
    expect(letter?.page).toBe(101);
    expect(letter?.criteria.map((item) => [item.code, item.score])).toEqual([
      ['К1', 2], ['К2', 1], ['К3', 1], ['К4', 1],
    ]);
    expect(letter?.total).toBe(5);
    expect(REFERENCE_EXAMPLES.writing29.examples.find((item) => item.kind === 'official')?.total).toBe(9);
    expect(REFERENCE_EXAMPLES.speaking2.examples.find((item) => item.kind === 'official')?.total).toBe(6);
    expect(REFERENCE_EXAMPLES.speaking3.examples.find((item) => item.kind === 'official')?.total).toBe(2);
  });

  it('distinguishes a zero for the whole task from an individual zero criterion', () => {
    const shortLetter = REFERENCE_EXAMPLES.writing28.examples.find((item) => item.id === 'writing28-short');
    expect(shortLetter?.kind).toBe('educational');
    expect(shortLetter?.total).toBe(0);
    expect(shortLetter?.zeroReason).toMatch(/135 знаков/);
    const organization = REFERENCE_EXAMPLES.speaking3.examples.find((item) => item.id === 'speaking3-k2-zero');
    expect(organization?.kind).toBe('educational');
    expect(organization?.criteria.find((item) => item.code === 'К1')?.score).toBeGreaterThan(0);
    expect(organization?.criteria.find((item) => item.code === 'К2')?.score).toBe(0);
    expect(organization?.total).toBeNull();
    expect(organization?.zeroReason).toBeUndefined();
  });

  it('ties the second published letter to the Russia trip prompt and its missing letter etiquette', () => {
    const example = REFERENCE_EXAMPLES.writing28.examples.find((item) => item.id === 'writing28-fipi-105');
    expect(example?.prompt).toMatch(/поездке в Россию/);
    expect(example?.aspects).toContain('Аспект 5: ± — пожелание отсутствует.');
    expect(example?.aspects).toContain('Аспект 6: − — три элемента стиля отсутствуют.');
  });

  it('contrasts an incomplete hours question with a complete one', () => {
    const examples = REFERENCE_EXAMPLES.speaking1.examples;
    expect(examples.find((item) => item.id === 'speaking1-fipi-hours')?.criteria[0].score).toBe(0);
    expect(examples.find((item) => item.id === 'speaking1-hours-good')?.criteria[0].score).toBe(1);
  });
});
