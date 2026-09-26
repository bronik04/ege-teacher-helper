import { describe, expect, it } from 'vitest';
import { FIPI_2026, MARK_EXPLANATIONS } from './fipi2026';

describe('FIPI 2026 rubric catalog', () => {
  it('lists the five requested tasks with their scoring limits', () => {
    expect(Object.keys(FIPI_2026)).toEqual([
      'writing28', 'writing29', 'speaking1', 'speaking2', 'speaking3',
    ]);
    expect(Object.values(FIPI_2026).map((task) => task.maxScore)).toEqual([8, 12, 5, 7, 8]);
    expect(Object.values(FIPI_2026).map((task) => task.aspects.length)).toEqual([6, 5, 0, 5, 4]);
  });

  it('keeps the official criterion limits instead of adding checkmark counts', () => {
    expect(FIPI_2026.writing28.criteria.map((criterion) => criterion.maxScore)).toEqual([2, 2, 2, 2]);
    expect(FIPI_2026.writing29.criteria.map((criterion) => criterion.maxScore)).toEqual([3, 3, 3, 3]);
    expect(FIPI_2026.speaking1.criteria.map((criterion) => criterion.maxScore)).toEqual([5]);
    expect(FIPI_2026.speaking2.criteria.map((criterion) => criterion.maxScore)).toEqual([3, 2, 2]);
    expect(FIPI_2026.speaking3.criteria.map((criterion) => criterion.maxScore)).toEqual([3, 2, 3]);
  });

  it('provides source pages and criterion help for every task', () => {
    expect(Object.values(FIPI_2026).map((task) => task.source.pages)).toEqual([
      [140], [141], [85], [85, 86], [86, 87],
    ]);
    for (const task of Object.values(FIPI_2026)) {
      expect(task.year).toBe(2026);
      expect(task.source.url).toMatch(/^https:\/\/doc\.fipi\.ru\/ege\//);
      expect(task.source.url).toContain('/2026/');
      for (const criterion of task.criteria) {
        expect(criterion.help.length).toBeGreaterThan(20);
        expect(criterion.levels[0].description.length).toBeGreaterThan(10);
      }
    }
    expect(Object.keys(MARK_EXPLANATIONS)).toEqual(['+', '±', '−']);
  });
});
