import type { AssessmentDraft, RubricTask, ScoreResult } from '../rubric/types';
import { criterionCode } from '../rubric/criterion-code';
import { explainCriterion } from '../rubric/explain';

export default function ScorePanel({ task, draft, result }: { task: RubricTask; draft: AssessmentDraft; result: ScoreResult }) {
  const explanations = task.criteria.map((criterion) => explainCriterion(draft, result, criterion.id));
  const remainingReasons = result.reasons.filter((reason) => !explanations.includes(reason));
  return <section className="score-panel" aria-live="polite">
    <span className="eyebrow">Результат проверки</span>
    <div className="total-line"><strong>{result.finalTotal ?? result.provisionalTotal} / {task.maxScore}</strong>
      <span className={result.finalTotal === null ? 'status pending' : 'status complete'}>{result.finalTotal === null ? 'Предварительно' : 'Итог'}</span></div>
    <div className="score-breakdown">{task.criteria.map((criterion, index) => {
      const explanation = explanations[index];
      return <div key={criterion.id}>
      <span>{criterionCode(task, index) ? `${criterionCode(task, index)} · ` : ''}{criterion.title}
        {explanation && <small>{explanation}</small>}</span>
      <strong>{result.criteria[criterion.id] ?? '—'} / {criterion.maxScore}</strong>
    </div>})}</div>
    {remainingReasons.length > 0 && <div className="messages reasons"><strong>Почему так</strong><ul>{remainingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}
    {result.missing.length > 0 && <div className="messages missing"><strong>Для итогового балла</strong><ul>{result.missing.map((missing) => <li key={missing}>{missing}</li>)}</ul></div>}
  </section>;
}
