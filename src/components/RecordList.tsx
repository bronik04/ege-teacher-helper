import { FIPI_2026 } from '../rubric/fipi2026';
import { calculateAssessment } from '../rubric/score';
import type { AssessmentRecord } from '../rubric/types';

export default function RecordList({ records, onOpen, onDelete }: {
  records: AssessmentRecord[]; onOpen: (record: AssessmentRecord) => void; onDelete: (record: AssessmentRecord) => void;
}) {
  if (records.length === 0) return <div className="empty-state"><h2>Пока нет сохранённых работ</h2><p>Проверку можно сохранить даже до выставления итогового балла.</p></div>;
  return <div className="record-list">{records.map((record) => {
    const task = FIPI_2026[record.draft.taskId];
    const result = calculateAssessment(record.draft);
    return <article className="record-card" key={record.id}>
      <div><span className="eyebrow">{task.shortTitle} · ФИПИ {record.draft.rubricYear}</span>
        <h2>{record.label || 'Без метки'}</h2><p>{record.note || 'Без заметки'}</p>
        <small>Обновлено: {new Date(record.updatedAt).toLocaleString('ru-RU')}</small></div>
      <div className="record-actions"><strong>{result.finalTotal === null ? 'Черновик' : `${result.finalTotal} / ${task.maxScore}`}</strong>
        <button type="button" onClick={() => onOpen(record)}>Открыть</button>
        <button type="button" className="text-danger" onClick={() => onDelete(record)}>Удалить</button></div>
    </article>;
  })}</div>;
}
