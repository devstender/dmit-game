import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Award, Backpack, ChartNoAxesCombined, Heart, HeartCrack, Map as MapIcon, Menu, Settings as SettingsIcon, Sparkles } from 'lucide-react'
import { gameSounds, playLoop, playSound } from '../audio/gameAudio'
import { characterPresentation } from '../data/characters'
import { abilityLabels, experienceForLevel, inventoryItemCatalog, traitLabels, type PlayerState } from '../data/player'
import { writeSavedGame, type StoryChapterId } from '../data/saveGame'
import { quests as chapterOneQuests, type Quest, type QuestPreloadAsset } from '../data/map'
import { InventoryPanel } from './InventoryPanel'
import { MapPanel } from './MapPanel'
import { CockroachHuntGame } from './CockroachHuntGame'
import { DoorReveal } from './DoorReveal'
import { SettingsPanel } from './SettingsPanel'
import { DebugStageSidebar, type DebugQuestScope } from './DebugStageSidebar'
import classroomBackground from '../assets/class.webp'
import dmitKitchenBackground from '../assets/dmit_kitchen.webp'
import dmitRoomBackground from '../assets/dmit_room.webp'
import dmitRoomCleanBackground from '../assets/dmit_room_clean.webp'
import minkaBackground from '../assets/minka.webp'
import schoolDarkVazBackground from '../assets/school_dark_vaz.webp'
import schoolYardDayBackground from '../assets/school.webp'
import schoolYardNightBackground from '../assets/small-school/school_back.webp'
import schoolMainEntranceNightBackground from '../assets/small-school/school_entrance.webp'
import schoolBackyardNightBackground from '../assets/small-school/school_back.webp'
import schoolCorridorNightBackground from '../assets/small-school/school_inside_flashlight.webp'
import schoolCorridorMorningBackground from '../assets/chapter_2/quest-school-1/school-corridor-morning.webp'
import schoolSecondFloorNightBackground from '../assets/small-school/school_green_light_cabinet.webp'
import computerClassNightBackground from '../assets/small-school/school_inside_cabinet.webp'
import stationSquareBackground from '../assets/chapter_2/quest-vokzal-1/main_entrance.png'
import stationPlatformBackground from '../assets/chapter_2/quest-vokzal-1/perron.png'
import electricTrainCarriageBackground from '../assets/chapter_2/quest-vokzal-1/inside_train.png'
import campEntranceBackground from '../assets/chapter_2/quest-vokzal-1/camp_entrance.png'
import type { Ability, Chapter, Character, CheatGameQuestion, PersonalityTrait, QuizQuestion, RelationCharacter, Scene, SceneEffect, SceneSound, StoryChoice } from '../types/story'
import { GameSidebar } from './GameSidebar'
import { PerkSelection } from './PerkSelection'
import { SpecialLevelUp } from './SpecialLevelUp'
import { PhoneMessenger, type PhoneChoiceOption, type PhoneThreadMessage } from './PhoneMessenger'
import { Portrait } from './Portrait'
import { ChapterCompletionOverlay } from './ChapterSelect'

type StoryScreenProps = {
  chapter: Chapter
  initialPlayer: PlayerState
  initialSceneIndex?: number
  initialPlayedCinematics?: number[]
  chapterId?: StoryChapterId
  onSave?: () => void
  onExit: () => void
  onChapterComplete: () => void
}

type QuizAnswer = QuizQuestion['answers'][number]

type PendingQuizAnswer = {
  points: number
  reaction: string
}

type TestAnswer = CheatGameQuestion['answers'][number]
type TeacherPosition = 'board' | 'rows' | 'behind'
type DialogueLine = {
  speaker: Character
  text: string
}
type PendingChoiceResolution = {
  next?: number
  effects?: SceneEffect
  followupDialogue?: DialogueLine
}
type PhoneHistoryAccumulator = {
  stop: boolean
  messages: PhoneThreadMessage[]
}
type QuestLoadingStage = {
  label: string
  total: number
  loaded: number
  status: 'pending' | 'loading' | 'done'
}
type QuestLoadingState = {
  title: string
  total: number
  loaded: number
  stages: QuestLoadingStage[]
}
type RelationNotification = {
  id: number
  text: string
  tone: 'positive' | 'negative' | 'story'
  kind: 'relation' | 'trait' | 'reputation' | 'story'
}

const hasPortrait = (character: Character | undefined): character is Exclude<Character, 'Рассказчик'> => (
  Boolean(character && character !== 'Рассказчик' && characterPresentation[character as Exclude<Character, 'Рассказчик'>])
)

const questLoadingStageLabels: Record<QuestPreloadAsset['kind'], string> = {
  background: 'Готовим локацию',
  character: 'Выводим персонажей',
  audio: 'Настраиваем звук',
}

const storyBackgroundSources: Partial<Record<NonNullable<Scene['background']>, readonly string[]>> = {
  school: [schoolYardDayBackground],
  'school-yard-day': [schoolYardDayBackground],
  classroom: [classroomBackground],
  'school-classroom-day': [classroomBackground],
  home: [dmitKitchenBackground],
  'dmit-home-hallway-day': [dmitKitchenBackground],
  'dmit-room': [dmitRoomBackground, dmitRoomCleanBackground],
  'dmit-bedroom-day': [dmitRoomBackground, dmitRoomCleanBackground],
  'dmit-bedroom-evening': [dmitRoomBackground, dmitRoomCleanBackground],
  'dmit-bedroom-night': [dmitRoomBackground, dmitRoomCleanBackground],
  'dmit-bedroom-morning': [dmitRoomBackground, dmitRoomCleanBackground],
  minika: [minkaBackground],
  'school-dark-vaz': [schoolDarkVazBackground],
  'school-yard-night': [schoolYardNightBackground],
  'school-main-entrance-night': [schoolMainEntranceNightBackground],
  'school-backyard-night': [schoolBackyardNightBackground],
  'school-corridor-night': [schoolCorridorNightBackground],
  'school-corridor-morning': [schoolCorridorMorningBackground],
  'school-corridor-day': [schoolCorridorMorningBackground],
  'school-second-floor-night': [schoolSecondFloorNightBackground],
  'computer-class-night': [computerClassNightBackground],
  'school-storage-night': [schoolCorridorNightBackground],
  'penza-station-square-morning': [stationSquareBackground],
  'penza-station-platform-morning': [stationPlatformBackground],
  'electric-train-carriage-day': [electricTrainCarriageBackground],
  'builder-camp-gates-day': [campEntranceBackground],
}

const sceneSoundSources: Record<SceneSound, string> = {
  'school-bell': gameSounds.schoolBell,
  'mishgan-fall': gameSounds.mishganFall,
  'dmit-run': gameSounds.dmitRun,
  'guard-run': gameSounds.guardRun,
  'guard-shout': gameSounds.guardShout,
  'phone-vibrate': gameSounds.phoneVibrate,
  'quest-complete': gameSounds.questComplete,
  'beer-open': gameSounds.beerOpen,
  'matvey-music': gameSounds.matveyMusic,
  'skill-success': gameSounds.skillSuccess,
  'skill-fail': gameSounds.skillFail,
  'school-door-buzz': gameSounds.schoolDoorBuzz,
  'school-entry-creak': gameSounds.schoolEntryCreak,
  'guard-alert': gameSounds.guardAlert,
  'black-phone-vibration': gameSounds.blackPhoneVibration,
  'igor-mystery-sting': gameSounds.igorMysterySting,
  'bike-chain-rattle': gameSounds.bikeChainRattle,
  'alarm-clock': gameSounds.schoolBell,
  'camera-shutter': gameSounds.stationCameraShutter,
  'station-announcement': gameSounds.schoolBell,
  'metal-rattle': gameSounds.bikeChainRattle,
  'security-beep': gameSounds.guardAlert,
  'metal-grate': gameSounds.schoolEntryCreak,
  'metal-crash': gameSounds.guardAlert,
  'distant-door': gameSounds.schoolEntryCreak,
  'school-alarm': gameSounds.guardAlert,
  'balls-scatter': gameSounds.guardAlert,
  'guard-shout-distant': gameSounds.guardShout,
  'metal-gate-close': gameSounds.schoolEntryCreak,
  'piano-crash': gameSounds.guardAlert,
  'school-bell-short': gameSounds.schoolBell,
  'door-creak': gameSounds.schoolEntryCreak,
  'phone-screen-crack': gameSounds.guardAlert,
  'fire-door-rattle': gameSounds.schoolEntryCreak,
  'station-shoulder-bump': gameSounds.shoulderBump,
  'train-carriage-entry': gameSounds.trainCarriageEntry,
  'train-departure': gameSounds.trainDeparture,
  'train-start-moving': gameSounds.trainDeparture,
  'acoustic-guitar-strum': gameSounds.uiToggle,
  'matvey-head-slap': gameSounds.shoulderBump,
  'train-brakes': gameSounds.trainDeparture,
  'camp-gate-close': gameSounds.campGateClose,
}

const sceneMusicSources = {
  matvey: gameSounds.matveyMusic,
  chase: gameSounds.chaseMusic,
  'school-chase': gameSounds.schoolChase,
}

const ambientSources: Partial<Record<NonNullable<Scene['background']>, string>> = {
  school: gameSounds.schoolyardAmbient,
  'school-yard-day': gameSounds.schoolyardAmbient,
  classroom: gameSounds.classroomAmbient,
  'school-classroom-day': gameSounds.classroomAmbient,
  home: gameSounds.dmitRoomAmbient,
  'dmit-home-hallway-day': gameSounds.dmitRoomAmbient,
  'dmit-room': gameSounds.dmitRoomAmbient,
  'dmit-bedroom-day': gameSounds.dmitRoomAmbient,
  'dmit-bedroom-evening': gameSounds.dmitRoomAmbient,
  'dmit-bedroom-night': gameSounds.dmitRoomAmbient,
  'dmit-bedroom-morning': gameSounds.dmitRoomAmbient,
  minika: gameSounds.minikaAmbient,
  'school-corridor-morning': gameSounds.schoolyardAmbient,
  'school-corridor-day': gameSounds.schoolyardAmbient,
  'school-dark-vaz': gameSounds.nightAmbient,
  'school-yard-night': gameSounds.nightAmbient,
  'school-main-entrance-night': gameSounds.nightAmbient,
  'school-backyard-night': gameSounds.nightAmbient,
  'school-corridor-night': gameSounds.nightAmbient,
  'school-second-floor-night': gameSounds.nightAmbient,
  'computer-class-night': gameSounds.nightAmbient,
  'school-storage-night': gameSounds.nightAmbient,
  'penza-station-square-morning': gameSounds.stationSquareAmbient,
  'penza-station-platform-morning': gameSounds.stationInteriorAmbient,
  'road-to-builder-camp-day': gameSounds.forestAmbient,
  'builder-camp-gates-day': gameSounds.campAmbient,
}

