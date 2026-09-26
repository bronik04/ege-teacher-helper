import { useState } from 'react';
import { FIPI_2026 } from './rubric/fipi2026';
import type { TaskId } from './rubric/types';

export default function App() {
  const [taskId, setTaskId] = useState<TaskId>('writing28');
  const task = FIPI_2026[taskId];

  return <main>
    <h1>Проверка ЕГЭ по китайскому языку</h1>
    <p>Критерии ФИПИ · 2026</p>
    <label htmlFor="task-select">Задание</label>{' '}
    <select id="task-select" value={taskId} onChange={(event) => setTaskId(event.target.value as TaskId)}>
      {Object.values(FIPI_2026).map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}
    </select>
    <h2>{task.title}</h2>
    <p>Максимум: {task.maxScore}</p>
    <a href={`${task.source.url}#page=${task.source.pages[0]}`} target="_blank" rel="noreferrer">Критерии ФИПИ, с. {task.source.pages.join('–')}</a>
  </main>;
}
