// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import ReferencePage from './ReferencePage';
import type { TaskId } from '../rubric/types';

afterEach(cleanup);

const taskLevels: [TaskId, number[][]][] = [
  ['writing28', [[2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 1, 0]]],
  ['writing29', [[3, 2, 1, 0], [3, 2, 1, 0], [3, 2, 1, 0], [3, 2, 1, 0]]],
  ['speaking2', [[3, 2, 1, 0], [2, 1, 0], [2, 1, 0]]],
  ['speaking3', [[3, 2, 1, 0], [2, 1, 0], [3, 2, 1, 0]]],
];

describe('complete teacher scales', () => {
  it.each(taskLevels)('shows every level for %s', (taskId, levels) => {
    render(<ReferencePage taskId={taskId} onTaskChange={() => {}} onBack={() => {}} />);
    levels.forEach((scores, index) => {
      const criterion = screen.getByRole('region', { name: new RegExp(`^К${index + 1} `) });
      expect(within(criterion).getAllByRole('listitem')).toHaveLength(scores.length);
      scores.forEach((score) => {
        expect(within(criterion).getByText(`${score} ${score === 1 ? 'балл' : score < 5 && score > 1 ? 'балла' : 'баллов'}`)).toBeInTheDocument();
      });
    });
    expect(screen.getByRole('link', { name: /полную шкалу ФИПИ/i })).toHaveAttribute('href', expect.stringContaining('#page='));
  });

  it('shows separate one-or-zero rules for five speaking questions without K codes', () => {
    render(<ReferencePage taskId="speaking1" onTaskChange={() => {}} onBack={() => {}} />);
    for (let number = 1; number <= 5; number += 1) {
      const question = screen.getByRole('region', { name: `Вопрос ${number}` });
      expect(within(question).getByText('1 балл')).toBeInTheDocument();
      expect(within(question).getByText('0 баллов')).toBeInTheDocument();
    }
    expect(screen.queryByText(/^К1$/)).not.toBeInTheDocument();
  });

  it('keeps the full-task zero and length rule next to the scale', () => {
    render(<ReferencePage taskId="writing28" onTaskChange={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/К1 равен 0/)).toBeInTheDocument();
    expect(screen.getAllByText(/меньше 135 знаков/).length).toBeGreaterThan(0);
  });
});