function collectStoryPreloadAssets(chapter: Chapter, startIndex = 0, endIndex = chapter.scenes.length) {
  const assets: QuestPreloadAsset[] = []
  const seen = new Set<string>()
  const add = (kind: QuestPreloadAsset['kind'], label: string, source: string | undefined) => {
    if (!source) return
    const key = `${kind}:${source}`
    if (seen.has(key)) return
    seen.add(key)
    assets.push({ kind, label, source })
  }

  add('background', 'Фон главы', chapter.background)

  for (const currentScene of chapter.scenes.slice(startIndex, endIndex)) {
    if (currentScene.background) {
      storyBackgroundSources[currentScene.background]?.forEach((source) => add('background', 'Локация', source))
      add('audio', 'Атмосфера', ambientSources[currentScene.background])
    }

    for (const character of [currentScene.speaker, currentScene.left, currentScene.right]) {
      const presentation = character && characterPresentation[character as Exclude<Character, 'Рассказчик'>]
      presentation?.images && Object.values(presentation.images).forEach((source) => add('character', 'Персонаж', source))
    }

    if (currentScene.sound) add('audio', 'Эффект', sceneSoundSources[currentScene.sound])
    if (currentScene.music) add('audio', 'Музыка', sceneMusicSources[currentScene.music])
    if (currentScene.phoneMessage) add('audio', 'Сообщения', gameSounds.phoneMessageReceived)
  }

  return assets
}

function createLoadingState(title: string, assets: QuestPreloadAsset[]): QuestLoadingState | null {
  if (assets.length === 0) return null
  const stages = (['background', 'character', 'audio'] as const)
    .map((kind) => ({ kind, label: questLoadingStageLabels[kind], assets: assets.filter((asset) => asset.kind === kind) }))
    .filter((stage) => stage.assets.length > 0)

  return {
    title,
    total: assets.length,
    loaded: 0,
    stages: stages.map((stage) => ({ label: stage.label, total: stage.assets.length, loaded: 0, status: 'pending' })),
  }
}

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

const relationReactionText = (character: RelationCharacter, delta: number) => {
  const reactions: Record<RelationCharacter, { positive: string; negative: string }> = {
    Вадим: { positive: 'Вадим это оценил.', negative: 'Вадиму это не понравилось.' },
    Копяр: { positive: 'Копяр это оценил.', negative: 'Копяру это не понравилось.' },
    Романыч: { positive: 'Романыч это одобрил.', negative: 'Романычу это не понравилось.' },
    Даша: { positive: 'Даша это оценила.', negative: 'Даше это не понравилось.' },
    Мама: { positive: 'Мама это оценила.', negative: 'Маме это не понравилось.' },
    Мишган: { positive: 'Мишган это одобрил.', negative: 'Мишгану это не понравилось.' },
    Кед: { positive: 'Кеду это понравилось.', negative: 'Кеду это не понравилось.' },
    Данз: { positive: 'Данз это одобрил.', negative: 'Данз это не одобрил.' },
    Полина: { positive: 'Полина это оценила.', negative: 'Полине это не понравилось.' },
    Географичка: { positive: 'Географичка стала чуть менее злой.', negative: 'Географичка это не одобрила.' },
    Вероника: { positive: 'Вероника это оценила.', negative: 'Веронике это не понравилось.' },
  }

  return delta > 0 ? reactions[character].positive : reactions[character].negative
}

// Only outcomes that redirect a character arc or unlock a later story branch
// should interrupt the scene with a notification. Future scripts can opt in
// explicitly by adding a STORY_* flag to the choice effects.
const importantStoryFlags = new Set([
  'CHAPTER_1_HELPED_MISHGAN',
  'CHAPTER_1_LEFT_MISHGAN',
  'CHAPTER_1_MATVEY_DEFEATED',
  'CHAPTER_1_MATVEY_HUMILIATED_DMIT',
  'CHAPTER_1_SMALL_SCHOOL_REFUSED_VADIM',
  'CHAPTER_1_SMALL_SCHOOL_SENT_VADIM_HOME',
  'CHAPTER_1_SMALL_SCHOOL_TEACHER_HELP',
  'CHAPTER_1_SMALL_SCHOOL_WALK_WITH_VADIM',
  'DMIT_HAS_BLACK_PHONE',
  'DMIT_ABANDONED_VADIM',
  'DMIT_DOUBLE_ABANDONMENT',
  'DMIT_RETURNED_FOR_VADIM',
  'VADIM_LEFT_WITH_GUARD',
  'VADIM_TRUST_DESTROYED',
  'VADIM_TRUST_IMPROVED',
  'BLACK_PHONE_DESTROYED',
  'BLACK_PHONE_CONFISCATED',
  'BLACK_PHONE_LEFT_AT_SCHOOL',
  'BLACK_PHONE_LEFT_SCHOOL',
  'CHAPTER_2_DMIT_ADMITTED_VADIM_ABANDONMENT',
  'CHAPTER_2_DMIT_BLAMED_VADIM_AFTER_ABANDONMENT',
  'CHAPTER_2_LEARNED_IGOR_CONNECTED_TO_CAMP',
  'CHAPTER_2_NOTICED_IGOR_IN_CAMP_DOCUMENTS',
  'CHAPTER_2_UNKNOWN_CONTACT_WARNED_ABOUT_BUILDER',
])

const isImportantStoryFlag = (flag: string) => importantStoryFlags.has(flag) || flag.startsWith('STORY_')

const legacyTraitChanges: Record<string, Partial<Record<PersonalityTrait, number>>> = {
  CHAPTER_1_HELPED_MISHGAN: { camaraderie: 1 },
  CHAPTER_1_LEFT_MISHGAN: { camaraderie: -1 },
  DMIT_RETURNED_FOR_VADIM: { responsibility: 2, camaraderie: 1 },
  DMIT_DOUBLE_ABANDONMENT: { responsibility: -2, camaraderie: -2 },
  CHAPTER_2_DMIT_ADMITTED_VADIM_ABANDONMENT: { responsibility: 1 },
  CHAPTER_2_DMIT_BLAMED_VADIM_AFTER_ABANDONMENT: { responsibility: -1 },
  CHAPTER_2_DMIT_LIED_ABOUT_RESOLVING_VADIM: { cunning: 1, responsibility: -1 },
  CHAPTER_2_DMIT_REFUSED_MATVEY_HUMILIATION: { courage: 1 },
  CHAPTER_2_DMIT_SUBMITTED_TO_MATVEY_AGAIN: { courage: -1 },
  CHAPTER_2_DMIT_EXPOSED_MATVEY_CROWD_TACTIC: { courage: 1, cunning: 1 },
  CHAPTER_2_MATVEY_PUT_IN_PLACE_CALMLY: { courage: 1, composure: 1 },
  CHAPTER_2_MATVEY_CONFLICT_DEFUSED_WITH_JOKE: { cunning: 1, composure: 1 },
}

const withLegacyTraitChanges = (effects: SceneEffect): SceneEffect => {
  const traits = { ...(effects.traits ?? {}) }
  for (const flag of effects.flags ?? []) for (const [trait, delta] of Object.entries(legacyTraitChanges[flag] ?? {})) {
    const key = trait as PersonalityTrait
    traits[key] = (traits[key] ?? 0) + (delta ?? 0)
  }
  return Object.keys(traits).length ? { ...effects, traits } : effects
}

const traitReactionText = (trait: PersonalityTrait, delta: number) => (
  trait === 'courage'
    ? delta > 0 ? 'Дмит проявил характер.' : 'Дмит дрогнул.'
    : delta > 0 ? `Дмит проявил ${traitLabels[trait].toLowerCase()}.` : `Дмит потерял ${traitLabels[trait].toLowerCase()}.`
)

function preloadAsset(asset: QuestPreloadAsset) {
  if (asset.kind === 'audio') {
    return new Promise<void>((resolve) => {
      const audio = new Audio()
      let finished = false
      const complete = () => {
        if (finished) return
        finished = true
        audio.pause()
        audio.removeEventListener('canplaythrough', complete)
        audio.removeEventListener('error', complete)
        resolve()
      }
      audio.preload = 'auto'
      audio.addEventListener('canplaythrough', complete, { once: true })
      audio.addEventListener('error', complete, { once: true })
      audio.src = asset.source
      audio.load()
      window.setTimeout(complete, 12000)
    })
  }

  return new Promise<void>((resolve) => {
    const image = new Image()
    let finished = false
    const complete = () => {
      if (finished) return
      finished = true
      resolve()
    }
    image.onload = complete
    image.onerror = complete
    image.src = asset.source
    if (image.complete) complete()
  })
}

