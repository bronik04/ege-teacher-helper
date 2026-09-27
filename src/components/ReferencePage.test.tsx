// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
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

  it('keeps qualitative language conditions alongside error counts', () => {
    const cases: [TaskId, [number, RegExp][]][] = [
      ['writing29', [[2, /высокому уровню.*две–три ошибки.*ограничены, но использованы правильно/]]],
      ['speaking2', [[2, /соответствуют поставленной задаче.*двух лексико-грамматических/], [1, /в основном соответствуют поставленной задаче.*четырёх лексико-грамматических/]]],
      ['speaking3', [[3, /соответствуют поставленной задаче.*двух негрубых/], [2, /в основном соответствуют поставленной задаче.*четырёх/], [1, /частично соответствует поставленной задаче.*пяти/]]],
    ];
    for (const [taskId, expected] of cases) {
      const { unmount } = render(<ReferencePage taskId={taskId} onTaskChange={() => {}} onBack={() => {}} />);
      const language = screen.getByRole('region', { name: /^К3 / });
      const levels = within(language).getAllByRole('listitem').map((item) => item.textContent ?? '');
      expected.forEach(([score, pattern]) => {
        const level = levels.find((item) => item.startsWith(`${score} ${score === 1 ? 'балл' : 'балла'}`));
        expect(level).toMatch(pattern);
      });
      unmount();
    }
  });
});

describe('worked examples', () => {
  it('explains the published letter score by criterion and identifies its source', () => {
    render(<ReferencePage taskId="writing28" onTaskChange={() => {}} onBack={() => {}} />);
    const card = screen.getByRole('article', { name: 'Письмо: один неполный аспект и ошибки оформления' });
    expect(within(card).getByText('ФИПИ: разбор ответа')).toBeInTheDocument();
    expect(within(card).getByText('Итого 5 из 8')).toBeInTheDocument();
    fireEvent.click(within(card).getByText('Разбор по критериям'));
    expect(within(card).getByText('Фрагмент ответа')).toBeInTheDocument();
    expect(within(card).getByText(/из трёх вопросов о выставке принят один/)).toBeInTheDocument();
    expect(within(card).getByText(/Две ошибки в организации/)).toBeInTheDocument();
    expect(within(card).getByText(/ФИПИ 2026, с. 101/)).toBeInTheDocument();
  });

  it('distinguishes a whole-task zero from a partial example with no total', () => {
    render(<ReferencePage taskId="writing28" onTaskChange={() => {}} onBack={() => {}} />);
    const short = screen.getByRole('article', { name: '134 знака: ноль за всё письмо' });
    expect(within(short).getByText('Учебный случай')).toBeInTheDocument();
    fireEvent.click(within(short).getByText('Разбор по критериям'));
    expect(within(short).getByText(/Объём меньше 135 знаков: всё задание/)).toBeInTheDocument();
    cleanup();
    render(<ReferencePage taskId="speaking1" onTaskChange={() => {}} onBack={() => {}} />);
    const question = screen.getByRole('article', { name: 'Местоположение вместо адреса' });
    expect(within(question).getByText('Остальные вопросы не оценивались')).toBeInTheDocument();
  });

  it('changes examples when the teacher selects another task', () => {
    function SelectableReference() {
      const [taskId, setTaskId] = useState<TaskId>('writing28');
      return <ReferencePage taskId={taskId} onTaskChange={setTaskId} onBack={() => {}} />;
    }
    render(<SelectableReference />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Задание в справке' }), { target: { value: 'speaking3' } });
    expect(screen.getByRole('article', { name: 'Содержание частично, язык — ноль' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Письмо: один неполный аспект и ошибки оформления' })).not.toBeInTheDocument();
  });
});
