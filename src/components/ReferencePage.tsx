import { FIPI_2026, SPEAKING1_QUESTION_LEVELS } from '../rubric/fipi2026';
import { criterionCode } from '../rubric/criterion-code';
import { REFERENCE_EXAMPLES, type ReferenceExample } from '../rubric/reference-examples';
import type { RubricTask, TaskId } from '../rubric/types';

function scoreLabel(score: number): string {
  return `${score} ${score === 1 ? 'балл' : score > 1 && score < 5 ? 'балла' : 'баллов'}`;
}

function ExampleCard({ example, task }: { example: ReferenceExample; task: RubricTask }) {
  const sourceAction = example.kind === 'official' ? 'Открыть разбор ФИПИ' : 'Открыть шкалу ФИПИ';
  const sourceDocument = task.section === 'Письменная речь' ? 'Письменная речь' : 'Говорение';
  const result = example.total === null
    ? task.id === 'speaking1' ? 'Остальные вопросы не оценивались' : 'Остальные критерии не оценивались'
    : `Итого ${example.total} из ${task.maxScore}`;

  return <article className="card example-card" aria-label={example.title}>
    <span className={`example-kind ${example.kind}`}>{example.kind === 'official' ? 'ФИПИ: разбор ответа' : 'Учебный случай'}</span>
    <h4>{example.title}</h4>
    <strong className="example-total">{result}</strong>
    <details className="example-details">
      <summary>Разбор по критериям</summary>
      <div className="example-body">
        <p><b>Задача:</b> {example.prompt}</p>
        <div className="example-excerpt"><span>{example.excerptKind === 'fragment' ? 'Фрагмент ответа' : 'Полный ответ'}</span>
          <p lang={/[\u3400-\u9fff]/u.test(example.excerpt) ? 'zh' : 'ru'}>{example.excerpt}</p></div>
        <h5>Аспекты</h5><ul className="example-aspects">{example.aspects.map((aspect) => <li key={aspect}>{aspect}</li>)}</ul>
        <h5>Баллы и основания</h5><ul className="example-criteria">{example.criteria.map((criterion) => <li key={criterion.code}>
          <strong>{criterion.code} — {scoreLabel(criterion.score)}</strong><span>{criterion.reason}</span></li>)}</ul>
        {example.zeroReason && <p className="example-zero">{example.zeroReason}</p>}
        <p className="example-source">{example.kind === 'official' ? 'Разбор' : 'Шкала'}: ФИПИ 2026, с. {example.page} · {sourceDocument}</p>
      </div>
    </details>
    <a href={`${task.source.url}#page=${example.page}`} target="_blank" rel="noreferrer">{sourceAction}, с. {example.page} ↗</a>
  </article>;
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
      <p>Опубликованные разборы ФИПИ пересказаны кратко. Учебные случаи составлены для пояснения шкалы и не являются работами участников экзамена. Фрагменты и пояснения встроены в сервис; ссылки на PDF ФИПИ открываются при подключении.</p></div>
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
    </section><section className="reference-examples"><span className="eyebrow">На примерах</span><h3>Как получился балл</h3>
      <div className="example-list">{reference.examples.map((example) => <ExampleCard example={example} task={task} key={example.id} />)}</div>
    </section></div>
  </section>;
}
