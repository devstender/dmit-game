import { useMemo, useState } from 'react'
import districtMapImage from '../assets/map.png'
import { mapLocations, quests, schoolLocations, type MapLocation, type Quest, type QuestStatus } from '../data/map'

type MapPanelProps = {
  open: boolean
  onClose: () => void
  currentSceneIndex: number
  playerFlags: string[]
  debugModeEnabled?: boolean
  onStartQuest: (sceneIndex: number, setupFlags?: string[], resetFlags?: string[]) => void
}

export function MapPanel({ open, onClose, currentSceneIndex, playerFlags, debugModeEnabled = false, onStartQuest }: MapPanelProps) {
  const [view, setView] = useState<'district' | 'school'>('district')
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [debugQuest, setDebugQuest] = useState<Quest | null>(null)
  const [debugSelections, setDebugSelections] = useState<Record<string, string>>({})
  const availableQuests = useMemo(() => quests.map((quest) => ({
    ...quest,
    status: debugModeEnabled ? 'active' as QuestStatus : resolveQuestStatus(quest, currentSceneIndex, playerFlags),
  })).filter((quest) => debugModeEnabled || quest.status !== 'locked'), [currentSceneIndex, debugModeEnabled, playerFlags])
  const mainQuests = availableQuests.filter((quest) => quest.type === 'main')
  const sideQuests = availableQuests.filter((quest) => quest.type === 'side')
  const locations = view === 'school' ? schoolLocations : mapLocations
  const title = view === 'school' ? 'Карта школы' : 'Карта района'
  const eyebrow = view === 'school' ? 'Школа № 76' : 'Арбеково'
  const questsByLocation = availableQuests.reduce<Record<string, Quest[]>>((byLocation, quest) => {
    byLocation[quest.locationId] = [...(byLocation[quest.locationId] ?? []), quest]
    return byLocation
  }, {})
  const selectedLocation = locations.find((location) => location.id === selectedLocationId)
  const selectedLocationQuests = selectedLocation ? questsByLocation[selectedLocation.id] ?? [] : []
  const startQuest = (quest: Quest) => {
    if (quest.startSceneIndex === undefined) return
    if (debugModeEnabled && quest.debugSetup?.length) {
      setDebugQuest(quest)
      setDebugSelections(Object.fromEntries(quest.debugSetup.map((group) => [group.id, group.options[0]?.id ?? ''])))
      return
    }
    onStartQuest(quest.startSceneIndex)
  }
  const startDebugQuest = () => {
    if (!debugQuest || debugQuest.startSceneIndex === undefined) return
    const setupFlags = debugQuest.debugSetup?.flatMap((group) => (
      group.options.find((option) => option.id === debugSelections[group.id])?.flags ?? []
    )) ?? []
    const resetFlags = debugQuest.debugSetup?.flatMap((group) => group.options.flatMap((option) => option.flags)) ?? []
    setDebugQuest(null)
    onStartQuest(debugQuest.startSceneIndex, setupFlags, resetFlags)
  }

  return (
    <section className={`map-panel ${open ? 'open' : ''}`} aria-label="Карта Арбеково">
      <div className="map-header"><div><span>{eyebrow}</span><h2>{title}</h2>{debugModeEnabled && <b className="debug-map-badge">DEV: все квесты открыты</b>}</div><button className="panel-close" onClick={onClose} aria-label="Закрыть карту">×</button></div>
      <div className="map-layout">
        <div className={`map-canvas ${view === 'school' ? 'school-map' : 'district-map'}`} aria-label="Локации на карте">
          <div className="map-workspace">
            {view === 'district' ? <img className="map-image" src={districtMapImage} alt="Карта Арбеково" /> : <SchoolBlueprint />}
            {locations.map((location) => (
              <MapLocationButton key={location.id} location={location} quests={questsByLocation[location.id] ?? []} onClick={() => {
                setSelectedLocationId(location.id)
                const startableQuest = questsByLocation[location.id]?.find((quest) => quest.status === 'active' && quest.startSceneIndex !== undefined)
                if (startableQuest?.startSceneIndex !== undefined) {
                  startQuest(startableQuest)
                  return
                }
                if (location.opens === 'school') setView('school')
              }} />
            ))}
          </div>
          {selectedLocation && <LocationInfoCard location={selectedLocation} quests={selectedLocationQuests} />}
          <p className="map-legend"><i className="main" /> Основное задание <i className="side" /> Побочное задание</p>
          {view === 'school' && <button className="map-back" onClick={() => { setView('district'); setSelectedLocationId(null) }}>← Район</button>}
        </div>
        <aside className="quest-board">
          <QuestList title="Основные квесты" quests={mainQuests} onStartQuest={startQuest} />
          <QuestList title="Побочные квесты" quests={sideQuests} onStartQuest={startQuest} />
        </aside>
      </div>
      {debugQuest && (
        <div className="debug-setup-overlay" role="dialog" aria-modal="true" aria-label="Параметры запуска квеста">
          <section className="debug-setup-dialog">
            <span className="debug-eyebrow">DEV запуск квеста</span>
            <h2>{debugQuest.title}</h2>
            <p>Выбери прошлые решения, с которыми Дмит начнёт этот квест. Я проставлю нужные флаги перед стартом.</p>
            <div className="debug-setup-groups">
              {debugQuest.debugSetup?.map((group) => (
                <fieldset className="debug-setup-group" key={group.id}>
                  <legend>{group.title}</legend>
                  {group.description && <small>{group.description}</small>}
                  <div className="debug-setup-options">
                    {group.options.map((option) => (
                      <label key={option.id} className={debugSelections[group.id] === option.id ? 'selected' : ''}>
                        <input
                          type="radio"
                          name={group.id}
                          checked={debugSelections[group.id] === option.id}
                          onChange={() => setDebugSelections((current) => ({ ...current, [group.id]: option.id }))}
                        />
                        <span><strong>{option.label}</strong>{option.description && <em>{option.description}</em>}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="debug-setup-actions">
              <button onClick={() => setDebugQuest(null)}>Отмена</button>
              <button className="primary" onClick={startDebugQuest}>Запустить с этими решениями</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function resolveQuestStatus(quest: Quest, currentSceneIndex: number, playerFlags: string[]): QuestStatus {
  if (quest.completedByFlags?.some((flag) => playerFlags.includes(flag))) return 'completed'
  if (quest.completedAfterSceneIndex !== undefined && currentSceneIndex >= quest.completedAfterSceneIndex) return 'completed'
  const availableByFlag = quest.availableByFlags?.some((flag) => playerFlags.includes(flag)) ?? false
  if (quest.availableAfterSceneIndex !== undefined && currentSceneIndex < quest.availableAfterSceneIndex && !availableByFlag) return 'locked'
  if (quest.availableByFlags && !availableByFlag && quest.availableAfterSceneIndex === undefined) return 'locked'
  return quest.status
}

function MapLocationButton({ location, quests: locationQuests, onClick }: { location: MapLocation; quests: Quest[]; onClick: () => void }) {
  const activeQuest = locationQuests.find((quest) => quest.status === 'active')
  const completedQuest = locationQuests.find((quest) => quest.status === 'completed')
  const hasQuest = locationQuests.length > 0
  const hasStartableQuest = locationQuests.some((quest) => quest.status === 'active' && quest.startSceneIndex !== undefined)
  const questType = activeQuest?.type ?? completedQuest?.type ?? location.questType
  const badgeStatus = activeQuest ? 'active' : completedQuest ? 'completed' : undefined

  return (
    <button
      className={`map-location-zone ${questType ?? ''} ${hasQuest ? 'has-quest' : ''} ${activeQuest ? 'has-active-quest' : ''} ${completedQuest && !activeQuest ? 'has-completed-quest' : ''} ${hasStartableQuest ? 'startable' : ''} ${location.opens ? 'openable' : ''}`}
      onClick={onClick}
      style={{ left: `${location.x}%`, top: `${location.y}%`, width: `${location.width}%`, height: `${location.height}%` }}
      aria-label={location.name}
    >
      {badgeStatus && <span className={`map-quest-badge ${questType} ${badgeStatus}`}>{badgeStatus === 'completed' ? '✓' : '!'}</span>}
      <b className="map-location-name">{location.name}</b>
      <span className="map-location-tooltip">
        <strong>{location.name}</strong>
        <small>{location.description}</small>
        {locationQuests.map((quest) => <em className={`quest-tooltip ${quest.type} ${quest.status}`} key={quest.id}>{quest.type === 'main' ? 'Основной' : 'Побочный'} квест: {quest.title} · {statusLabel[quest.status]}</em>)}
        {hasStartableQuest && <em>Начать квест</em>}
        {location.opens && <em>Открыть подробную карту</em>}
      </span>
    </button>
  )
}

const statusLabel: Record<QuestStatus, string> = {
  locked: 'Недоступен',
  active: 'Активен',
  completed: 'Завершён',
}

function LocationInfoCard({ location, quests: locationQuests }: { location: MapLocation; quests: Quest[] }) {
  return (
    <article className="map-location-card">
      <strong>{location.name}</strong>
      <span>{location.description}</span>
      {locationQuests.length > 0 && <div>
        {locationQuests.map((quest) => (
          <em className={`quest-tooltip ${quest.type} ${quest.status}`} key={quest.id}>
            {quest.type === 'main' ? 'Основной' : 'Побочный'} квест: {quest.title} · {statusLabel[quest.status]}
          </em>
        ))}
      </div>}
    </article>
  )
}

function SchoolBlueprint() {
  return (
    <div className="school-blueprint" aria-hidden="true">
      <div className="school-wing main-wing" />
      <div className="school-wing hall-wing" />
      <div className="school-wing gym-wing" />
      <div className="school-corridor horizontal" />
      <div className="school-corridor vertical" />
    </div>
  )
}

function QuestList({ title, quests: list, onStartQuest }: { title: string; quests: Quest[]; onStartQuest: (quest: Quest) => void }) {
  return (
    <section className="quest-list">
      <h3>{title}</h3>
      {list.length > 0 ? list.map((quest) => {
        const startable = quest.status === 'active' && quest.startSceneIndex !== undefined
        return (
          <article key={quest.id} className={`${quest.status} ${startable ? 'startable' : ''}`}>
            <div><strong>{quest.title}</strong><span>{quest.description}</span></div>
            {startable ? <button onClick={() => onStartQuest(quest)}>Старт</button> : <i>{quest.status === 'completed' ? '✓' : '!'}</i>}
          </article>
        )
      }) : <p className="quest-empty">Пока нет активных задач.</p>}
    </section>
  )
}
