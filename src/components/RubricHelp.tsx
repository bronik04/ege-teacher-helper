import type { RubricTask } from '../rubric/types';

export default function RubricHelp({ task }: { task: RubricTask }) {
  return <section className="card help-card">
    <div className="section-heading"><span className="eyebrow">Справка</span><h2>Критерии оценивания</h2></div>
    <p className="muted">Краткая памятка по официальным материалам ФИПИ, 2026 год. Для спорных случаев откройте полную шкалу.</p>
    <div className="criterion-list">{task.criteria.map((item) => <details key={item.id}>
      <summary><span>{item.title}</span><strong>до {item.maxScore}</strong></summary>
      <p>{item.help}</p>
      <ol>{item.levels.map((level) => <li key={level.score}><strong>{level.score}</strong> — {level.description}</li>)}</ol>
    </details>)}</div>
    <a className="source-link" href={`${task.source.url}#page=${task.source.pages[0]}`} target="_blank" rel="noreferrer">
      Открыть источник ФИПИ <span>↗</span>
    </a>
    <p className="source-meta">Таблицы: с. {task.source.pages.join('–')} PDF</p>
  </section>;
}
