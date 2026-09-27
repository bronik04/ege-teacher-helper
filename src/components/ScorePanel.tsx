import type { RubricTask, ScoreResult } from '../rubric/types';
import { criterionCode } from '../rubric/criterion-code';

export default function ScorePanel({ task, result }: { task: RubricTask; result: ScoreResult }) {
  return <section className="score-panel" aria-live="polite">
    <span className="eyebrow">Результат проверки</span>
    <div className="total-line"><strong>{result.finalTotal ?? result.provisionalTotal} / {task.maxScore}</strong>
      <span className={result.finalTotal === null ? 'status pending' : 'status complete'}>{result.finalTotal === null ? 'Предварительно' : 'Итог'}</span></div>
    <div className="score-breakdown">{task.criteria.map((criterion, index) => <div key={criterion.id}>
      <span>{criterionCode(task, index) ? `${criterionCode(task, index)} · ` : ''}{criterion.title}</span><strong>{result.criteria[criterion.id] ?? '—'} / {criterion.maxScore}</strong>
    </div>)}</div>
    {result.reasons.length > 0 && <div className="messages reasons"><strong>Почему так</strong><ul>{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}
    {result.missing.length > 0 && <div className="messages missing"><strong>Для итогового балла</strong><ul>{result.missing.map((missing) => <li key={missing}>{missing}</li>)}</ul></div>}
  </section>;
}
