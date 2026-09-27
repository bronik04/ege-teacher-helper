import { useState } from 'react';
import type { ChangeEvent } from 'react';
import AssessmentForm from './components/AssessmentForm';
import RecordList from './components/RecordList';
import PrintReport from './components/PrintReport';
import ReferencePage from './components/ReferencePage';
import RubricHelp from './components/RubricHelp';
import ScorePanel from './components/ScorePanel';
import { FIPI_2026 } from './rubric/fipi2026';
import { calculateAssessment } from './rubric/score';
import type { AssessmentDraft, AssessmentRecord, TaskId } from './rubric/types';
import { deleteRecord, loadRecords, saveRecord, writeRecords } from './storage/records';
import { exportRecords, importRecords } from './storage/transfer';
import { clearWorkingDraft, loadWorkingDraft, saveWorkingDraft } from './storage/working-draft';
import type { WorkingDraft } from './storage/working-draft';
import { filterRecords } from './storage/filter-records';
import type { RecordFilters } from './storage/filter-records';
import './styles.css';

const AUTOSAVE_ERROR = 'Не удалось автосохранить черновик. Введённые отметки остались на экране.';
const RESTORE_ERROR = 'Не удалось восстановить автосохранённый черновик. При следующем изменении сервис попробует сохранить текущую проверку.';

function freshDraft(taskId: TaskId): AssessmentDraft {
  return { taskId, rubricYear: 2026, noAnswer: false,
    aspects: FIPI_2026[taskId].aspects.map(() => null),
    ...(taskId === 'speaking1' ? { questionAccepted: Array(5).fill(null) } : {}),
  };
}

function initialState(): { records: AssessmentRecord[]; working: WorkingDraft | null; error: string } {
  let records: AssessmentRecord[] = [];
  let working: WorkingDraft | null = null;
  const errors: string[] = [];
  try { records = loadRecords(window.localStorage); }
  catch { errors.push('Не удалось прочитать сохранённые работы. Данные в браузере не изменены.'); }
  try { working = loadWorkingDraft(window.localStorage); }
  catch { errors.push(RESTORE_ERROR); }
  return { records, working, error: errors.join(' ') };
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsText(file);
  });
}

