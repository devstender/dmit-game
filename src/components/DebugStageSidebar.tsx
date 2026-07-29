import { useMemo, useState } from 'react'
import type { Chapter } from '../types/story'
import { DebugQuestGraph } from './DebugQuestGraph'

type DebugStageSidebarProps = {
  chapter: Chapter
  currentSceneIndex: number
  open: boolean
  onClose: () => void
  onSelectStage: (sceneIndex: number) => void
}

const excerpt = (text: string, length = 82) => text.length > length ? `${text.slice(0, length).trimEnd()}…` : text

export function DebugStageSidebar({ chapter, currentSceneIndex, open, onClose, onSelectStage }: DebugStageSidebarProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'graph' | 'list'>('graph')
  const [graphFullscreen, setGraphFullscreen] = useState(false)
  const stages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')
    return chapter.scenes.map((scene, index) => ({ scene, index })).filter(({ scene, index }) => {
      if (!normalizedQuery) return true
      return `${index + 1} ${scene.speaker} ${scene.text}`.toLocaleLowerCase('ru-RU').includes(normalizedQuery)
    })
  }, [chapter.scenes, query])

  return (
    <aside className={`debug-stage-sidebar ${open ? 'open' : ''} ${graphFullscreen ? 'graph-fullscreen' : ''}`} aria-label="Отладка квеста">
      <div className="debug-stage-heading">
        <div><span>DEV · {chapter.title}</span><h2>Этапы квеста</h2></div>
        <button className="panel-close" onClick={() => { setGraphFullscreen(false); onClose() }} aria-label="Закрыть отладку">×</button>
      </div>
      <div className="debug-stage-tabs" role="tablist" aria-label="Вид отладки">
        <button className={view === 'graph' ? 'active' : ''} onClick={() => setView('graph')} role="tab" aria-selected={view === 'graph'}>Граф путей</button>
        <button className={view === 'list' ? 'active' : ''} onClick={() => { setView('list'); setGraphFullscreen(false) }} role="tab" aria-selected={view === 'list'}>Список сцен</button>
      </div>
      {view === 'graph' ? (
        <>
          <p className="debug-stage-help">Жёлтая нода — текущий этап. Нажмите любую ноду, чтобы перейти к её началу. Колёсико масштабирует, перетаскивание двигает граф.</p>
          <DebugQuestGraph
            chapter={chapter}
            currentSceneIndex={currentSceneIndex}
            onSelectStage={onSelectStage}
            fullscreen={graphFullscreen}
            onToggleFullscreen={() => setGraphFullscreen((current) => !current)}
          />
        </>
      ) : (
        <>
          <label className="debug-stage-search">
            <span>Поиск реплики или номера</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: охранник" />
          </label>
          <p className="debug-stage-help">Выбор запускает этап сразу. Текущие временные интерактивы сбрасываются, а кат-сцена не блокирует переход.</p>
          <div className="debug-stage-list">
            {stages.map(({ scene, index }) => (
              <button
                className={`debug-stage-item ${index === currentSceneIndex ? 'active' : ''}`}
                key={`${index}-${scene.speaker}-${scene.text}`}
                onClick={() => onSelectStage(index)}
              >
                <b>{String(index + 1).padStart(4, '0')}</b>
                <span><strong>{scene.speaker}</strong><small>{excerpt(scene.text)}</small></span>
              </button>
            ))}
            {stages.length === 0 && <p className="debug-stage-empty">Ничего не найдено.</p>}
          </div>
        </>
      )}
    </aside>
  )
}
