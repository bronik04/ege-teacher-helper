// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { loadRecords, saveRecord } from './storage/records';
import { WORKING_DRAFT_KEY } from './storage/working-draft';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(cleanup);

function chooseTask(title: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Задание' }), { target: { value: title } });
}

function acceptFiveQuestions() {
  for (let number = 1; number <= 5; number += 1) {
    fireEvent.click(screen.getByRole('button', { name: `Вопрос ${number}: засчитать` }));
  }
}

describe('teacher checking flow', () => {
  it('searches and filters saved work by task and completion status', () => {
    const timestamp = '2026-09-27T10:00:00.000Z';
    saveRecord(window.localStorage, { id: 'a', createdAt: timestamp, updatedAt: timestamp,
      label: 'Аня', note: '', draft: { taskId: 'speaking1', rubricYear: 2026, noAnswer: false,
        aspects: [], questionAccepted: [true, true, true, true, true] } });
    saveRecord(window.localStorage, { id: 'b', createdAt: timestamp, updatedAt: timestamp,
      label: 'Анна', note: '', draft: { taskId: 'speaking1', rubricYear: 2026, noAnswer: false,
        aspects: [], questionAccepted: [true, null, null, null, null] } });
    saveRecord(window.localStorage, { id: 'c', createdAt: timestamp, updatedAt: timestamp,
      label: 'Борис', note: '', draft: { taskId: 'writing28', rubricYear: 2026, noAnswer: true,
        aspects: [null, null, null, null, null, null] } });
    const saved = window.localStorage.getItem('ege-assessments-v1');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    expect(screen.getByText('Найдено 3 из 3')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Поиск по метке' }), { target: { value: 'АН' } });
    expect(screen.getByText('Найдено 2 из 3')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Борис' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Фильтр по заданию' }), { target: { value: 'speaking1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Фильтр по статусу' }), { target: { value: 'draft' } });
    expect(screen.getByRole('heading', { name: 'Анна' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Аня' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Фильтр по статусу' }), { target: { value: 'complete' } });
    expect(screen.getByText('Найдено 1 из 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Аня' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Анна' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(screen.getByText('Найдено 3 из 3')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Поиск по метке' }), { target: { value: 'неизвестный' } });
    expect(screen.getByRole('heading', { name: 'Ничего не найдено' })).toBeInTheDocument();
    expect(window.localStorage.getItem('ege-assessments-v1')).toBe(saved);
  });

  it('opens a printable report for one saved work without changing its data', () => {
    render(<App />);
    chooseTask('speaking1');
    acceptFiveQuestions();
    fireEvent.change(screen.getByRole('textbox', { name: 'Метка ученика' }), { target: { value: 'Ученик А' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Заметка' }), { target: { value: 'Уточнить интонацию' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    const saved = window.localStorage.getItem('ege-assessments-v1');
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Печать' }));
    expect(screen.getByRole('heading', { name: 'Отчёт по работе' })).toBeInTheDocument();
    expect(screen.getByText('Ученик А')).toBeInTheDocument();
    expect(screen.getByText('Уточнить интонацию')).toBeInTheDocument();
    expect(screen.getByText('5 / 5', { selector: '.report-total' })).toBeInTheDocument();
    expect(screen.getByText('Засчитано 5 из 5 вопросов.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Критерии ФИПИ/ })).toHaveAttribute('href', expect.stringContaining('#page='));
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'Распечатать или сохранить PDF' }));
    expect(print).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem('ege-assessments-v1')).toBe(saved);
    fireEvent.click(screen.getByRole('button', { name: 'К сохранённым работам' }));
    expect(screen.getByRole('heading', { name: 'Сохранённые работы' })).toBeInTheDocument();
  });

  it('marks an incomplete printable report as a draft', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Печать' }));
    expect(screen.getByText('Черновик')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /^К1/ })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /^К2/ })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /^К3/ })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /^К4/ })).toBeInTheDocument();
    expect(screen.getByText(/Укажите число знаков/)).toBeInTheDocument();
    expect(screen.queryByText('Итог')).not.toBeInTheDocument();
  });

  it('shows a blocking reason only once in the printable report', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Число знаков' }), { target: { value: '134' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Печать' }));
    expect(screen.getAllByText(/Менее 135 знаков/)).toHaveLength(1);
  });

  it('explains a calculated organization point using the entered error count', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ошибки в организации' }), { target: { value: '2' } });
    expect(screen.getByText('2 ошибки в организации.')).toBeInTheDocument();
  });

  it('restores an unfinished check after the page is reopened', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Метка ученика' }), { target: { value: 'Ученик Б' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Заметка' }), { target: { value: 'Проверить иероглифику' } });
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Метка ученика' })).toHaveValue('Ученик Б');
    expect(screen.getByRole('textbox', { name: 'Заметка' })).toHaveValue('Проверить иероглифику');
    expect(screen.getByRole('status')).toHaveTextContent(/Восстановлен автосохранённый черновик/);
  });

  it('clears the recovery copy after a check is saved normally', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Метка ученика' }), { target: { value: 'Ученик Б' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('textbox', { name: 'Метка ученика' })).toHaveValue('');
    expect(screen.queryByText(/Восстановлен автосохранённый черновик/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    expect(screen.getByText('Ученик Б')).toBeInTheDocument();
  });

  it('discards the old recovery copy after a confirmed task switch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    chooseTask('speaking1');
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/Восстановлен автосохранённый черновик/)).not.toBeInTheDocument();
  });

  it('recovers from a temporary autosave failure on the next edit', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    setItem.mockImplementationOnce(() => { throw new Error('temporary storage failure'); });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Не удалось автосохранить/);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 2: полно' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Аспект 2: полно' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports a damaged recovery copy and starts a new one only after an edit', () => {
    window.localStorage.setItem(WORKING_DRAFT_KEY, '{broken');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Не удалось восстановить автосохранённый черновик/);
    expect(window.localStorage.getItem(WORKING_DRAFT_KEY)).toBe('{broken');
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not recreate a deleted saved record from its recovery copy', () => {
    render(<App />);
    chooseTask('speaking1');
    acceptFiveQuestions();
    fireEvent.change(screen.getByRole('textbox', { name: 'Метка ученика' }), { target: { value: 'Ученик А' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    const deletedId = loadRecords(window.localStorage)[0].id;
    fireEvent.click(screen.getByRole('button', { name: 'Вопрос 1: не засчитать' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(loadRecords(window.localStorage)).toHaveLength(0);
    cleanup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Вопрос 1: не засчитать' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    expect(loadRecords(window.localStorage)[0].id).not.toBe(deletedId);
  });

  it('removes an old saved notice when new note edits are only autosaved', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Черновик сохранён/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Заметка' }), { target: { value: 'Новая заметка' } });
    expect(screen.queryByText(/Черновик сохранён/)).not.toBeInTheDocument();
  });

  it('opens reference materials from a check and returns without losing unsaved marks', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    fireEvent.click(screen.getByRole('button', { name: 'Справочные материалы' }));
    expect(screen.getByRole('heading', { name: 'Справочные материалы' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /^К1 / })).toBeInTheDocument();
    expect(screen.getByText(/134 знака/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к проверке' }));
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText(/К1 · Решение коммуникативной задачи/)).toHaveLength(2);
  });

  it('shows independent question scoring for speaking 1 and sourced examples', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Справочные материалы' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Задание в справке' }), { target: { value: 'speaking1' } });
    expect(screen.getByText(/Каждый из пяти вопросов оценивается отдельно/)).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /^К1/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('ФИПИ: разбор ответа', { selector: 'span' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /Открыть разбор ФИПИ/ })[0]).toHaveAttribute('href', expect.stringContaining('#page=29'));
  });
  it('starts with unset aspect marks and shows relevant FIPI help', () => {
    render(<App />);
    expect(screen.getByText(/Предварительно/)).toBeInTheDocument();
    const plus = screen.getByRole('button', { name: 'Аспект 1: полно' });
    expect(plus).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: неполно' }));
    expect(screen.getByRole('button', { name: 'Аспект 1: неполно' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /Открыть источник ФИПИ/ })).toHaveAttribute('href', expect.stringContaining('#page=140'));
    expect(screen.getByText(/Знаки препинания входят в объём/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Правила подсчёта знаков/ })).toHaveAttribute('href', expect.stringContaining('#page=147'));
  });

  it('counts a finished five-question assessment and saves it for editing', () => {
    render(<App />);
    chooseTask('speaking1');
    acceptFiveQuestions();
    expect(screen.getAllByText('5 / 5')[0]).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Метка ученика' }), { target: { value: 'Ученик А' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    const row = screen.getByText('Ученик А').closest('article')!;
    expect(within(row).getByText('5 / 5')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Открыть' }));
    fireEvent.click(screen.getByRole('button', { name: 'Вопрос 1: не засчитать' }));
    expect(screen.getAllByText('4 / 5')[0]).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проверку' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    const updated = screen.getByText('Ученик А').closest('article')!;
    expect(within(updated).getByText('4 / 5')).toBeInTheDocument();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(within(updated).getByRole('button', { name: 'Удалить' }));
    expect(screen.queryByText('Ученик А')).not.toBeInTheDocument();
  });

  it('shows a zeroing reason for a written answer below the length threshold', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Число знаков' }), { target: { value: '134' } });
    expect(screen.getByText('0 / 8')).toBeInTheDocument();
    expect(screen.getByText(/Менее 135 знаков/)).toBeInTheDocument();
  });

  it('keeps unsaved marks when the teacher cancels a task switch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    chooseTask('speaking1');
    expect(screen.getByRole('combobox', { name: 'Задание' })).toHaveValue('writing28');
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('imports a valid file and keeps the current draft when import fails', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранённые работы' }));
    const input = screen.getByLabelText('Импорт JSON');
    const valid = { formatVersion: 1, records: [{ id: 'imported', label: 'Из файла', note: '',
      createdAt: '2026-09-26T12:00:00.000Z', updatedAt: '2026-09-26T12:00:00.000Z',
      draft: { taskId: 'speaking1', rubricYear: 2026, noAnswer: false, aspects: [],
        questionAccepted: [true, true, true, true, true] } }] };
    fireEvent.change(input, { target: { files: [new File([JSON.stringify(valid)], 'valid.json', { type: 'application/json' })] } });
    expect(await screen.findByText('Из файла')).toBeInTheDocument();
    expect(window.localStorage.getItem('ege-assessments-v1')).toContain('imported');
    fireEvent.change(input, { target: { files: [new File(['{broken'], 'bad.json', { type: 'application/json' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(/Не удалось импортировать/);
    expect(window.localStorage.getItem('ege-assessments-v1')).toContain('imported');
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к проверке' }));
    expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'true');
  });
});