export default function App() {
  const [initial] = useState(initialState);
  const [records, setRecords] = useState(initial.records);
  const [error, setError] = useState(initial.error);
  const [view, setView] = useState<'check' | 'records' | 'reference' | 'report'>('check');
  const [reportRecordId, setReportRecordId] = useState<string | null>(null);
  const [referenceTaskId, setReferenceTaskId] = useState<TaskId>('writing28');
  const [draft, setDraft] = useState<AssessmentDraft>(() => initial.working?.draft ?? freshDraft('writing28'));
  const [label, setLabel] = useState(initial.working?.label ?? '');
  const [note, setNote] = useState(initial.working?.note ?? '');
  const [recordId, setRecordId] = useState<string | null>(initial.working?.recordId ?? null);
  const [createdAt, setCreatedAt] = useState<string | null>(initial.working?.createdAt ?? null);
  const [dirty, setDirty] = useState(initial.working !== null);
  const [notice, setNotice] = useState(initial.working ? 'Восстановлен автосохранённый черновик.' : '');
  const [importing, setImporting] = useState(false);
  const [recordFilters, setRecordFilters] = useState<RecordFilters>({ query: '', taskId: 'all', status: 'all' });
  const task = FIPI_2026[draft.taskId];
  const result = calculateAssessment(draft);
  const visibleRecords = filterRecords(records, recordFilters);
  const reportRecord = records.find((item) => item.id === reportRecordId);
  function openReference() { setReferenceTaskId(draft.taskId); setView('reference'); }

  function persistWorking(nextDraft: AssessmentDraft, nextLabel = label, nextNote = note) {
    try {
      saveWorkingDraft(window.localStorage, { draft: nextDraft, label: nextLabel, note: nextNote, recordId, createdAt });
      setError((previous) => previous.replace(AUTOSAVE_ERROR, '').replace(RESTORE_ERROR, '').trim());
    } catch { setError(AUTOSAVE_ERROR); }
  }
  function changeDraft(next: AssessmentDraft) { persistWorking(next); setDraft(next); setDirty(true); setNotice(''); }
  function leaveCurrent(): boolean { return !dirty || window.confirm('Есть несохранённые изменения. Продолжить?'); }
  function discardWorking(): boolean {
    try { clearWorkingDraft(window.localStorage); return true; }
    catch { setError('Не удалось удалить временный черновик. Проверьте доступность хранилища браузера.'); return false; }
  }
  function newCheck() {
    if (!leaveCurrent() || !discardWorking()) return;
    setDraft(freshDraft('writing28')); setLabel(''); setNote(''); setRecordId(null); setCreatedAt(null);
    setDirty(false); setNotice(''); setView('check');
  }
  function switchTask(taskId: TaskId) {
    if (taskId === draft.taskId || !leaveCurrent() || !discardWorking()) return;
    setDraft(freshDraft(taskId)); setLabel(''); setNote(''); setRecordId(null); setCreatedAt(null); setDirty(false); setNotice('');
  }
  function openRecord(record: AssessmentRecord) {
    if (!leaveCurrent() || !discardWorking()) return;
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
      try { clearWorkingDraft(window.localStorage); }
      catch { setError('Проверка сохранена, но временный черновик не удалось удалить.'); }
    } catch {
      setError('Не удалось сохранить проверку. Проверьте доступность хранилища браузера. Введённые отметки сохранены на экране.');
    }
  }
  function remove(record: AssessmentRecord) {
    if (!window.confirm(`Удалить проверку «${record.label || 'Без метки'}»?`)) return;
    try {
      deleteRecord(window.localStorage, record.id);
      setRecords(loadRecords(window.localStorage)); setError('');
    } catch { setError('Не удалось удалить проверку. Сохранённые данные не изменены.'); return; }
    if (recordId === record.id) {
      setRecordId(null); setCreatedAt(null);
      if (dirty) {
        try { saveWorkingDraft(window.localStorage, { draft, label, note, recordId: null, createdAt: null }); }
        catch { setError(AUTOSAVE_ERROR); }
      }
    }
  }
  function downloadExport() {
    try {
      const json = exportRecords(loadRecords(window.localStorage));
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = `ege-chinese-checks-2026-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError(''); setNotice('Файл проверок подготовлен к скачиванию.');
    } catch { setError('Не удалось экспортировать работы. Проверьте доступность хранилища браузера.'); }
  }
  async function uploadImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const json = await readFile(file);
      const imported = importRecords(json, loadRecords(window.localStorage));
      writeRecords(window.localStorage, imported.records);
      setRecords(imported.records); setError('');
      setNotice(`Импортировано: ${imported.added}. Пропущено совпадений: ${imported.skipped}.`);
    } catch (cause) {
      setError(`Не удалось импортировать файл: ${cause instanceof Error ? cause.message : 'неизвестная ошибка'}`);
    } finally { event.target.value = ''; setImporting(false); }
  }

  return <div className={view === 'report' ? 'app-shell print-mode' : 'app-shell'}>
    <header className="site-header"><div className="brand"><span className="brand-mark">中</span><div><strong>Эксперт ЕГЭ</strong><small>китайский язык</small></div></div>
      <span className="edition">Критерии ФИПИ · 2026</span></header>
    <main>
      <div className="hero"><div><span className="eyebrow">Проверка развёрнутых ответов</span><h1>Каждый балл — по критерию</h1>
        <p>Отмечайте содержание, ошибки и экспертные решения. Итог пересчитается сразу, а справка останется под рукой.</p></div>
        <div className="hero-figure" aria-hidden="true"><span>+</span><span>±</span><span>−</span></div></div>
      <nav className="tabs" aria-label="Разделы"><button type="button" className={view === 'check' ? 'active' : ''} onClick={newCheck}>Новая проверка</button>
        <button type="button" className={view === 'records' ? 'active' : ''} onClick={() => setView('records')}>Сохранённые работы <span className="tab-count" aria-hidden="true">{records.length}</span></button>
        <button type="button" className={view === 'reference' ? 'active' : ''} onClick={openReference}>Справочные материалы</button></nav>
      {error && <div className="alert" role="alert">{error}</div>}
      {notice && <div className="notice" role="status">{notice}</div>}
      {view === 'reference' ? <ReferencePage taskId={referenceTaskId} onTaskChange={setReferenceTaskId} onBack={() => setView('check')} />
      : view === 'report' && reportRecord ? <PrintReport record={reportRecord} onBack={() => setView('records')} />
      : view === 'records' ? <section className="saved-view"><div className="view-heading"><div><span className="eyebrow">Ваши проверки</span><h2>Сохранённые работы</h2></div>
        <span className="muted">Данные доступны в этом браузере</span></div>
        <div className="transfer-bar"><button type="button" onClick={() => setView('check')}>Вернуться к проверке</button>
          <div><button type="button" onClick={downloadExport}>Скачать JSON</button>
            <label className="import-label">Импорт JSON<input type="file" accept=".json,application/json" disabled={importing} onChange={uploadImport} /></label></div></div>
        <div className="record-filters" role="search" aria-label="Поиск сохранённых работ">
          <label className="field"><span>Поиск по метке</span><input type="search" value={recordFilters.query} placeholder="Метка ученика"
            onChange={(event) => setRecordFilters((current) => ({ ...current, query: event.target.value }))} /></label>
          <label className="field"><span>Фильтр по заданию</span><select value={recordFilters.taskId}
            onChange={(event) => setRecordFilters((current) => ({ ...current, taskId: event.target.value as RecordFilters['taskId'] }))}>
            <option value="all">Все задания</option>{Object.values(FIPI_2026).map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}
          </select></label>
          <label className="field"><span>Фильтр по статусу</span><select value={recordFilters.status}
            onChange={(event) => setRecordFilters((current) => ({ ...current, status: event.target.value as RecordFilters['status'] }))}>
            <option value="all">Все статусы</option><option value="complete">Готово</option><option value="draft">Черновик</option>
          </select></label>
          <div className="filter-summary"><span role="status">Найдено {visibleRecords.length} из {records.length}</span>
            <button type="button" onClick={() => setRecordFilters({ query: '', taskId: 'all', status: 'all' })}>Сбросить фильтры</button></div>
        </div>
        {records.length > 0 && visibleRecords.length === 0
          ? <div className="empty-state"><h2>Ничего не найдено</h2><p>Измените запрос или сбросьте фильтры.</p></div>
          : <RecordList records={visibleRecords} onOpen={openRecord} onPrint={(record) => { setReportRecordId(record.id); setView('report'); }} onDelete={remove} />}</section>
        : <>
          <div className="task-bar"><label htmlFor="task-select">Задание</label>
            <select id="task-select" value={draft.taskId} onChange={(event) => switchTask(event.target.value as TaskId)}>
              {Object.values(FIPI_2026).map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select>
            <span className="task-meta">{task.section} <span>·</span> до {task.maxScore} баллов</span></div>
          <div className="workspace-grid"><div className="main-column">
            <AssessmentForm task={task} draft={draft} onChange={changeDraft} />
            <RubricHelp task={task} onOpenReference={openReference} />
          </div><aside className="sidebar"><ScorePanel task={task} draft={draft} result={result} />
            <section className="card save-card"><span className="eyebrow">Сохранить работу</span>
              <label className="field"><span>Метка ученика</span><input value={label} maxLength={100} placeholder="Например, Ученик А"
                onChange={(event) => { persistWorking(draft, event.target.value, note); setLabel(event.target.value); setDirty(true); setNotice(''); }} /></label>
              <label className="field"><span>Заметка</span><textarea value={note} maxLength={1000} rows={3} placeholder="Необязательно"
                onChange={(event) => { persistWorking(draft, label, event.target.value); setNote(event.target.value); setDirty(true); setNotice(''); }} /></label>
              <button type="button" className="primary-button" onClick={save}>Сохранить проверку</button>
              <small>Текущие отметки сохраняются в этом браузере автоматически. Нажмите кнопку, чтобы добавить работу в список сохранённых.</small>
            </section></aside></div>
        </>}
    </main>
    <footer>Сервис помогает применить критерии. Окончательное экспертное решение принимает учитель.</footer>
  </div>;
}
