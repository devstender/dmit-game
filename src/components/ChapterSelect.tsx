import type { PlayerState } from '../data/player'
import type { StoryChapterId } from '../data/saveGame'
import type { Chapter } from '../types/story'

type ChapterSelectProps = {
  chapter: Chapter
  chapterTwo: Chapter
  player: PlayerState
  sceneIndex: number
  activeChapterId: StoryChapterId
  debugAvailable: boolean
  onReplay: () => void
  onStartChapter: (chapterId: StoryChapterId) => void
  onBack: () => void
}

const upcomingChapters = [
  { number: 2, title: 'Дворовые правила', subtitle: 'Скоро' },
  { number: 3, title: 'Выше района', subtitle: 'Скоро' },
  { number: 4, title: 'Свои люди', subtitle: 'Скоро' },
  { number: 5, title: 'Арбеково помнит', subtitle: 'Скоро' },
]

const hasAnyFlag = (flags: string[], candidates: string[]) => candidates.some((flag) => flags.includes(flag))

function chapterOneProgress(player: PlayerState, sceneIndex: number) {
  const { flags } = player
  if (flags.includes('CHAPTER_1_SMALL_SCHOOL_EXIT_COMPLETE')) return 100

  let progress = Math.min(16, Math.round((sceneIndex / 56) * 16))
  if (hasAnyFlag(flags, ['geography-grade-2', 'geography-grade-3', 'geography-grade-4', 'geography-grade-5'])) progress = Math.max(progress, 20)
  if (hasAnyFlag(flags, ['CHAPTER_1_HELPED_MISHGAN', 'CHAPTER_1_LEFT_MISHGAN'])) progress = Math.max(progress, 36)
  if (flags.includes('CHAPTER_1_RETURNED_HOME')) progress = Math.max(progress, 55)
  if (flags.includes('CHAPTER_1_MINIKA_BOOZE_DONE')) progress = Math.max(progress, 76)
  if (flags.includes('CHAPTER_1_SMALL_SCHOOL_MET_VADIM')) progress = Math.max(progress, 90)
  return Math.min(progress, 99)
}

export function ChapterSelect({ chapter, chapterTwo, player, sceneIndex, activeChapterId, debugAvailable, onReplay, onStartChapter, onBack }: ChapterSelectProps) {
  const progress = chapterOneProgress(player, sceneIndex)
  const complete = progress === 100

  return (
    <main className="chapter-select-screen">
      <div className="chapter-select-paper" aria-hidden="true" />
      <header className="chapter-select-header">
        <button onClick={onBack}>← В меню</button>
        <div>
          <span>История Дмита</span>
          <h1>Выбор главы</h1>
        </div>
        <b>{complete ? 'Глава 1 пройдена' : `Прогресс: ${progress}%`}</b>
      </header>

      <section className="chapter-grid" aria-label="Главы истории">
        <article className={`chapter-card available ${complete ? 'completed' : ''}`}>
          <div className="chapter-number">01</div>
          <span className="chapter-status">{complete ? 'Завершена' : 'В процессе'}</span>
          <h2>{chapter.title}</h2>
          <p>{chapter.subtitle}</p>
          <div className="chapter-progress" aria-label={`Прогресс главы: ${progress}%`}><b style={{ width: `${progress}%` }} /></div>
          <strong>{progress}%</strong>
          <div className="chapter-card-actions">
            {!complete && <button className="chapter-primary" onClick={() => onStartChapter('chapter-1')}>{activeChapterId === 'chapter-1' ? 'Продолжить' : 'Открыть главу'}</button>}
            <button className="chapter-secondary" onClick={onReplay}>{complete ? 'Перепройти' : 'Начать заново'}</button>
          </div>
        </article>

        <article className={`chapter-card ${debugAvailable ? 'available' : 'locked'} ${activeChapterId === 'chapter-2' ? 'completed' : ''}`} aria-label={`${chapterTwo.title}: ${debugAvailable ? 'доступна в режиме разработки' : 'пока недоступна'}`}>
          <div className="chapter-number">02</div>
          <span className="chapter-status">{debugAvailable ? 'DEV · доступна' : 'Скоро'}</span>
          <h2>{chapterTwo.title}</h2>
          <p>{chapterTwo.subtitle}</p>
          {debugAvailable ? (
            <div className="chapter-card-actions">
              <button className="chapter-primary" onClick={() => onStartChapter('chapter-2')}>{activeChapterId === 'chapter-2' ? 'Продолжить' : 'Запустить главу'}</button>
            </div>
          ) : <i aria-hidden="true">⌁</i>}
        </article>

        {upcomingChapters.filter((upcoming) => upcoming.number !== 2).map((upcoming) => (
          <article className="chapter-card locked" key={upcoming.number} aria-label={`${upcoming.title}: пока недоступна`}>
            <div className="chapter-number">{String(upcoming.number).padStart(2, '0')}</div>
            <span className="chapter-status">{upcoming.subtitle}</span>
            <h2>{upcoming.title}</h2>
            <p>Эта часть истории откроется в следующем обновлении.</p>
            <i aria-hidden="true">⌁</i>
          </article>
        ))}
      </section>
    </main>
  )
}

type ChapterCompletionOverlayProps = {
  onContinue: () => void
}

export function ChapterCompletionOverlay({ onContinue }: ChapterCompletionOverlayProps) {
  return (
    <section className="chapter-completion-overlay" role="dialog" aria-modal="true" aria-label="Глава первая завершена">
      <div className="chapter-completion-rays" aria-hidden="true" />
      <div className="chapter-completion-card">
        <span>Арбеково · вечер первый</span>
        <i aria-hidden="true">✦</i>
        <p>Глава 1</p>
        <h1>Завершена</h1>
        <small>Дмит пережил школу, Миньку и ночную вылазку. Район пока не сдался.</small>
        <button onClick={onContinue}>К выбору глав <b>→</b></button>
      </div>
    </section>
  )
}
