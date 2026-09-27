import { criterionCode } from '../rubric/criterion-code';
import { explainCriterion } from '../rubric/explain';
import { FIPI_2026 } from '../rubric/fipi2026';
import { calculateAssessment } from '../rubric/score';
import type { AssessmentRecord } from '../rubric/types';

export default function PrintReport({ record, onBack }: { record: AssessmentRecord; onBack: () => void }) {
  const task = FIPI_2026[record.draft.taskId];
  const result = calculateAssessment(record.draft);
  const explanations = task.criteria.map((criterion) => explainCriterion(record.draft, result, criterion.id));
  const remainingReasons = result.reasons.filter((reason) => !explanations.includes(reason));
  return <section className="print-report" aria-label="Карточка проверки">
    <div className="report-actions no-print">
      <button type="button" onClick={onBack}>К сохранённым работам</button>
      <button type="button" onClick={() => window.print()}>Распечатать или сохранить PDF</button>
    </div>
    <article className="report-sheet">
      <header className="report-header">
        <div><span className="eyebrow">ЕГЭ по китайскому языку · ФИПИ {record.draft.rubricYear}</span>
          <h2>Отчёт по работе</h2></div>
        <strong className="report-total">{result.finalTotal === null ? 'Черновик' : `${result.finalTotal} / ${task.maxScore}`}</strong>
      </header>
      <dl className="report-meta">
        <div><dt>Работа</dt><dd>{record.label || 'Без метки'}</dd></div>
        <div><dt>Задание</dt><dd>{task.shortTitle}</dd></div>
        <div><dt>Обновлено</dt><dd>{new Date(record.updatedAt).toLocaleString('ru-RU')}</dd></div>
      </dl>
      <h3>Баллы по критериям</h3>
      <table className="report-criteria"><thead><tr><th scope="col">Критерий</th><th scope="col">Основание</th><th scope="col">Балл</th></tr></thead>
        <tbody>{task.criteria.map((criterion, index) => <tr key={criterion.id}>
          <th scope="row">{criterionCode(task, index) && `${criterionCode(task, index)} · `}{criterion.title}</th>
          <td>{explanations[index] ?? 'Ожидает оценки'}</td>
          <td>{result.criteria[criterion.id] ?? '—'} / {criterion.maxScore}</td>
        </tr>)}</tbody></table>
      {result.finalTotal === null && <p className="report-pending">Черновик · предварительно {result.provisionalTotal} / {task.maxScore}</p>}
      {result.missing.length > 0 && <section className="report-detail"><h3>Для итогового балла</h3><ul>{result.missing.map((item) => <li key={item}>{item}</li>)}</ul></section>}
      {remainingReasons.length > 0 && <section className="report-detail"><h3>Примечания к расчёту</h3><ul>{remainingReasons.map((item) => <li key={item}>{item}</li>)}</ul></section>}
      <section className="report-detail"><h3>Заметка учителя</h3><p>{record.note || 'Нет заметки.'}</p></section>
      <p className="report-source">Источник: <a href={`${task.source.url}#page=${task.source.pages[0]}`} target="_blank" rel="noreferrer">Критерии ФИПИ, 2026</a> · страницы PDF {task.source.pages.join('–')}</p>
    </article>
  </section>;
}