export function StoryScreen({ chapter, initialPlayer, initialSceneIndex = 0, initialPlayedCinematics = [], chapterId = 'chapter-1', onSave, onExit, onChapterComplete }: StoryScreenProps) {
  const [sceneIndex, setSceneIndex] = useState(() => Math.min(initialSceneIndex, chapter.scenes.length - 1))
  const [player, setPlayer] = useState<PlayerState>(initialPlayer)
  const [quizQuestion, setQuizQuestion] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [pendingQuizAnswer, setPendingQuizAnswer] = useState<PendingQuizAnswer | null>(null)
  const [testQuestion, setTestQuestion] = useState(0)
  const [testScore, setTestScore] = useState(0)
  const [testWarnings, setTestWarnings] = useState(0)
  const [teacherPosition, setTeacherPosition] = useState<TeacherPosition>('board')
  const [testSuspicion, setTestSuspicion] = useState(18)
  const [copiedAnswer, setCopiedAnswer] = useState<string | null>(null)
  const [sideDialogue, setSideDialogue] = useState<DialogueLine | null>(null)
  const [pendingChoiceResolution, setPendingChoiceResolution] = useState<PendingChoiceResolution | null>(null)
  const [pendingChoiceFailureNext, setPendingChoiceFailureNext] = useState<number | null>(null)
  const [choiceTimerLeft, setChoiceTimerLeft] = useState<number | null>(null)
  const [questLoading, setQuestLoading] = useState<QuestLoadingState | null>(null)
  const [chapterLoading, setChapterLoading] = useState<QuestLoadingState | null>(() => (
    createLoadingState(chapter.title, collectStoryPreloadAssets(chapter))
  ))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [pendingPerkLevel, setPendingPerkLevel] = useState<number | null>(null)
  const [pendingSpecialLevel, setPendingSpecialLevel] = useState<number | null>(null)
  const [playedCinematics, setPlayedCinematics] = useState<number[]>(initialPlayedCinematics)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [debugModeEnabled, setDebugModeEnabled] = useState(() => import.meta.env.DEV && window.localStorage.getItem('dmit-debug-mode') === 'true')
  const [debugStageSidebarOpen, setDebugStageSidebarOpen] = useState(false)
  const [relationNotifications, setRelationNotifications] = useState<RelationNotification[]>([])
  const [chapterCompletionOpen, setChapterCompletionOpen] = useState(false)
  const previousSceneIndex = useRef(sceneIndex)
  const relationNotificationId = useRef(0)
  const relationNotificationTimers = useRef<number[]>([])
  const relationNotificationCooldowns = useRef(new Map<string, number>())
  const lastMobileSpeaker = useRef<Character | undefined>(undefined)
  const lastDesktopCompanion = useRef<Character | undefined>(undefined)
  const ambientAudio = useRef<HTMLAudioElement | null>(null)
  const musicAudio = useRef<HTMLAudioElement | null>(null)
  const musicTrack = useRef<'matvey' | 'chase' | 'school-chase' | null>(null)
  const musicFadeInterval = useRef<number | null>(null)
  const checkpointTransitionTimeout = useRef<number | null>(null)
  const backgroundTransitionTimeout = useRef<number | null>(null)
  const [checkpointFading, setCheckpointFading] = useState(false)
  const [backgroundFading, setBackgroundFading] = useState(false)
  const debugAvailable = import.meta.env.DEV
  const activeDebugMode = debugAvailable && debugModeEnabled
  const scene = chapter.scenes[sceneIndex]
  const debugQuestScope: DebugQuestScope = (() => {
    if (chapterId !== 'chapter-1') return { title: chapter.title, startIndex: 0, endIndex: chapter.scenes.length - 1 }

    const ordered = chapterOneQuests
      .filter((quest) => quest.startSceneIndex !== undefined)
      .sort((left, right) => (left.startSceneIndex ?? 0) - (right.startSceneIndex ?? 0))
    const active = ordered
      .filter((quest) => (quest.startSceneIndex ?? 0) <= sceneIndex)
      .at(-1)
    const activeStart = active?.startSceneIndex
    if (!active || activeStart === undefined) return { title: chapter.title, startIndex: 0, endIndex: chapter.scenes.length - 1 }

    const nextStart = ordered.find((quest) => (quest.startSceneIndex ?? Number.POSITIVE_INFINITY) > activeStart)?.startSceneIndex
    return {
      title: active.title,
      startIndex: activeStart,
      endIndex: Math.min(active.completedAfterSceneIndex ?? (nextStart === undefined ? chapter.scenes.length - 1 : nextStart - 1), chapter.scenes.length - 1),
    }
  })()
  const activeBackground = [...chapter.scenes.slice(0, sceneIndex + 1)].reverse().find((currentScene) => currentScene.background)?.background ?? 'school'
  const previousBackground = useRef(activeBackground)
  const dmitRoomImage = player.flags.includes('CHAPTER_1_ROOM_CLEANED') ? dmitRoomCleanBackground : dmitRoomBackground
  const backgroundImage = activeBackground === 'classroom' || activeBackground === 'school-classroom-day'
    ? `linear-gradient(180deg, rgba(31, 22, 39, .12), rgba(29, 13, 29, .60)), url(${classroomBackground})`
    : activeBackground === 'home' || activeBackground === 'dmit-home-hallway-day'
      ? `linear-gradient(180deg, rgba(31, 22, 39, .06), rgba(29, 13, 29, .36)), url(${dmitKitchenBackground})`
      : activeBackground === 'dmit-room' || activeBackground === 'dmit-bedroom-day' || activeBackground === 'dmit-bedroom-evening' || activeBackground === 'dmit-bedroom-night' || activeBackground === 'dmit-bedroom-morning'
        ? `linear-gradient(180deg, rgba(31, 22, 39, .08), rgba(29, 13, 29, .42)), url(${dmitRoomImage})`
        : activeBackground === 'minika'
          ? `linear-gradient(180deg, rgba(14, 15, 27, .18), rgba(12, 9, 18, .58)), url(${minkaBackground})`
          : activeBackground === 'school-yard-night'
            ? `linear-gradient(180deg, rgba(7, 12, 20, .16), rgba(4, 7, 13, .62)), url(${schoolYardNightBackground})`
            : activeBackground === 'school-main-entrance-night'
              ? `linear-gradient(180deg, rgba(8, 11, 20, .14), rgba(3, 5, 10, .62)), url(${schoolMainEntranceNightBackground})`
              : activeBackground === 'school-backyard-night'
                ? `linear-gradient(180deg, rgba(7, 12, 20, .16), rgba(4, 7, 13, .62)), url(${schoolBackyardNightBackground})`
                : activeBackground === 'school-corridor-night'
                  ? `linear-gradient(180deg, rgba(6, 10, 17, .08), rgba(4, 6, 12, .52)), url(${schoolCorridorNightBackground})`
                  : activeBackground === 'school-storage-night'
                    ? `linear-gradient(180deg, rgba(5, 9, 15, .14), rgba(3, 5, 10, .62)), url(${schoolCorridorNightBackground})`
                  : activeBackground === 'school-corridor-morning' || activeBackground === 'school-corridor-day'
                    ? `linear-gradient(180deg, rgba(43, 35, 42, .06), rgba(30, 23, 33, .44)), url(${schoolCorridorMorningBackground})`
                  : activeBackground === 'school-yard-day'
                    ? `linear-gradient(180deg, rgba(31, 22, 39, .08), rgba(29, 13, 29, .42)), url(${schoolYardDayBackground})`
                  : activeBackground === 'school-second-floor-night'
                    ? `linear-gradient(180deg, rgba(5, 17, 18, .10), rgba(4, 8, 12, .52)), url(${schoolSecondFloorNightBackground})`
                  : activeBackground === 'computer-class-night'
                      ? `linear-gradient(180deg, rgba(8, 12, 17, .14), rgba(3, 5, 9, .64)), url(${computerClassNightBackground})`
                      : activeBackground === 'penza-station-square-morning'
                        ? `linear-gradient(180deg, rgba(33, 35, 47, .08), rgba(20, 20, 31, .45)), url(${stationSquareBackground})`
                        : activeBackground === 'penza-station-platform-morning'
                          ? `linear-gradient(180deg, rgba(33, 35, 47, .08), rgba(20, 20, 31, .45)), url(${stationPlatformBackground})`
                          : activeBackground === 'electric-train-carriage-day'
                            ? `linear-gradient(180deg, rgba(26, 31, 40, .10), rgba(11, 14, 22, .54)), url(${electricTrainCarriageBackground})`
                            : activeBackground === 'road-to-builder-camp-day'
                              ? 'linear-gradient(180deg, rgba(32, 52, 35, .12), rgba(10, 25, 15, .60)), radial-gradient(ellipse at 50% 18%, rgba(213, 221, 164, .52), transparent 34%), linear-gradient(145deg, #6f8754 0 24%, #39503a 24% 47%, #b99a61 47% 56%, #304b35 56% 100%)'
                            : activeBackground === 'builder-camp-gates-day'
                              ? `linear-gradient(180deg, rgba(27, 38, 22, .08), rgba(13, 24, 16, .54)), url(${campEntranceBackground})`
                            : activeBackground === 'school-dark-vaz'
                            ? `linear-gradient(180deg, rgba(8, 12, 22, .08), rgba(7, 9, 18, .52)), url(${schoolDarkVazBackground})`
                            : `linear-gradient(180deg, rgba(31, 22, 39, .12), rgba(29, 13, 29, .60)), url(${chapter.background})`
  const activeQuizQuestion = scene.quiz?.questions[quizQuestion]
  const typingText = activeQuizQuestion?.question ?? scene.text
  const cinematicActive = Boolean(scene.cinematic && !playedCinematics.includes(sceneIndex))
  // A scene opens the messenger only when its author explicitly marks it.
  // Narrative lines around a phone stay on the regular story screen.
  const activePhoneMessage = scene.phoneMessage
  const phoneMode = Boolean(activePhoneMessage)
  const complete = !cinematicActive
  const activeCheatQuestion = scene.cheatGame?.questions[testQuestion]
  const teacherPositionLabel = teacherPosition === 'board' ? 'у доски' : teacherPosition === 'rows' ? 'между рядами' : 'за спиной'
  const quizDialogue: DialogueLine | null = pendingQuizAnswer ? { speaker: 'Географичка', text: pendingQuizAnswer.reaction } : null
  const activeDialogue = sideDialogue ?? quizDialogue
  const dialogueSpeaker = activeDialogue?.speaker ?? (activeQuizQuestion ? 'Географичка' : scene.speaker)
  const dialogueText = activeDialogue?.text ?? typingText
  const dialogueComplete = Boolean(activeDialogue) || complete
  const chapterComplete = chapterId === 'chapter-2' || player.flags.includes('CHAPTER_1_SMALL_SCHOOL_EXIT_COMPLETE')
  const chapterEndingScene = chapterComplete
    && !scene.choices
    && !scene.quiz
    && !scene.cheatGame
    && !scene.roachGame
    && scene.next === undefined
    && scene.fallbackNext === undefined
    && !scene.nextByFlag?.some((route) => player.flags.includes(route.flag))
  const choiceTimerVisible = Boolean(scene.choiceTimer && scene.choices && dialogueComplete && !activeDialogue && choiceTimerLeft !== null)
  const activeChoiceTimerDuration = scene.choiceTimer
    ? Math.max(1, scene.choiceTimer.durationSeconds - ((scene.music === 'chase' || scene.music === 'school-chase') && (player.flags.includes('CHAPTER_1_ALCOHOL_BEER') || player.flags.includes('CHAPTER_1_ALCOHOL_HEAVY')) ? 1 : 0))
    : 0
  const choiceTimerProgress = scene.choiceTimer && choiceTimerLeft !== null
    ? Math.max(0, Math.min(100, (choiceTimerLeft / activeChoiceTimerDuration) * 100))
    : 0
  const narratorLine = dialogueSpeaker === 'Рассказчик'
  if (!narratorLine && !phoneMode && hasPortrait(dialogueSpeaker as Character)) lastMobileSpeaker.current = dialogueSpeaker as Character
  const mobileSpeakerCandidate = narratorLine ? lastMobileSpeaker.current ?? scene.left ?? scene.right : dialogueSpeaker as Character
  const mobileSpeaker = hasPortrait(mobileSpeakerCandidate)
    ? mobileSpeakerCandidate
    : hasPortrait(scene.left)
      ? scene.left
      : hasPortrait(scene.right)
        ? scene.right
        : undefined
  const mobileSpeakerPosition = mobileSpeaker === 'Дмит' ? 'left' : 'right'
  const speakerNameSide = dialogueSpeaker === 'Рассказчик' ? 'narrator' : mobileSpeakerPosition
  const mobileSpeakerEmotion = mobileSpeaker === scene.left ? scene.leftEmotion : mobileSpeaker === scene.right ? scene.rightEmotion : undefined
  if (!narratorLine && !phoneMode && dialogueSpeaker !== 'Дмит' && hasPortrait(dialogueSpeaker as Character)) lastDesktopCompanion.current = dialogueSpeaker as Character
  const desktopLeftPortrait: Character = 'Дмит'
  const desktopRightCandidate = dialogueSpeaker === 'Дмит'
    ? lastDesktopCompanion.current ?? (scene.right === 'Дмит' ? scene.left : scene.right)
    : dialogueSpeaker as Character
  const desktopRightPortrait = hasPortrait(desktopRightCandidate)
    ? desktopRightCandidate
    : hasPortrait(scene.right)
      ? scene.right
      : hasPortrait(scene.left) && scene.left !== 'Дмит'
        ? scene.left
        : undefined
  const desktopRightEmotion = desktopRightPortrait === scene.left
    ? scene.leftEmotion
    : desktopRightPortrait === scene.right
      ? scene.rightEmotion
      : undefined
  const phoneMessages: PhoneThreadMessage[] = activePhoneMessage ? [
    ...chapter.scenes
      .slice(0, sceneIndex)
      .reverse()
      .reduce<PhoneHistoryAccumulator>((history, historyScene) => {
        const historyPhoneMessage = historyScene.phoneMessage
        if (history.stop || !historyPhoneMessage || historyPhoneMessage.contact !== activePhoneMessage.contact) {
          return { stop: true, messages: history.messages }
        }
        return {
          stop: false,
          messages: [{
            speaker: historyScene.speaker,
            text: historyScene.text,
            direction: historyPhoneMessage.direction,
          }, ...history.messages],
        }
      }, { stop: false, messages: [] }).messages,
    {
      speaker: dialogueSpeaker,
      text: dialogueText,
      direction: dialogueSpeaker === 'Дмит' ? 'outgoing' : activePhoneMessage.direction,
    },
  ] : []
  const seenRelationCharacters = (Object.keys(player.relations) as RelationCharacter[]).filter((character) => (
    chapter.scenes.slice(0, sceneIndex + 1).some((currentScene) => (
      currentScene.speaker === character || currentScene.left === character || currentScene.right === character
    ))
  ))

  useEffect(() => {
    let cancelled = false
    const assets = collectStoryPreloadAssets(chapter)
    const loadingState = createLoadingState(chapter.title, assets)
    setChapterLoading(loadingState)
    if (!loadingState) return () => { cancelled = true }

    const groupedAssets = (['background', 'character', 'audio'] as const)
      .map((kind) => ({ kind, assets: assets.filter((asset) => asset.kind === kind) }))
      .filter((stage) => stage.assets.length > 0)

    const preloadChapter = async () => {
      let totalLoaded = 0
      for (let stageIndex = 0; stageIndex < groupedAssets.length; stageIndex += 1) {
        if (cancelled) return
        setChapterLoading((current) => current ? {
          ...current,
          stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, status: 'loading' } : stage),
        } : current)

        await Promise.all(groupedAssets[stageIndex].assets.map(async (asset) => {
          await preloadAsset(asset)
          if (cancelled) return
          totalLoaded += 1
          setChapterLoading((current) => current ? {
            ...current,
            loaded: totalLoaded,
            stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, loaded: stage.loaded + 1 } : stage),
          } : current)
        }))

        if (cancelled) return
        setChapterLoading((current) => current ? {
          ...current,
          stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, status: 'done', loaded: stage.total } : stage),
        } : current)
        await wait(150)
      }

      if (!cancelled) {
        await wait(220)
        if (!cancelled) setChapterLoading(null)
      }
    }

    void preloadChapter()
    return () => { cancelled = true }
  }, [chapter])

  useEffect(() => {
    if (chapterLoading) return
    writeSavedGame({ chapterId, sceneIndex, player, playedCinematics })
    onSave?.()
  }, [chapterId, sceneIndex, player, playedCinematics, onSave, chapterLoading])

  useEffect(() => {
    const saveBeforeUnload = () => writeSavedGame({ chapterId, sceneIndex, player, playedCinematics })
    window.addEventListener('beforeunload', saveBeforeUnload)
    return () => window.removeEventListener('beforeunload', saveBeforeUnload)
  }, [chapterId, sceneIndex, player, playedCinematics])

  useLayoutEffect(() => {
    if (!scene.autoRoute) return
    const nextSceneIndex = resolveNextScene()
    if (nextSceneIndex === undefined) return
    applyEffects(chapter.scenes[nextSceneIndex]?.effects)
    setSceneIndex(nextSceneIndex)
    setQuizQuestion(0)
    setQuizScore(0)
    setPendingQuizAnswer(null)
    setSideDialogue(null)
    setPendingChoiceResolution(null)
    setPendingChoiceFailureNext(null)
    setChoiceTimerLeft(null)
    resetTest()
  }, [sceneIndex, scene.autoRoute, scene.nextByFlag, scene.fallbackNext, player.flags])

  useLayoutEffect(() => {
    if (previousBackground.current === activeBackground) return
    previousBackground.current = activeBackground
    setBackgroundFading(true)
    if (backgroundTransitionTimeout.current !== null) window.clearTimeout(backgroundTransitionTimeout.current)
    backgroundTransitionTimeout.current = window.setTimeout(() => {
      setBackgroundFading(false)
      backgroundTransitionTimeout.current = null
    }, 620)
  }, [activeBackground])

  useEffect(() => {
    if (!debugAvailable) return
    window.localStorage.setItem('dmit-debug-mode', String(debugModeEnabled))
  }, [debugAvailable, debugModeEnabled])

  useEffect(() => {
    if (previousSceneIndex.current === sceneIndex) return
    previousSceneIndex.current = sceneIndex
    if (scene.autoRoute) return
    playSound(gameSounds.dialoguePage, .46)
    if (scene.sound === 'school-bell') playSound(gameSounds.schoolBell, .74)
    if (scene.sound === 'mishgan-fall') playSound(gameSounds.mishganFall, .86)
    if (scene.sound === 'dmit-run') playSound(gameSounds.dmitRun, .7, 3)
    if (scene.sound === 'guard-run') playSound(gameSounds.guardRun, .72, 3)
    if (scene.sound === 'guard-shout') playSound(gameSounds.guardShout, .78)
    if (scene.sound === 'phone-vibrate') playSound(gameSounds.phoneVibrate, .62)
    if (scene.sound === 'school-door-buzz') playSound(gameSounds.schoolDoorBuzz, .7)
    if (scene.sound === 'school-entry-creak') playSound(gameSounds.schoolEntryCreak, .72)
    if (scene.sound === 'guard-alert') playSound(gameSounds.guardAlert, .82)
    if (scene.sound === 'black-phone-vibration' || scene.text === 'В этот момент на учительском столе начинает вибрировать чужой телефон.' || scene.text === 'Чёрный телефон снова вибрирует.') playSound(gameSounds.blackPhoneVibration, .66)
    if (scene.sound === 'igor-mystery-sting' || scene.text === 'Деньги у Игоря.' || scene.text === '«Строитель»?' || scene.text === 'Человек Игоря.') playSound(gameSounds.igorMysterySting, .7)
    if (scene.sound === 'bike-chain-rattle') playSound(gameSounds.bikeChainRattle, .6, 4)
    if (activePhoneMessage?.direction === 'incoming') playSound(gameSounds.phoneMessageReceived, .48)
    if (scene.sound === 'quest-complete') playSound(gameSounds.questComplete, .62)
    if (scene.sound === 'beer-open') playSound(gameSounds.beerOpen, .72)
    if (scene.sound === 'skill-success') playSound(gameSounds.skillSuccess, .58)
    if (scene.sound === 'skill-fail') playSound(gameSounds.skillFail, .46)
    if (scene.sound === 'camera-shutter') playSound(gameSounds.stationCameraShutter, .62)
    if (scene.sound === 'station-shoulder-bump') playSound(gameSounds.shoulderBump, .7)
    if (scene.sound === 'train-carriage-entry') playSound(gameSounds.trainCarriageEntry, .72)
    if (scene.sound === 'train-departure') playSound(gameSounds.trainDeparture, .76)
    if (scene.sound === 'train-start-moving') playSound(gameSounds.trainDeparture, .76)
    if (scene.sound === 'acoustic-guitar-strum') playSound(gameSounds.uiToggle, .52)
    if (scene.sound === 'matvey-head-slap') playSound(gameSounds.shoulderBump, .72)
    if (scene.sound === 'train-brakes') playSound(gameSounds.trainDeparture, .48)
    if (scene.sound === 'camp-gate-close') playSound(gameSounds.campGateClose, .72)
  }, [sceneIndex, scene.sound, scene.text, activePhoneMessage?.direction, chapterLoading])

  useEffect(() => {
    if (chapterLoading) return
    ambientAudio.current?.pause()
    if (scene.music === 'school-chase') {
      ambientAudio.current = null
      return
    }
    if (activeBackground === 'electric-train-carriage-day') {
      ambientAudio.current = null
      return
    }
    ambientAudio.current = playLoop(
      ambientSources[activeBackground] ?? gameSounds.nightAmbient,
      activeBackground === 'classroom' || activeBackground === 'school-classroom-day' ? .18 : activeBackground === 'minika' ? .24 : activeBackground === 'school-corridor-morning' || activeBackground === 'school-corridor-day' ? .18 : activeBackground === 'school' || activeBackground === 'school-yard-day' ? .22 : activeBackground === 'school-dark-vaz' ? .22 : activeBackground === 'home' || activeBackground === 'dmit-room' ? .2 : .22,
    )
    return () => {
      ambientAudio.current?.pause()
      ambientAudio.current = null
    }
  }, [activeBackground, scene.music, chapterLoading])

  useEffect(() => {
    if (chapterLoading) return
    if (scene.music === 'matvey' || scene.music === 'chase' || scene.music === 'school-chase') {
      startMusic(scene.music)
      return
    }
    stopMusic(700)
  }, [scene.music, chapterLoading])

  useEffect(() => () => {
    ambientAudio.current?.pause()
    stopMusic()
    if (checkpointTransitionTimeout.current !== null) window.clearTimeout(checkpointTransitionTimeout.current)
    if (backgroundTransitionTimeout.current !== null) window.clearTimeout(backgroundTransitionTimeout.current)
  }, [])

  useEffect(() => {
    if (!scene.cheatGame || !complete) return
    setTeacherPosition('board')
    const patrol = window.setInterval(() => {
      const patrolRoute: TeacherPosition[] = ['board', 'board', 'rows', 'behind']
      const nextPosition = patrolRoute[Math.floor(Math.random() * patrolRoute.length)]
      setTeacherPosition(nextPosition)
      setTestSuspicion((current) => Math.min(100, current + (nextPosition === 'board' ? 1 : nextPosition === 'rows' ? 5 : 8)))
    }, 1850)
    return () => window.clearInterval(patrol)
  }, [complete, scene.cheatGame, sceneIndex])

  useEffect(() => {
    const level = experienceForLevel(player.experience)
    setPlayer((current) => {
      const rewardedLevels = current.rewardedSpecialLevels ?? []
      const rewardLevels = Array.from({ length: level }, (_, index) => index + 1)
        .filter((currentLevel) => currentLevel > 1 && !rewardedLevels.includes(currentLevel))
      if (rewardLevels.length === 0) return current
      return { ...current, specialPoints: current.specialPoints + rewardLevels.length, rewardedSpecialLevels: [...rewardedLevels, ...rewardLevels] }
    })
  }, [player.experience])

  useEffect(() => {
    const level = experienceForLevel(player.experience)
    const claimedSpecialLevels = player.claimedSpecialLevels ?? player.rewardedSpecialLevels ?? []
    const nextSpecialLevel = Array.from({ length: level }, (_, index) => index + 1)
      .find((currentLevel) => currentLevel > 1 && !claimedSpecialLevels.includes(currentLevel))
    if (nextSpecialLevel) {
      setPendingSpecialLevel(nextSpecialLevel)
      setPendingPerkLevel(null)
      return
    }

    setPendingSpecialLevel(null)
    const nextPerkLevel = Array.from({ length: level }, (_, index) => index + 1)
      .find((currentLevel) => currentLevel > 1 && currentLevel % 3 === 0 && !player.claimedPerkLevels.includes(currentLevel))
    if (nextPerkLevel) setPendingPerkLevel(nextPerkLevel)
  }, [player.experience, player.claimedPerkLevels, player.claimedSpecialLevels, player.rewardedSpecialLevels])

  useEffect(() => () => {
    relationNotificationTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const applyEffects = (effects?: SceneEffect, fromChoice = false) => {
    if (!effects) return
    effects = withLegacyTraitChanges(effects)
    const hasChanges = Boolean(
      effects.experience
      || effects.money
      || effects.reputation
      || effects.items?.length
      || Object.keys(effects.abilities ?? {}).length
      || Object.keys(effects.traits ?? {}).length
      || effects.suspicion
      || Object.keys(effects.relations ?? {}).length
      || effects.flags?.length,
    )
    if (!hasChanges) return

    const now = Date.now()
    const relationChanges = Object.entries(effects.relations ?? {})
      .map(([character, value]) => ({ character: character as RelationCharacter, delta: value ?? 0 }))
      .filter(({ character, delta }) => {
        if (delta === 0) return false
        const notificationKey = `${character}:${delta}`
        const previous = relationNotificationCooldowns.current.get(notificationKey) ?? 0
        if (now - previous < 900) return false
        relationNotificationCooldowns.current.set(notificationKey, now)
        return true
      })

    if (relationChanges.length > 0) {
      const notifications = relationChanges.map(({ character, delta }) => ({
        id: ++relationNotificationId.current,
        text: relationReactionText(character, delta),
        tone: delta > 0 ? 'positive' as const : 'negative' as const,
        kind: 'relation' as const,
      }))

      setRelationNotifications((current) => [...current, ...notifications].slice(-3))
      notifications.forEach((notification) => {
        const timer = window.setTimeout(() => {
          setRelationNotifications((current) => current.filter((item) => item.id !== notification.id))
        }, 3400)
        relationNotificationTimers.current.push(timer)
      })
    }

    const traitChanges = Object.entries(effects.traits ?? {})
      .map(([trait, value]) => ({ trait: trait as PersonalityTrait, delta: value ?? 0 }))
      .filter(({ delta }) => delta !== 0)
    if (traitChanges.length > 0) {
      const notifications = traitChanges.map(({ trait, delta }) => ({ id: ++relationNotificationId.current, text: traitReactionText(trait, delta), tone: delta > 0 ? 'positive' as const : 'negative' as const, kind: 'trait' as const }))
      setRelationNotifications((current) => [...current, ...notifications].slice(-3))
      notifications.forEach((notification) => {
        const timer = window.setTimeout(() => setRelationNotifications((current) => current.filter((item) => item.id !== notification.id)), 3400)
        relationNotificationTimers.current.push(timer)
      })
    }

    const reputationDelta = effects.reputation ?? 0
    if (reputationDelta !== 0) {
      const notification: RelationNotification = {
        id: ++relationNotificationId.current,
        text: reputationDelta > 0 ? `Авторитет вырос: +${reputationDelta}` : `Авторитет снизился: ${reputationDelta}`,
        tone: reputationDelta > 0 ? 'positive' : 'negative',
        kind: 'reputation',
      }
      setRelationNotifications((current) => [...current, notification].slice(-3))
      const timer = window.setTimeout(() => setRelationNotifications((current) => current.filter((item) => item.id !== notification.id)), 3400)
      relationNotificationTimers.current.push(timer)
    }

    const hasNewStoryFlag = fromChoice && (effects.flags ?? []).some((flag) => (
      !player.flags.includes(flag) && isImportantStoryFlag(flag)
    ))
    if (hasNewStoryFlag) {
      const notification: RelationNotification = {
        id: ++relationNotificationId.current,
        text: 'Это решение повлияет на дальнейшую историю.',
        tone: 'story',
        kind: 'story',
      }
      setRelationNotifications((current) => [...current, notification].slice(-3))
      const timer = window.setTimeout(() => {
        setRelationNotifications((current) => current.filter((item) => item.id !== notification.id))
      }, 4200)
      relationNotificationTimers.current.push(timer)
    }

    setPlayer((current) => {
      const experience = effects.experience ?? 0
      const boostedExperience = current.perks.includes('streetwise') && experience > 0 ? Math.ceil(experience * 1.25) : experience
      const relations = Object.fromEntries(Object.entries(effects.relations ?? {}).map(([character, value]) => [character, (current.relations[character as keyof typeof current.relations] ?? 0) + (value ?? 0)]))
      const existingItemIds = new Set(current.inventory.map((item) => item.id))
      const addedItems = (effects.items ?? [])
        .map((id) => inventoryItemCatalog[id])
        .filter((item): item is NonNullable<typeof item> => Boolean(item && !existingItemIds.has(item.id)))
      return {
        ...current,
        money: Math.max(0, (current.money ?? 0) + (effects.money ?? 0)),
        experience: current.experience + boostedExperience,
        reputation: current.reputation + (effects.reputation ?? 0),
        suspicion: Math.max(0, Math.min(10, (current.suspicion ?? 0) + (effects.suspicion ?? 0))),
        abilities: { ...current.abilities, ...Object.fromEntries(Object.entries(effects.abilities ?? {}).map(([ability, value]) => [ability, current.abilities[ability as keyof typeof current.abilities] + (value ?? 0)])) },
        traits: { ...current.traits, ...Object.fromEntries(Object.entries(effects.traits ?? {}).map(([trait, value]) => [trait, Math.max(-10, Math.min(10, (current.traits?.[trait as PersonalityTrait] ?? 0) + (value ?? 0)))])) },
        relations: { ...current.relations, ...relations },
        inventory: [...current.inventory, ...addedItems],
        flags: [...new Set([...current.flags, ...(effects.flags ?? [])])],
      }
    })
  }

  const resolveNextScene = (next?: number) => {
    if (next !== undefined) return next
    const conditionalRoute = scene.conditionalNext?.find((route) => (
      (route.allFlags ?? []).every((flag) => player.flags.includes(flag))
      && (!(route.anyFlags?.length) || route.anyFlags.some((flag) => player.flags.includes(flag)))
      && !(route.unlessFlags ?? []).some((flag) => player.flags.includes(flag))
      && Object.entries(route.traits ?? {}).every(([trait, minimum]) => (player.traits?.[trait as PersonalityTrait] ?? 0) >= (minimum ?? 0))
    ))
    if (conditionalRoute) return conditionalRoute.next
    const flagRoute = scene.nextByFlag?.find((route) => player.flags.includes(route.flag))
    return flagRoute?.next ?? scene.fallbackNext
  }

  const stopMusic = (fadeDuration = 0) => {
    if (musicFadeInterval.current !== null) {
      window.clearInterval(musicFadeInterval.current)
      musicFadeInterval.current = null
    }
    const currentMusic = musicAudio.current
    if (!currentMusic) return
    if (fadeDuration <= 0) {
      currentMusic.pause()
      currentMusic.currentTime = 0
      musicAudio.current = null
      musicTrack.current = null
      return
    }
    const startVolume = currentMusic.volume
    const startedAt = Date.now()
    musicFadeInterval.current = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / fadeDuration)
      currentMusic.volume = startVolume * (1 - progress)
      if (progress < 1) return
      if (musicFadeInterval.current !== null) window.clearInterval(musicFadeInterval.current)
      musicFadeInterval.current = null
      currentMusic.pause()
      currentMusic.currentTime = 0
      if (musicAudio.current === currentMusic) musicAudio.current = null
      if (musicAudio.current === null) musicTrack.current = null
    }, 50)
  }

  const startMusic = (track: 'matvey' | 'chase' | 'school-chase', restart = false) => {
    if (musicFadeInterval.current !== null) {
      window.clearInterval(musicFadeInterval.current)
      musicFadeInterval.current = null
    }
    if (restart || (musicAudio.current && musicTrack.current !== track)) stopMusic()
    if (musicAudio.current && musicTrack.current === track) {
      musicAudio.current.volume = .5
      return
    }
    musicTrack.current = track
    musicAudio.current = playLoop(
      track === 'matvey' ? gameSounds.matveyMusic : track === 'school-chase' ? gameSounds.schoolChase : gameSounds.chaseMusic,
      .5,
    )
  }

  const advance = (next?: number) => {
    if (!complete) return
    const resolvedNext = resolveNextScene(next)
    if (resolvedNext !== undefined) {
      if (scene.transition === 'checkpoint-fade') {
        setCheckpointFading(true)
        stopMusic(900)
        if (checkpointTransitionTimeout.current !== null) window.clearTimeout(checkpointTransitionTimeout.current)
        checkpointTransitionTimeout.current = window.setTimeout(() => {
          applyEffects(chapter.scenes[resolvedNext].effects)
          setSceneIndex(resolvedNext)
          setQuizQuestion(0)
          setQuizScore(0)
          setPendingQuizAnswer(null)
          setSideDialogue(null)
          setPendingChoiceResolution(null)
          resetTest()
          setCheckpointFading(false)
          const nextMusic = chapter.scenes[resolvedNext]?.music
          if (nextMusic === 'matvey' || nextMusic === 'chase' || nextMusic === 'school-chase') startMusic(nextMusic, true)
        }, 1050)
        return
      }
      applyEffects(chapter.scenes[resolvedNext].effects)
      setSceneIndex(resolvedNext)
      setQuizQuestion(0)
      setQuizScore(0)
      setPendingQuizAnswer(null)
      setSideDialogue(null)
      setPendingChoiceResolution(null)
      resetTest()
    }
  }

  const skillCheckChance = (choice: StoryChoice) => {
    const checks = Object.entries(choice.requires ?? {})
    const traitChecks = Object.entries(choice.traitCheck ?? {})
    if (checks.length === 0 && traitChecks.length === 0) return 100
    const chances = checks.map(([ability, minimum]) => {
      const abilityScore = player.abilities[ability as keyof typeof player.abilities]
      const difference = abilityScore - minimum
      const rawChance = difference >= 0 ? 70 + difference * 10 : 70 + difference * 27.5
      return Math.round(Math.max(5, Math.min(95, rawChance)) / 5) * 5
    })
    traitChecks.forEach(([trait, minimum]) => {
      const traitScore = player.traits?.[trait as PersonalityTrait] ?? 0
      const difference = traitScore - (minimum ?? 0)
      const rawChance = difference >= 0 ? 70 + difference * 10 : 70 + difference * 27.5
      chances.push(Math.round(Math.max(5, Math.min(95, rawChance)) / 5) * 5)
    })
    const injuryPenalty = (scene.music === 'chase' || scene.music === 'school-chase') && choice.requires?.agility && (player.flags.includes('DMIT_DAMAGED') || player.flags.includes('CHAPTER_1_DMIT_DAMAGED')) ? 15 : 0
    return Math.max(5, Math.min(...chances) - injuryPenalty)
  }

  const cleanChoiceText = (text: string) => text
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/[«»"]/g, '')
    .trim()

  const shortenChoiceText = (text: string) => {
    const cleanText = cleanChoiceText(text)
    if (cleanText.length <= 46) return cleanText
    const sentenceEnd = cleanText.search(/[.!?…]/)
    if (sentenceEnd > 12 && sentenceEnd <= 46) return cleanText.slice(0, sentenceEnd + 1)
    return `${cleanText.slice(0, 43).trimEnd()}…`
  }

  // Старые сгенерированные .quest могли записывать say равным label автоматически.
  // Такой текст — название действия, а не отдельная реплика персонажа.
  const spokenChoiceText = (choice: StoryChoice) => (
    choice.say && choice.say !== choice.label ? choice.say : ''
  )
  const normalizeDialogueText = (text: string) => cleanChoiceText(text).replace(/\s+/g, ' ').trim().toLowerCase()
  const choiceDialogueLine = (choice: StoryChoice): DialogueLine | null => {
    const text = choice.narration ?? spokenChoiceText(choice)
    if (!text) return null
    return {
      speaker: choice.narration ? 'Рассказчик' : 'Дмит',
      text,
    }
  }

  const nextSceneRepeatsChoice = (choice: StoryChoice, next?: number) => {
    if (next === undefined) return false
    const nextScene = chapter.scenes[next]
    if (!nextScene) return false
    const dialogueLine = choiceDialogueLine(choice)
    if (!dialogueLine) return false
    return nextScene.speaker === dialogueLine.speaker
      && normalizeDialogueText(nextScene.text) === normalizeDialogueText(dialogueLine.text)
  }

  const queueChoiceResolution = (choice: StoryChoice, resolution: PendingChoiceResolution) => {
    setChoiceTimerLeft(null)
    const dialogueLine = choiceDialogueLine(choice)

    if (!dialogueLine) {
      applyEffects(resolution.effects, true)
      if (resolution.followupDialogue) {
        setSideDialogue(resolution.followupDialogue)
        setPendingChoiceResolution({ next: resolution.next })
      } else if (resolution.next !== undefined) {
        advance(resolution.next)
      }
      return
    }

    if (!resolution.followupDialogue && nextSceneRepeatsChoice(choice, resolution.next)) {
      applyEffects(resolution.effects, true)
      if (resolution.next !== undefined) advance(resolution.next)
      return
    }
    setSideDialogue({
      speaker: dialogueLine.speaker,
      text: dialogueLine.text,
    })
    setPendingChoiceResolution(resolution)
  }

  const continuePendingChoice = () => {
    if (!pendingChoiceResolution) return

    if (pendingChoiceResolution.followupDialogue) {
      applyEffects(pendingChoiceResolution.effects, true)
      setSideDialogue(pendingChoiceResolution.followupDialogue)
      setPendingChoiceResolution({
        next: pendingChoiceResolution.next,
      })
      return
    }

    applyEffects(pendingChoiceResolution.effects, true)
    const nextScene = pendingChoiceResolution.next
    setPendingChoiceResolution(null)
    setSideDialogue(null)
    if (nextScene !== undefined) {
      advance(nextScene)
    }
  }

  const formatChoiceLabel = (choice: StoryChoice) => {
    const checks = Object.entries(choice.requires ?? {})
    const traitChecks = Object.entries(choice.requiresTraits ?? {})
    const chanceTraitChecks = Object.entries(choice.traitCheck ?? {})
    const shortLabel = choice.shortLabel ?? shortenChoiceText(choice.label)
    if (checks.length === 0 && traitChecks.length === 0) return shortLabel
    const requirements = checks.map(([ability, minimum]) => {
      const abilityKey = ability as keyof typeof player.abilities
      return `${abilityLabels[abilityKey]} ${player.abilities[abilityKey]}/${minimum}`
    })
    traitChecks.forEach(([trait, minimum]) => requirements.push(`${traitLabels[trait as PersonalityTrait]} ${player.traits?.[trait as PersonalityTrait] ?? 0}/${minimum}`))
    chanceTraitChecks.forEach(([trait, minimum]) => requirements.push(`${traitLabels[trait as PersonalityTrait]} ${player.traits?.[trait as PersonalityTrait] ?? 0}/${minimum}`))
    return `[${requirements.join(', ')}${checks.length || chanceTraitChecks.length ? ` · шанс ${skillCheckChance(choice)}%` : ''}] ${shortLabel}`
  }

  const canChoose = (choice: StoryChoice) => (
    (choice.requiresMoney === undefined || player.money >= choice.requiresMoney)
    && (choice.requiresFlags ?? []).every((flag) => player.flags.includes(flag))
    && (!(choice.requiresAnyFlags?.length) || choice.requiresAnyFlags.some((flag) => player.flags.includes(flag)))
    && (choice.requiresPerks ?? []).every((perk) => player.perks.includes(perk))
    && Object.entries(choice.requiresTraits ?? {}).every(([trait, minimum]) => (player.traits?.[trait as PersonalityTrait] ?? 0) >= (minimum ?? 0))
    && Object.entries(choice.requiresRelations ?? {}).every(([character, minimum]) => player.relations[character as keyof typeof player.relations] >= minimum)
  )
  const visibleChoices = (scene.choices ?? []).filter((choice) => (
    (choice.visibleWhen?.allFlags ?? []).every((flag) => player.flags.includes(flag))
    && (!(choice.visibleWhen?.anyFlags?.length) || choice.visibleWhen.anyFlags.some((flag) => player.flags.includes(flag)))
    && !(choice.visibleWhen?.unlessFlags ?? []).some((flag) => player.flags.includes(flag))
    && Object.entries(choice.visibleWhen?.traits ?? {}).every(([trait, minimum]) => (player.traits?.[trait as PersonalityTrait] ?? 0) >= (minimum ?? 0))
    && (choice.visibleWhen?.reputation === undefined || player.reputation >= choice.visibleWhen.reputation)
  ))

  const choose = (choice: StoryChoice) => {
    if (!canChoose(choice)) return
    playSound(gameSounds.uiClick, .58)
    if ((Object.keys(choice.requires ?? {}).length > 0 || Object.keys(choice.traitCheck ?? {}).length > 0) && Math.random() * 100 >= skillCheckChance(choice)) {
      playSound(gameSounds.skillFail, .46)
      queueChoiceResolution(choice, {
        next: choice.failNext,
        effects: choice.failureEffects,
        followupDialogue: {
          speaker: 'Рассказчик',
          text: choice.failureText ?? 'Дмит пытается провернуть это, но районная математика говорит: не сегодня.',
        },
      })
      return
    }
    if (Object.keys(choice.requires ?? {}).length > 0) playSound(gameSounds.skillSuccess, .58)
    queueChoiceResolution(choice, {
      next: choice.next,
      effects: choice.effects,
    })
  }

  useEffect(() => {
    const timer = scene.choiceTimer
    if (!timer || !scene.choices || !complete || activeDialogue) {
      setChoiceTimerLeft(null)
      return
    }

    let expired = false
    setChoiceTimerLeft(activeChoiceTimerDuration)
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const left = Math.max(0, activeChoiceTimerDuration - elapsed)
      setChoiceTimerLeft(left)

      if (left > 0 || expired) return
      expired = true
      window.clearInterval(interval)
      applyEffects(timer.effects)

      if (timer.defaultNext !== undefined) {
        advance(timer.defaultNext)
        return
      }

      const defaultChoice = scene.choices?.[timer.defaultChoiceIndex ?? 0]
      const fallbackChoice = defaultChoice && canChoose(defaultChoice)
        ? defaultChoice
        : scene.choices?.find((choice) => canChoose(choice))
      if (fallbackChoice) choose(fallbackChoice)
    }, 250)

    return () => {
      expired = true
      window.clearInterval(interval)
    }
  }, [sceneIndex, complete, activeDialogue, activeChoiceTimerDuration])

  const formatQuizAnswerLine = (answer: QuizAnswer) => {
    const templates = [
      (value: string) => `Э-э-э… ${value}.`,
      (value: string) => `Я думаю, что ${value}.`,
      (value: string) => `Мне кажется, ${value}.`,
      (value: string) => `Ну… пусть будет ${value}.`,
      (value: string) => `Если честно, я бы сказал: ${value}.`,
      (value: string) => `Так, по ощущениям… ${value}.`,
    ]
    return templates[quizQuestion % templates.length](answer.label)
  }

  const answerQuiz = (answer: QuizAnswer) => {
    if (!scene.quiz) return
    playSound(gameSounds.uiClick, .58)
    setSideDialogue({
      speaker: 'Дмит',
      text: formatQuizAnswerLine(answer),
    })
    setPendingQuizAnswer({
      points: answer.points,
      reaction: answer.reaction ?? (answer.points > 0 ? 'Ц. Ладно, этот ответ принимается. Дальше.' : 'Ц-ц-ц. Неправильно. Продолжай мучить карту.'),
    })
  }

  const continueQuiz = () => {
    if (!scene.quiz || !pendingQuizAnswer) return
    playSound(gameSounds.dialoguePage, .38)
    const total = quizScore + pendingQuizAnswer.points
    const isLast = quizQuestion === scene.quiz.questions.length - 1
    setPendingQuizAnswer(null)
    setSideDialogue(null)
    if (!isLast) {
      setQuizScore(total)
      setQuizQuestion((current) => current + 1)
      return
    }
    const result = scene.quiz.results.find(({ minimumScore }) => total >= minimumScore)
    if (!result) return
    applyEffects(result.effects)
    setSceneIndex(result.next)
    setQuizQuestion(0)
    setQuizScore(0)
    setPendingQuizAnswer(null)
  }

  const resetTest = () => {
    setTestQuestion(0)
    setTestScore(0)
    setTestWarnings(0)
    setCopiedAnswer(null)
    setTeacherPosition('board')
    setTestSuspicion(18)
    setSideDialogue(null)
  }

  const restartCurrentChapter = () => {
    setSceneIndex(0)
    previousSceneIndex.current = 0
    setPlayedCinematics([])
    setQuizQuestion(0)
    setQuizScore(0)
    setPendingQuizAnswer(null)
    setPendingChoiceResolution(null)
    setPendingChoiceFailureNext(null)
    setChoiceTimerLeft(null)
    setPendingPerkLevel(null)
    setPendingSpecialLevel(null)
    setQuestLoading(null)
    setChapterCompletionOpen(false)
    setCheckpointFading(false)
    setMapOpen(false)
    setSidebarOpen(false)
    setInventoryOpen(false)
    setSettingsOpen(false)
    setDebugStageSidebarOpen(false)
    lastMobileSpeaker.current = undefined
    lastDesktopCompanion.current = undefined
    resetTest()
    writeSavedGame({ chapterId, sceneIndex: 0, player, playedCinematics: [] })
    onSave?.()
  }

  const finishTest = (next: number, effects?: SceneEffect) => {
    applyEffects(effects)
    setSceneIndex(next)
    resetTest()
  }

  const warnForCheating = () => {
    if (!scene.cheatGame) return
    const nextWarnings = testWarnings + 1
    const warningNames = ['нулевое', 'первое', 'второе', 'третье', 'четвёртое']
    const warningName = warningNames[nextWarnings] ?? `${nextWarnings}-е`
    playSound(gameSounds.teacherReveal, .42)
    setTestSuspicion((current) => Math.min(100, current + 28))
    if (nextWarnings >= scene.cheatGame.warningLimit) {
      setTestWarnings(nextWarnings)
      setSideDialogue({
        speaker: 'Географичка',
        text: `${warningName[0].toUpperCase()}${warningName.slice(1)} предупреждение. Лист на стол. Всё, Дмитриевский, контрольная превращается в похороны среднего балла.`,
      })
      window.setTimeout(() => finishTest(scene.cheatGame!.failNext, scene.cheatGame!.failEffects), 2200)
      return
    }
    setTestWarnings(nextWarnings)
    setSideDialogue({
      speaker: 'Географичка',
      text: `Дмитриевский, я всё вижу. Это ${warningName} предупреждение. До третьего досчитаю — и пойдёшь ко дну с этим листочком.`,
    })
  }

  const cheatingRisk = (action: 'peek' | 'write') => {
    const positionRisk = teacherPosition === 'board' ? .16 : teacherPosition === 'rows' ? .38 : .58
    const suspicionRisk = testSuspicion / (action === 'peek' ? 190 : 260)
    const skillRelief = (player.abilities.agility + player.abilities.perception) * .018
    return Math.max(.08, Math.min(.86, positionRisk + suspicionRisk - skillRelief + (action === 'write' ? .06 : 0)))
  }

  const caughtByTeacher = (action: 'peek' | 'write') => Math.random() < cheatingRisk(action)

  const peekAtVeronica = () => {
    if (!scene.cheatGame) return
    playSound(gameSounds.uiClick, .5)
    if (caughtByTeacher('peek')) {
      warnForCheating()
      return
    }
    const currentQuestion = scene.cheatGame.questions[testQuestion]
    if (currentQuestion.veronicaRefusal && copiedAnswer === null) {
      setCopiedAnswer('__refused__')
      setTestSuspicion((current) => Math.min(100, current + 10))
      setSideDialogue({ speaker: 'Вероника', text: currentQuestion.veronicaRefusal })
      return
    }
    const correctAnswer = currentQuestion.answers.find((answer) => answer.correct)
    setCopiedAnswer(correctAnswer?.label ?? null)
    setTestSuspicion((current) => Math.min(100, current + 18))
    setSideDialogue({ speaker: 'Вероника', text: currentQuestion.veronicaHint })
  }

  const pretendToThink = () => {
    playSound(gameSounds.dialoguePage, .28)
    setTestSuspicion((current) => Math.max(0, current - 16))
    setSideDialogue({
      speaker: 'Рассказчик',
      text: teacherPosition === 'behind' ? 'Дмит сидит ровно, как памятник учебной дисциплине. Географичка проходит за спиной, но добычи не видит.' : 'Дмит делает вид, что думает. Получается убедительно: даже ручка на секунду верит.',
    })
  }

  const writeTestAnswer = (answer: TestAnswer) => {
    if (!scene.cheatGame) return
    playSound(gameSounds.uiToggle, .46)
    if (copiedAnswer === answer.label && caughtByTeacher('write')) {
      warnForCheating()
      return
    }
    setTestSuspicion((current) => Math.min(100, copiedAnswer === answer.label ? current + 8 : current + 3))
    const nextScore = testScore + (answer.correct ? 1 : 0)
    const isLast = testQuestion === scene.cheatGame.questions.length - 1
    if (!isLast) {
      setTestScore(nextScore)
      setTestQuestion((current) => current + 1)
      setCopiedAnswer(null)
      setSideDialogue({
        speaker: 'Рассказчик',
        text: answer.correct ? 'Дмит записывает ответ. Почерк нервный, но мысль выжила.' : 'Дмит записывает ответ. Где-то на стене карта мира тихо отворачивается.',
      })
      return
    }
    const passed = nextScore >= scene.cheatGame.minimumCorrect
    finishTest(passed ? scene.cheatGame.successNext : scene.cheatGame.failNext, passed ? scene.cheatGame.successEffects : scene.cheatGame.failEffects)
  }

  const upgradeAbility = (ability: Ability) => {
    playSound(gameSounds.uiToggle, .48)
    setPlayer((current) => {
      if (current.specialPoints <= 0 || current.abilities[ability] >= 10) return current
      return { ...current, specialPoints: current.specialPoints - 1, abilities: { ...current.abilities, [ability]: current.abilities[ability] + 1 } }
    })
  }

  const choosePerk = (perkId: string) => {
    if (!pendingPerkLevel || player.perks.includes(perkId)) return
    playSound(gameSounds.uiToggle, .5)
    setPlayer((current) => ({ ...current, perks: [...current.perks, perkId], claimedPerkLevels: [...current.claimedPerkLevels, pendingPerkLevel] }))
    setPendingPerkLevel(null)
  }

  const chooseSpecialAbility = (ability: Ability) => {
    if (!pendingSpecialLevel) return
    playSound(gameSounds.uiToggle, .5)
    setPlayer((current) => {
      if (current.specialPoints <= 0 || current.abilities[ability] >= 10) return current
      const claimedSpecialLevels = current.claimedSpecialLevels ?? current.rewardedSpecialLevels ?? []
      return {
        ...current,
        specialPoints: current.specialPoints - 1,
        abilities: { ...current.abilities, [ability]: current.abilities[ability] + 1 },
        claimedSpecialLevels: [...new Set([...claimedSpecialLevels, pendingSpecialLevel])],
      }
    })
    setPendingSpecialLevel(null)
  }

  const completeCinematic = () => setPlayedCinematics((current) => [...current, sceneIndex])
  const finishRoachGame = (success: boolean) => {
    if (!scene.roachGame) return
    const nextScene = success ? scene.roachGame.successNext : scene.roachGame.failNext
    applyEffects(success ? scene.roachGame.successEffects : scene.roachGame.failEffects)
    setSceneIndex(nextScene)
    setQuizQuestion(0)
    setQuizScore(0)
    setPendingQuizAnswer(null)
    setSideDialogue(null)
    resetTest()
  }
  const toggleDebugMode = () => {
    if (!debugAvailable) return
    playSound(gameSounds.uiToggle, .48)
    setDebugModeEnabled((current) => {
      if (current) setDebugStageSidebarOpen(false)
      return !current
    })
  }
  const startDebugStage = (nextSceneIndex: number) => {
    if (!activeDebugMode) return
    playSound(gameSounds.uiClick, .5)
    setSceneIndex(nextSceneIndex)
    setPlayedCinematics((current) => current.includes(nextSceneIndex) ? current : [...current, nextSceneIndex])
    setQuizQuestion(0)
    setQuizScore(0)
    setPendingQuizAnswer(null)
    setSideDialogue(null)
    setPendingChoiceResolution(null)
    setPendingChoiceFailureNext(null)
    setChoiceTimerLeft(null)
    resetTest()
  }
  const startQuestFromMap = async (quest: Quest, setupFlags: string[] = [], resetFlags: string[] = []) => {
    if (quest.startSceneIndex === undefined || chapterLoading || questLoading) return
    playSound(gameSounds.uiClick, .62)
    if (setupFlags.length > 0 || resetFlags.length > 0) {
      setPlayer((current) => {
        const reset = new Set(resetFlags)
        const flags = Array.from(new Set([...current.flags.filter((flag) => !reset.has(flag)), ...setupFlags]))
        return { ...current, flags }
      })
    }
    setMapOpen(false)
    setSidebarOpen(false)
    setInventoryOpen(false)
    setSettingsOpen(false)

    const assets = quest.preloadAssets?.length
      ? quest.preloadAssets
      : collectStoryPreloadAssets(
        chapter,
        quest.startSceneIndex,
        quest.completedAfterSceneIndex === undefined ? chapter.scenes.length : quest.completedAfterSceneIndex + 1,
      )
    if (assets.length > 0) {
      const groupedAssets = (['background', 'character', 'audio'] as const)
        .map((kind) => ({ kind, label: questLoadingStageLabels[kind], assets: assets.filter((asset) => asset.kind === kind) }))
        .filter((stage) => stage.assets.length > 0)

      setQuestLoading({
        title: quest.title,
        total: assets.length,
        loaded: 0,
        stages: groupedAssets.map((stage) => ({
          label: stage.label,
          total: stage.assets.length,
          loaded: 0,
          status: 'pending',
        })),
      })

      let totalLoaded = 0
      for (let stageIndex = 0; stageIndex < groupedAssets.length; stageIndex += 1) {
        setQuestLoading((current) => current ? {
          ...current,
          stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, status: 'loading' } : stage),
        } : current)

        await Promise.all(groupedAssets[stageIndex].assets.map(async (asset) => {
          await preloadAsset(asset)
          totalLoaded += 1
          setQuestLoading((current) => current ? {
            ...current,
            loaded: totalLoaded,
            stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, loaded: stage.loaded + 1 } : stage),
          } : current)
        }))

        setQuestLoading((current) => current ? {
          ...current,
          stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, status: 'done', loaded: stage.total } : stage),
        } : current)
        await wait(180)
      }
      await wait(260)
      setQuestLoading(null)
    }

    setSceneIndex(Math.min(quest.startSceneIndex, chapter.scenes.length - 1))
    setQuizQuestion(0)
    setQuizScore(0)
    setPendingQuizAnswer(null)
    setSideDialogue(null)
    setPendingChoiceResolution(null)
    setPendingChoiceFailureNext(null)
    resetTest()
  }
  const handleDialoguePanelTap = (event: MouseEvent<HTMLElement>) => {
    if (chapterLoading || questLoading) return
    if (event.target instanceof HTMLElement && event.target.closest('button')) return
    if (!dialogueComplete) return
    if (scene.quiz && pendingQuizAnswer) {
      if (sideDialogue) {
        playSound(gameSounds.dialoguePage, .38)
        setSideDialogue(null)
        return
      }
      continueQuiz()
      return
    }
    if (pendingChoiceResolution) {
      continuePendingChoice()
      return
    }
    if (pendingChoiceFailureNext !== null) {
      const nextScene = pendingChoiceFailureNext
      setPendingChoiceFailureNext(null)
      advance(nextScene)
      return
    }
    if (scene.choices || scene.quiz || scene.cheatGame || scene.roachGame) return
    const nextScene = resolveNextScene(scene.next)
    if (nextScene !== undefined) {
      advance(scene.next)
      return
    }
    if (chapterEndingScene) {
      setChapterCompletionOpen(true)
      return
    }
    setMapOpen(true)
  }
  const handleMobileStageTap = (event: MouseEvent<HTMLDivElement>) => {
    if (chapterLoading || questLoading) return
    if (!window.matchMedia('(max-width: 680px)').matches) return
    if (cinematicActive || phoneMode || sidebarOpen || inventoryOpen || mapOpen || settingsOpen || debugStageSidebarOpen || pendingPerkLevel || pendingSpecialLevel) return
    if (event.target instanceof HTMLElement && event.target.closest([
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '.story-topbar',
      '.dialogue-panel',
      '.phone-scene',
      '.control-work-window',
      '.roach-game',
    ].join(','))) return

    handleDialoguePanelTap(event)
  }
  const phoneChoiceOptions: PhoneChoiceOption[] = phoneMode && dialogueComplete && scene.choices && !activeDialogue
    ? visibleChoices.map((choice) => ({
      label: formatChoiceLabel(choice),
      locked: !canChoose(choice),
      onSelect: () => choose(choice),
    }))
    : []

  return (
    <main className={`story-screen scene-tone-${scene.tone ?? 'default'} ${cinematicActive ? 'cinematic-running' : ''}`}>
      {chapterCompletionOpen && <ChapterCompletionOverlay onContinue={onChapterComplete} />}
      {relationNotifications.length > 0 && (
        <div className="relation-notifications" aria-live="polite" aria-atomic="false">
          {relationNotifications.map((notification) => (
            <div className={`relation-notification ${notification.tone}`} key={notification.id}>
              <span aria-hidden="true" className="relation-notification-icon">
                {notification.kind === 'reputation' || notification.kind === 'story'
                  ? notification.kind === 'reputation' ? <Award /> : <Sparkles />
                  : notification.kind === 'trait' ? <Sparkles />
                    : notification.tone === 'positive' ? <Heart /> : <HeartCrack />}
              </span>
              {notification.text}
            </div>
          ))}
        </div>
      )}
      <GameSidebar player={player} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onUpgradeAbility={upgradeAbility} visibleRelations={seenRelationCharacters} />
      <InventoryPanel player={player} open={inventoryOpen} onClose={() => setInventoryOpen(false)} />
      {chapterId === 'chapter-1' && <MapPanel open={mapOpen} onClose={() => setMapOpen(false)} currentSceneIndex={sceneIndex} playerFlags={player.flags} debugModeEnabled={activeDebugMode} onStartQuest={startQuestFromMap} />}
      {(chapterLoading ?? questLoading) && <QuestLoadingOverlay loading={chapterLoading ?? questLoading!} />}
      <SettingsPanel
        open={settingsOpen}
        debugModeEnabled={activeDebugMode}
        debugAvailable={debugAvailable}
        debugPanelOpen={debugStageSidebarOpen}
        onToggleDebugMode={toggleDebugMode}
        onOpenDebugPanel={() => { if (activeDebugMode) { setDebugStageSidebarOpen((current) => !current); setSettingsOpen(false) } }}
        onRestartChapter={restartCurrentChapter}
        onClose={() => setSettingsOpen(false)}
      />
      {activeDebugMode && <DebugStageSidebar chapter={chapter} currentSceneIndex={sceneIndex} questScope={debugQuestScope} open={debugStageSidebarOpen} onClose={() => setDebugStageSidebarOpen(false)} onSelectStage={startDebugStage} />}
      {pendingSpecialLevel && <SpecialLevelUp level={pendingSpecialLevel} abilities={player.abilities} onSelect={chooseSpecialAbility} />}
      {pendingPerkLevel && <PerkSelection level={pendingPerkLevel} selectedPerks={player.perks} onSelect={choosePerk} />}
      <div className="game-stage" onClick={handleMobileStageTap}>
        <div className={`checkpoint-fade ${checkpointFading || backgroundFading ? 'active' : ''}`} />
        <div className="story-topbar">
          <button className="topbar-menu-button" onClick={onExit} aria-label="Вернуться в меню" title="Меню"><Menu aria-hidden="true" /><span className="topbar-menu-label">Меню</span></button>
          <span>{chapterId === 'chapter-2' ? 'Глава Вторая. Путёвка' : <>{chapter.title} <i /> {chapter.subtitle}</>}</span>
          <div className="topbar-actions">
            <button className="topbar-icon-button" onClick={() => { setSidebarOpen((current) => !current); setInventoryOpen(false); setMapOpen(false); setSettingsOpen(false); setDebugStageSidebarOpen(false) }} aria-label="Характеристики" title="Характеристики"><ChartNoAxesCombined aria-hidden="true" /></button>
            <button className="topbar-icon-button" onClick={() => { setInventoryOpen((current) => !current); setSidebarOpen(false); setMapOpen(false); setSettingsOpen(false); setDebugStageSidebarOpen(false) }} aria-label="Инвентарь" title="Инвентарь"><Backpack aria-hidden="true" /></button>
            {chapterId === 'chapter-1' && <button className="topbar-icon-button" onClick={() => { setMapOpen((current) => !current); setSidebarOpen(false); setInventoryOpen(false); setSettingsOpen(false); setDebugStageSidebarOpen(false) }} aria-label="Карта" title="Карта"><MapIcon aria-hidden="true" /></button>}
            <button className="topbar-icon-button" onClick={() => { setSettingsOpen((current) => !current); setSidebarOpen(false); setInventoryOpen(false); setMapOpen(false); setDebugStageSidebarOpen(false) }} aria-label="Настройки" title="Настройки"><SettingsIcon aria-hidden="true" /></button>
            <b>{String(sceneIndex + 1).padStart(2, '0')} / {String(chapter.scenes.length).padStart(2, '0')}</b>
          </div>
        </div>
        <div className={`school-background background-${activeBackground}`} style={{ backgroundImage }} />
        {!scene.autoRoute && !cinematicActive && !phoneMode && !narratorLine && <section className="portraits desktop-portraits" aria-label="Персонажи сцены">
          <Portrait character={desktopLeftPortrait} position="left" active={dialogueSpeaker === desktopLeftPortrait} emotion={scene.left === 'Дмит' ? scene.leftEmotion : undefined} />
          <Portrait character={desktopRightPortrait} position="right" active={dialogueSpeaker === desktopRightPortrait} emotion={desktopRightEmotion} />
        </section>}
        {!scene.autoRoute && !cinematicActive && !phoneMode && !narratorLine && <section className="portraits mobile-portraits" aria-label="Персонажи сцены на телефоне">
          <Portrait character={mobileSpeaker} position={mobileSpeakerPosition} active={Boolean(mobileSpeaker)} emotion={mobileSpeakerEmotion} layoutMode="mobile" visible={Boolean(mobileSpeaker)} transitionKey={`mobile-${mobileSpeaker}-${mobileSpeakerPosition}`} />
        </section>}
        {!scene.autoRoute && !cinematicActive && phoneMode && activePhoneMessage && <PhoneMessenger contact={activePhoneMessage.contact} messages={phoneMessages} complete={dialogueComplete} choices={phoneChoiceOptions} time={activePhoneMessage.time} onTap={handleDialoguePanelTap} />}
        {!scene.autoRoute && !cinematicActive && !phoneMode && <div className={`dialogue-shell dialogue-shell-${speakerNameSide}`} onClick={(event) => { event.stopPropagation(); handleDialoguePanelTap(event) }}>
          <div className={`speaker-name ${speakerNameSide === 'narrator' ? 'narrator' : `speaker-${speakerNameSide}`}`}>{dialogueSpeaker}</div>
          <section className="dialogue-panel"><p className="dialogue-text">{dialogueText}<span className={!dialogueComplete ? 'caret' : 'caret hidden'}>в–Ќ</span></p>
          {choiceTimerVisible && <div
            className="choice-timer"
            style={{ '--choice-timer-progress': `${choiceTimerProgress}%` } as CSSProperties}
            aria-label={`Осталось ${choiceTimerLeft} секунд`}
          >
            <span>{choiceTimerLeft}</span>
          </div>}
          {complete && scene.choices && !activeDialogue && <div className={`choices ${choiceTimerVisible ? 'timed' : ''}`}>{visibleChoices.map((choice) => <button className={!canChoose(choice) ? 'locked' : ''} disabled={!canChoose(choice)} key={choice.label} onClick={() => choose(choice)}><span>{formatChoiceLabel(choice)}</span><i>{canChoose(choice) ? '→' : '×'}</i></button>)}</div>}
          {activeDialogue && pendingChoiceResolution && <button className="continue next-step" onClick={continuePendingChoice}>Дальше <span>↓</span></button>}
          {activeDialogue && pendingChoiceFailureNext !== null && <button className="continue next-step" onClick={() => { const nextScene = pendingChoiceFailureNext; setPendingChoiceFailureNext(null); advance(nextScene) }}>Дальше <span>↓</span></button>}
          {complete && scene.quiz && activeQuizQuestion && !pendingQuizAnswer && <div className="choices quiz-dialogue-choices">{activeQuizQuestion.answers.map((answer) => <button key={answer.label} onClick={() => answerQuiz(answer)}><span>{answer.label}</span><i>→</i></button>)}</div>}
          {complete && scene.quiz && pendingQuizAnswer && <button className="continue quiz-continue" onClick={continueQuiz}>Продолжить <span>→</span></button>}
          {complete && !scene.choices && !scene.quiz && !scene.cheatGame && !scene.roachGame && resolveNextScene(scene.next) !== undefined && <button className="continue next-step" onClick={() => advance(scene.next)}>Далее <span>↓</span></button>}
          {complete && chapterEndingScene && <button className="continue finish" onClick={() => setChapterCompletionOpen(true)}>Завершить главу <span>✦</span></button>}
          {complete && !chapterEndingScene && !scene.choices && !scene.quiz && !scene.cheatGame && !scene.roachGame && resolveNextScene(scene.next) === undefined && <button className="continue finish" onClick={() => setMapOpen(true)}>Открыть карту <span>↗</span></button>}
          </section>
        </div>}
        {complete && scene.cheatGame && activeCheatQuestion && <section className="control-work-window" aria-label="Контрольная работа"><div className="cheat-card"><div className="cheat-head"><div><p className="quiz-progress">{scene.cheatGame.title} · Лист {testQuestion + 1} из {scene.cheatGame.questions.length}</p><h2>{activeCheatQuestion.prompt}</h2></div><div className={`teacher-watch ${teacherPosition !== 'board' ? 'watching' : ''}`}><i />Географичка {teacherPositionLabel}</div></div><p className="cheat-description">{scene.cheatGame.description}</p><div className="warning-track"><span>Предупреждения</span><b>{testWarnings} / {scene.cheatGame.warningLimit}</b></div><div className="suspicion-meter"><span>Подозрение</span><div><b style={{ width: `${testSuspicion}%` }} /></div><strong>{testSuspicion}%</strong></div><div className="test-sheet">{activeCheatQuestion.answers.map((answer) => <button className={copiedAnswer === answer.label ? 'copied' : ''} key={answer.label} onClick={() => writeTestAnswer(answer)}>Записать: {answer.label}</button>)}</div><div className="cheat-actions"><button onClick={peekAtVeronica}>Подсмотреть у Вероники <small>риск {Math.round(cheatingRisk('peek') * 100)}%</small></button><button onClick={pretendToThink}>Сидеть ровно <small>-подозрение</small></button></div></div></section>}
        {complete && scene.roachGame && <CockroachHuntGame game={scene.roachGame} onFinish={finishRoachGame} />}
        {cinematicActive && <DoorReveal onComplete={completeCinematic} />}
      </div>
    </main>
  )
}

function QuestLoadingOverlay({ loading }: { loading: QuestLoadingState }) {
  const progress = loading.total > 0 ? Math.round((loading.loaded / loading.total) * 100) : 100

  return (
    <section className="quest-loading-overlay" role="status" aria-live="polite">
      <div className="quest-loading-card">
        <span className="quest-loading-eyebrow">Подготовка истории</span>
        <h2>{loading.title}</h2>
        <p>Подгружаю нужные ассеты, чтобы сцены не дёргались в самый ответственный момент.</p>
        <div className="quest-loading-progress" aria-label={`Загружено ${loading.loaded} из ${loading.total}`}>
          <b style={{ width: `${progress}%` }} />
        </div>
        <strong className="quest-loading-counter">{loading.loaded} / {loading.total} · {progress}%</strong>
        <ol className="quest-loading-stages">
          {loading.stages.map((stage) => (
            <li className={stage.status} key={stage.label}>
              <span>{stage.label}</span>
              <b>{stage.loaded} / {stage.total}</b>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}


