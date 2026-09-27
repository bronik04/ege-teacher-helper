import { FIPI_2026, SPEAKING1_QUESTION_LEVELS } from '../rubric/fipi2026';
import { criterionCode } from '../rubric/criterion-code';
import { REFERENCE_EXAMPLES } from '../rubric/reference-examples';
import type { TaskId } from '../rubric/types';

function scoreLabel(score: number): string {
  return `${score} ${score === 1 ? 'балл' : score > 1 && score < 5 ? 'балла' : 'баллов'}`;
}

export default function ReferencePage({ taskId, onTaskChange, onBack }: {
  taskId: TaskId; onTaskChange: (taskId: TaskId) => void; onBack: () => void;
}) {
  const task = FIPI_2026[taskId];
  const reference = REFERENCE_EXAMPLES[taskId];

  return <section className="reference-view">
    <div className="view-heading"><div><span className="eyebrow">Памятка учителю · ФИПИ 2026</span><h2>Справочные материалы</h2></div>
      <button type="button" className="reference-back" onClick={onBack}>Вернуться к проверке</button></div>
    <div className="reference-intro card"><h3>Как читать баллы</h3>
      <p>Для каждого критерия ниже показаны все уровни баллов. Отметки +, ± и − помогают оценить аспекты содержания; для пограничного решения сверяйтесь с полной шкалой ФИПИ.</p>
      <p>Примеры с пометкой «ФИПИ: разбор ответа» пересказывают опубликованные разборы. «Учебный случай» иллюстрирует порог из официальной шкалы, но не является работой участника экзамена.</p></div>
    <div className="task-bar reference-task"><label htmlFor="reference-task-select">Задание в справке</label>
      <select id="reference-task-select" value={taskId} onChange={(event) => onTaskChange(event.target.value as TaskId)}>
        {Object.values(FIPI_2026).map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select>
      <span className="task-meta">до {task.maxScore} баллов</span></div>
    <div className="reference-layout"><section className="card reference-criteria"><span className="eyebrow">Шкала</span><h3>{task.title}</h3>
      <p className="reference-rule">{reference.note}</p>
      <div className="criterion-scales">
        {task.id === 'speaking1' ? Array.from({ length: 5 }, (_, index) => <section className="criterion-scale" aria-label={`Вопрос ${index + 1}`} key={index}>
          <h4>Вопрос {index + 1}</h4><ul className="scale-levels">{SPEAKING1_QUESTION_LEVELS.map((level) => <li key={level.score}>
            <strong>{scoreLabel(level.score)}</strong><span>{level.description}</span></li>)}</ul></section>)
          : task.criteria.map((criterion, index) => <section className="criterion-scale" aria-label={`${criterionCode(task, index)} ${criterion.title}`} key={criterion.id}>
            <h4><span className="criterion-code">{criterionCode(task, index)}</span>{criterion.title}</h4>
            <ul className="scale-levels">{criterion.levels.map((level) => <li key={level.score}>
              <strong>{scoreLabel(level.score)}</strong><span>{level.description}</span></li>)}</ul>
          </section>)}
      </div>
      <a className="source-link" href={`${task.source.url}#page=${task.source.pages[0]}`} target="_blank" rel="noreferrer">Открыть полную шкалу ФИПИ <span>↗</span></a>
    </section><section className="reference-examples"><span className="eyebrow">На примерах</span><h3>Когда балл есть, а когда ноль</h3>
      <div className="example-list">{reference.examples.map((example) => <article className="card example-card" key={example.title}>
        <span className={`example-kind ${example.kind}`}>{example.kind === 'official' ? 'ФИПИ: разбор ответа' : 'Учебный случай'}</span>
        <h4>{example.title}</h4><p>{example.situation}</p><strong>{example.outcome}</strong>
        <a href={`${task.source.url}#page=${example.page}`} target="_blank" rel="noreferrer">{example.kind === 'official' ? 'Открыть разбор ФИПИ' : 'Открыть шкалу ФИПИ'} ↗</a>
      </article>)}</div></section></div>
  </section>;
}
