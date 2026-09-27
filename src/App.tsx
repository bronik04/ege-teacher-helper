import { useState } from 'react';
import AssessmentForm from './components/AssessmentForm';
import RecordList from './components/RecordList';
import RubricHelp from './components/RubricHelp';
import ScorePanel from './components/ScorePanel';
import { FIPI_2026 } from './rubric/fipi2026';
import { calculateAssessment } from './rubric/score';
import type { AssessmentDraft, AssessmentRecord, TaskId } from './rubric/types';
import { deleteRecord, loadRecords, saveRecord } from './storage/records';
import './styles.css';

function freshDraft(taskId: TaskId): AssessmentDraft {
  return { taskId, rubricYear: 2026, noAnswer: false,
    aspects: FIPI_2026[taskId].aspects.map(() => null),
    ...(taskId === 'speaking1' ? { questionAccepted: Array(5).fill(null) } : {}),
  };
}

function savedRecords(): { records: AssessmentRecord[]; error: string } {
  try { return { records: loadRecords(window.localStorage), error: '' }; }
  catch { return { records: [], error: 'Не удалось прочитать сохранённые работы. Данные в браузере не изменены.' }; }
}

export default function App() {
  const [initial] = useState(savedRecords);
  const [records, setRecords] = useState(initial.records);
  const [error, setError] = useState(initial.error);
  const [view, setView] = useState<'check' | 'records'>('check');
  const [draft, setDraft] = useState<AssessmentDraft>(() => freshDraft('writing28'));
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [recordId, setRecordId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const task = FIPI_2026[draft.taskId];
  const result = calculateAssessment(draft);

  function changeDraft(next: AssessmentDraft) { setDraft(next); setDirty(true); setNotice(''); }
  function leaveCurrent(): boolean { return !dirty || window.confirm('Есть несохранённые изменения. Продолжить?'); }
  function newCheck() {
    if (!leaveCurrent()) return;
    setDraft(freshDraft('writing28')); setLabel(''); setNote(''); setRecordId(null); setCreatedAt(null);
    setDirty(false); setNotice(''); setView('check');
  }
  function switchTask(taskId: TaskId) {
    if (taskId === draft.taskId || !leaveCurrent()) return;
    setDraft(freshDraft(taskId)); setLabel(''); setNote(''); setRecordId(null); setCreatedAt(null); setDirty(false); setNotice('');
  }
  function openRecord(record: AssessmentRecord) {
    if (!leaveCurrent()) return;
    setDraft(record.draft); setLabel(record.label); setNote(record.note); setRecordId(record.id);
    setCreatedAt(record.createdAt); setDirty(false); setNotice(''); setError(''); setView('check');
  }
  function save() {
    const now = new Date().toISOString();
    const record: AssessmentRecord = {
      id: recordId ?? crypto.randomUUID(), createdAt: createdAt ?? now, updatedAt: now,
      label: label.trim(), note: note.trim(), draft,
    };
    try {
      saveRecord(window.localStorage, record);
      setRecords(loadRecords(window.localStorage)); setRecordId(record.id); setCreatedAt(record.createdAt);
      setDirty(false); setError(''); setNotice(result.finalTotal === null ? 'Черновик сохранён.' : 'Проверка сохранена.');
    } catch {
      setError('Не удалось сохранить проверку. Проверьте доступность хранилища браузера. Введённые отметки сохранены на экране.');
    }
  }
  function remove(record: AssessmentRecord) {
    if (!window.confirm(`Удалить проверку «${record.label || 'Без метки'}»?`)) return;
    try {
      deleteRecord(window.localStorage, record.id);
      setRecords(loadRecords(window.localStorage)); setError('');
      if (recordId === record.id) { setRecordId(null); setCreatedAt(null); }
    } catch { setError('Не удалось удалить проверку. Сохранённые данные не изменены.'); }
  }

  return <div className="app-shell">
    <header className="site-header"><div className="brand"><span className="brand-mark">中</span><div><strong>Эксперт ЕГЭ</strong><small>китайский язык</small></div></div>
      <span className="edition">Критерии ФИПИ · 2026</span></header>
    <main>
      <div className="hero"><div><span className="eyebrow">Проверка развёрнутых ответов</span><h1>Каждый балл — по критерию</h1>
        <p>Отмечайте содержание, ошибки и экспертные решения. Итог пересчитается сразу, а справка останется под рукой.</p></div>
        <div className="hero-figure" aria-hidden="true"><span>+</span><span>±</span><span>−</span></div></div>
      <nav className="tabs" aria-label="Разделы"><button type="button" className={view === 'check' ? 'active' : ''} onClick={newCheck}>Новая проверка</button>
        <button type="button" className={view === 'records' ? 'active' : ''} onClick={() => setView('records')}>Сохранённые работы <span className="tab-count" aria-hidden="true">{records.length}</span></button></nav>
      {error && <div className="alert" role="alert">{error}</div>}
      {notice && <div className="notice" role="status">{notice}</div>}
      {view === 'records' ? <section className="saved-view"><div className="view-heading"><div><span className="eyebrow">Ваши проверки</span><h2>Сохранённые работы</h2></div>
        <span className="muted">Данные доступны в этом браузере</span></div><RecordList records={records} onOpen={openRecord} onDelete={remove} /></section>
        : <>
          <div className="task-bar"><label htmlFor="task-select">Задание</label>
            <select id="task-select" value={draft.taskId} onChange={(event) => switchTask(event.target.value as TaskId)}>
              {Object.values(FIPI_2026).map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select>
            <span className="task-meta">{task.section} <span>·</span> до {task.maxScore} баллов</span></div>
          <div className="workspace-grid"><div className="main-column">
            <AssessmentForm task={task} draft={draft} onChange={changeDraft} />
            <RubricHelp task={task} />
          </div><aside className="sidebar"><ScorePanel task={task} result={result} />
            <section className="card save-card"><span className="eyebrow">Сохранить работу</span>
              <label className="field"><span>Метка ученика</span><input value={label} maxLength={100} placeholder="Например, Ученик А"
                onChange={(event) => { setLabel(event.target.value); setDirty(true); }} /></label>
              <label className="field"><span>Заметка</span><textarea value={note} maxLength={1000} rows={3} placeholder="Необязательно"
                onChange={(event) => { setNote(event.target.value); setDirty(true); }} /></label>
              <button type="button" className="primary-button" onClick={save}>Сохранить проверку</button>
              <small>Можно сохранить предварительный результат как черновик.</small>
            </section></aside></div>
        </>}
    </main>
    <footer>Сервис помогает применить критерии. Окончательное экспертное решение принимает учитель.</footer>
  </div>;
}
