import type { AssessmentDraft, AspectMark, RubricTask } from '../rubric/types';
import { MARK_EXPLANATIONS } from '../rubric/fipi2026';

interface Props {
  task: RubricTask;
  draft: AssessmentDraft;
  onChange: (next: AssessmentDraft) => void;
}

function NumberInput({ label, value, onChange }: { label: string; value: number | null | undefined; onChange: (value: number | null) => void }) {
  return <label className="field"><span>{label}</span><input type="number" min="0" step="1" value={value ?? ''}
    onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} /></label>;
}

function Choice({ label, value, onChange }: { label: string; value: boolean | null | undefined; onChange: (value: boolean | null) => void }) {
  return <fieldset className="choice"><legend>{label}</legend><button type="button" aria-pressed={value === true} className={value === true ? 'selected' : ''}
    onClick={() => onChange(true)}>Да</button><button type="button" aria-pressed={value === false} className={value === false ? 'selected' : ''}
    onClick={() => onChange(false)}>Нет</button></fieldset>;
}

export default function AssessmentForm({ task, draft, onChange }: Props) {
  const set = <K extends keyof AssessmentDraft>(key: K, value: AssessmentDraft[K]) => onChange({ ...draft, [key]: value });
  const isWriting = task.section === 'Письменная речь';
  return <div className="form-stack">
    <section className="card">
      <div className="section-heading"><span className="eyebrow">01 / Ответ</span><h2>{task.title}</h2></div>
      <label className="check-row"><input type="checkbox" checked={draft.noAnswer} onChange={(event) => set('noAnswer', event.target.checked)} /> Ответ отсутствует</label>
      {task.id === 'speaking1' ? <div className="question-list">
        <p className="muted">Засчитайте вопрос, если он соответствует коммуникативной задаче и понятен слушателю.</p>
        {Array.from({ length: 5 }, (_, index) => <div className="question-row" key={index}>
          <span>Вопрос {index + 1}</span><div className="segment">
            <button type="button" aria-label={`Вопрос ${index + 1}: засчитать`} aria-pressed={draft.questionAccepted?.[index] === true}
              className={draft.questionAccepted?.[index] === true ? 'selected' : ''} onClick={() => {
                const next = [...(draft.questionAccepted ?? Array(5).fill(null))]; next[index] = true; set('questionAccepted', next);
              }}>1 балл</button>
            <button type="button" aria-label={`Вопрос ${index + 1}: не засчитать`} aria-pressed={draft.questionAccepted?.[index] === false}
              className={draft.questionAccepted?.[index] === false ? 'selected' : ''} onClick={() => {
                const next = [...(draft.questionAccepted ?? Array(5).fill(null))]; next[index] = false; set('questionAccepted', next);
              }}>0 баллов</button>
          </div></div>)}
      </div> : <div className="aspect-list">
        <p className="muted">Отметьте каждый аспект содержания. <strong>+</strong> — полно, <strong>±</strong> — неполно, <strong>−</strong> — отсутствует.</p>
        {task.aspects.map((aspect, index) => <div className="aspect-row" key={aspect}>
          <div className="aspect-text"><span className="aspect-index">{String(index + 1).padStart(2, '0')}</span><span>{aspect}</span></div>
          <div className="segment" aria-label={`Аспект ${index + 1}`}>
            {(['+', '±', '−'] as Exclude<AspectMark, null>[]).map((mark) => <button type="button" key={mark} title={MARK_EXPLANATIONS[mark]}
              aria-label={`Аспект ${index + 1}: ${mark === '+' ? 'полно' : mark === '±' ? 'неполно' : 'отсутствует'}`}
              aria-pressed={draft.aspects[index] === mark} className={draft.aspects[index] === mark ? 'selected' : ''}
              onClick={() => { const next = [...draft.aspects]; next[index] = mark; set('aspects', next); }}>{mark}</button>)}
          </div></div>)}
      </div>}
    </section>
    {task.id !== 'speaking1' && <section className="card">
      <div className="section-heading"><span className="eyebrow">02 / Параметры</span><h2>Объём и ошибки</h2></div>
      <div className="field-grid">
        {isWriting ? <NumberInput label="Число знаков" value={draft.characterCount} onChange={(value) => set('characterCount', value)} />
          : <NumberInput label="Число фраз" value={draft.phraseCount} onChange={(value) => set('phraseCount', value)} />}
        {task.id !== 'speaking2' && <NumberInput label="Ошибки в организации" value={draft.organizationErrors} onChange={(value) => set('organizationErrors', value)} />}
        <NumberInput label="Лексико-грамматические ошибки" value={draft.lexicalGrammarErrors} onChange={(value) => set('lexicalGrammarErrors', value)} />
        {isWriting ? <><NumberInput label="Иероглифические ошибки" value={draft.hanziErrors} onChange={(value) => set('hanziErrors', value)} />
          <NumberInput label="Пунктуационные ошибки" value={draft.punctuationErrors} onChange={(value) => set('punctuationErrors', value)} /></>
          : <NumberInput label="Фонетические ошибки" value={draft.phoneticErrors} onChange={(value) => set('phoneticErrors', value)} />}
        {task.id === 'speaking3' && <><NumberInput label="Из них грубые лексико-грамматические" value={draft.grossLexicalGrammarErrors} onChange={(value) => set('grossLexicalGrammarErrors', value)} />
          <NumberInput label="Из них грубые фонетические" value={draft.grossPhoneticErrors} onChange={(value) => set('grossPhoneticErrors', value)} /></>}
      </div>
      {isWriting && <>
        {draft.characterCount !== null && draft.characterCount !== undefined && draft.characterCount > (task.id === 'writing28' ? 209 : 220)
          && <Choice label={`Отметки выставлены только за первые ${task.id === 'writing28' ? 190 : 200} знаков`} value={draft.assessedFragmentConfirmed}
            onChange={(value) => set('assessedFragmentConfirmed', value)} />}
        {task.id === 'writing29' && <Choice label="Установлено совпадение с опубликованным источником свыше 30%" value={draft.plagiarismOver30}
          onChange={(value) => set('plagiarismOver30', value)} />}
      </>}
      {task.id === 'speaking2' && <div className="choices-grid">
        <Choice label="Есть вступление" value={draft.hasIntroduction} onChange={(value) => set('hasIntroduction', value)} />
        <Choice label="Есть заключение" value={draft.hasConclusion} onChange={(value) => set('hasConclusion', value)} />
        <Choice label="Высказывание логично" value={draft.isLogical} onChange={(value) => set('isLogical', value)} />
        <Choice label="Достаточно средств связи" value={draft.linksAdequate} onChange={(value) => set('linksAdequate', value)} />
      </div>}
      {task.id === 'speaking3' && <div className="choices-grid">
        <Choice label="Есть вступление" value={draft.hasIntroduction} onChange={(value) => set('hasIntroduction', value)} />
        <Choice label="Есть заключение" value={draft.hasConclusion} onChange={(value) => set('hasConclusion', value)} />
      </div>}
    </section>}
    {task.id !== 'speaking1' && <section className="card">
      <div className="section-heading"><span className="eyebrow">03 / Экспертное решение</span><h2>Уточнение по шкале ФИПИ</h2></div>
      <p className="muted">Для пограничных случаев выберите балл после сверки с полной таблицей. Выбор заменяет автоматический уровень по этому критерию.</p>
      <div className="field-grid">
        {task.criteria.map((criterion) => <label className="field" key={criterion.id}><span>{criterion.title}</span>
          <select value={draft.expertLevels?.[criterion.id as keyof NonNullable<AssessmentDraft['expertLevels']>] ?? ''}
            onChange={(event) => {
              const next = { ...draft.expertLevels };
              const key = criterion.id as keyof NonNullable<AssessmentDraft['expertLevels']>;
              if (event.target.value === '') delete next[key]; else next[key] = Number(event.target.value);
              set('expertLevels', next);
            }}><option value="">Автоматически</option>{criterion.levels.map((level) => <option key={level.score} value={level.score}>{level.score} балл{level.score === 1 ? '' : level.score >= 2 && level.score <= 4 ? 'а' : 'ов'}</option>)}</select>
        </label>)}
      </div>
    </section>}
  </div>;
}
