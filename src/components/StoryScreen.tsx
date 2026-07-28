import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { gameSounds, playLoop, playSound } from '../audio/gameAudio'
import { abilityLabels, experienceForLevel, type PlayerState } from '../data/player'
import { writeSavedGame } from '../data/saveGame'
import { InventoryPanel } from './InventoryPanel'
import { MapPanel } from './MapPanel'
import { CockroachHuntGame } from './CockroachHuntGame'
import { DoorReveal } from './DoorReveal'
import { SettingsPanel } from './SettingsPanel'
import classroomBackground from '../assets/class.png'
import dmitKitchenBackground from '../assets/dmit_kitchen.png'
import dmitRoomBackground from '../assets/dmit_room.png'
import dmitRoomCleanBackground from '../assets/dmit_room_clean.png'
import minkaBackground from '../assets/minka.png'
import type { Ability, Chapter, Character, CheatGameQuestion, QuizQuestion, RelationCharacter, SceneEffect, StoryChoice } from '../types/story'
import { GameSidebar } from './GameSidebar'
import { PerkSelection } from './PerkSelection'
import { PhoneMessenger, type PhoneChoiceOption, type PhoneThreadMessage } from './PhoneMessenger'
import { Portrait } from './Portrait'

type StoryScreenProps = {
  chapter: Chapter
  initialPlayer: PlayerState
  initialSceneIndex?: number
  initialPlayedCinematics?: number[]
  onSave?: () => void
  onExit: () => void
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

export function StoryScreen({ chapter, initialPlayer, initialSceneIndex = 0, initialPlayedCinematics = [], onSave, onExit }: StoryScreenProps) {
  const [sceneIndex, setSceneIndex] = useState(() => Math.min(initialSceneIndex, chapter.scenes.length - 1))
  const [visibleText, setVisibleText] = useState('')
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [pendingPerkLevel, setPendingPerkLevel] = useState<number | null>(null)
  const [playedCinematics, setPlayedCinematics] = useState<number[]>(initialPlayedCinematics)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [textAnimationEnabled, setTextAnimationEnabled] = useState(() => window.localStorage.getItem('dmit-text-animation') !== 'false')
  const [debugModeEnabled, setDebugModeEnabled] = useState(() => import.meta.env.DEV && window.localStorage.getItem('dmit-debug-mode') === 'true')
  const previousSceneIndex = useRef(sceneIndex)
  const ambientAudio = useRef<HTMLAudioElement | null>(null)
  const debugAvailable = import.meta.env.DEV
  const activeDebugMode = debugAvailable && debugModeEnabled
  const scene = chapter.scenes[sceneIndex]
  const activeBackground = [...chapter.scenes.slice(0, sceneIndex + 1)].reverse().find((currentScene) => currentScene.background)?.background ?? 'school'
  const dmitRoomImage = player.flags.includes('CHAPTER_1_ROOM_CLEANED') ? dmitRoomCleanBackground : dmitRoomBackground
  const backgroundImage = activeBackground === 'classroom'
    ? `linear-gradient(180deg, rgba(31, 22, 39, .12), rgba(29, 13, 29, .60)), url(${classroomBackground})`
    : activeBackground === 'home'
      ? `linear-gradient(180deg, rgba(31, 22, 39, .06), rgba(29, 13, 29, .36)), url(${dmitKitchenBackground})`
      : activeBackground === 'dmit-room'
        ? `linear-gradient(180deg, rgba(31, 22, 39, .08), rgba(29, 13, 29, .42)), url(${dmitRoomImage})`
        : activeBackground === 'minika'
          ? `linear-gradient(180deg, rgba(14, 15, 27, .18), rgba(12, 9, 18, .58)), url(${minkaBackground})`
          : `linear-gradient(180deg, rgba(31, 22, 39, .12), rgba(29, 13, 29, .60)), url(${chapter.background})`
  const activeQuizQuestion = scene.quiz?.questions[quizQuestion]
  const typingText = activeQuizQuestion?.question ?? scene.text
  const cinematicActive = Boolean(scene.cinematic && !playedCinematics.includes(sceneIndex))
  const phoneMode = Boolean(scene.phoneMessage)
  const complete = visibleText.length === typingText.length
  const activeCheatQuestion = scene.cheatGame?.questions[testQuestion]
  const teacherPositionLabel = teacherPosition === 'board' ? 'у доски' : teacherPosition === 'rows' ? 'между рядами' : 'за спиной'
  const quizDialogue: DialogueLine | null = pendingQuizAnswer ? { speaker: 'Географичка', text: pendingQuizAnswer.reaction } : null
  const activeDialogue = sideDialogue ?? quizDialogue
  const dialogueSpeaker = activeDialogue?.speaker ?? (activeQuizQuestion ? 'Географичка' : scene.speaker)
  const dialogueText = activeDialogue?.text ?? visibleText
  const dialogueComplete = Boolean(activeDialogue) || complete
  const choiceTimerVisible = Boolean(scene.choiceTimer && scene.choices && dialogueComplete && !activeDialogue && choiceTimerLeft !== null)
  const choiceTimerProgress = scene.choiceTimer && choiceTimerLeft !== null
    ? Math.max(0, Math.min(100, (choiceTimerLeft / scene.choiceTimer.durationSeconds) * 100))
    : 0
  const mobileSpeaker = (dialogueSpeaker !== 'Рассказчик' ? dialogueSpeaker : undefined) as Character | undefined
  const mobileSpeakerPosition = mobileSpeaker === 'Дмит' ? 'left' : 'right'
  const speakerNameSide = dialogueSpeaker === 'Рассказчик' ? 'narrator' : mobileSpeakerPosition
  const mobileSpeakerEmotion = mobileSpeaker === scene.left ? scene.leftEmotion : mobileSpeaker === scene.right ? scene.rightEmotion : undefined
  const phoneMessages: PhoneThreadMessage[] = scene.phoneMessage ? [
    ...chapter.scenes
      .slice(0, sceneIndex)
      .reverse()
      .reduce<PhoneHistoryAccumulator>((history, historyScene) => {
        if (history.stop || !historyScene.phoneMessage || historyScene.phoneMessage.contact !== scene.phoneMessage?.contact) {
          return { stop: true, messages: history.messages }
        }
        return {
          stop: false,
          messages: [{
            speaker: historyScene.speaker,
            text: historyScene.text,
            direction: historyScene.phoneMessage.direction,
          }, ...history.messages],
        }
      }, { stop: false, messages: [] }).messages,
    {
      speaker: dialogueSpeaker,
      text: dialogueText,
      direction: dialogueSpeaker === 'Дмит' ? 'outgoing' : scene.phoneMessage.direction,
    },
  ] : []
  const seenRelationCharacters = (Object.keys(player.relations) as RelationCharacter[]).filter((character) => (
    chapter.scenes.slice(0, sceneIndex + 1).some((currentScene) => (
      currentScene.speaker === character || currentScene.left === character || currentScene.right === character
    ))
  ))

  useEffect(() => {
    writeSavedGame({ sceneIndex, player, playedCinematics })
    onSave?.()
  }, [sceneIndex, player, playedCinematics, onSave])

  useEffect(() => {
    const saveBeforeUnload = () => writeSavedGame({ sceneIndex, player, playedCinematics })
    window.addEventListener('beforeunload', saveBeforeUnload)
    return () => window.removeEventListener('beforeunload', saveBeforeUnload)
  }, [sceneIndex, player, playedCinematics])

  useEffect(() => {
    setVisibleText('')
    if (cinematicActive) return
    if (!textAnimationEnabled) {
      setVisibleText(typingText)
      return
    }
    let index = 0
    const typing = window.setInterval(() => {
      index += 1
      setVisibleText(typingText.slice(0, index))
      if (index >= typingText.length) window.clearInterval(typing)
    }, 14)
    return () => window.clearInterval(typing)
  }, [cinematicActive, sceneIndex, quizQuestion, typingText, textAnimationEnabled])

  useEffect(() => {
    window.localStorage.setItem('dmit-text-animation', String(textAnimationEnabled))
  }, [textAnimationEnabled])

  useEffect(() => {
    if (!debugAvailable) return
    window.localStorage.setItem('dmit-debug-mode', String(debugModeEnabled))
  }, [debugAvailable, debugModeEnabled])

  useEffect(() => {
    if (previousSceneIndex.current === sceneIndex) return
    previousSceneIndex.current = sceneIndex
    playSound(gameSounds.dialoguePage, .46)
    if (scene.sound === 'school-bell') playSound(gameSounds.schoolBell, .74)
    if (scene.sound === 'mishgan-fall') playSound(gameSounds.mishganFall, .86)
    if (scene.sound === 'dmit-run') playSound(gameSounds.dmitRun, .7, 3)
    if (scene.sound === 'guard-run') playSound(gameSounds.guardRun, .72, 3)
    if (scene.sound === 'guard-shout') playSound(gameSounds.guardShout, .78)
    if (scene.sound === 'phone-vibrate') playSound(gameSounds.phoneVibrate, .62)
    if (scene.sound === 'quest-complete') playSound(gameSounds.questComplete, .62)
    if (scene.sound === 'beer-open') playSound(gameSounds.beerOpen, .72)
    if (scene.sound === 'matvey-music') playSound(gameSounds.matveyMusic, .64)
    if (scene.sound === 'skill-success') playSound(gameSounds.skillSuccess, .58)
    if (scene.sound === 'skill-fail') playSound(gameSounds.skillFail, .46)
  }, [sceneIndex, scene.sound])

  useEffect(() => {
    ambientAudio.current?.pause()
    ambientAudio.current = playLoop(
      activeBackground === 'classroom'
        ? gameSounds.classroomAmbient
        : activeBackground === 'minika'
          ? gameSounds.minikaAmbient
          : activeBackground === 'home' || activeBackground === 'dmit-room'
            ? gameSounds.dmitRoomAmbient
            : gameSounds.schoolyardAmbient,
      activeBackground === 'classroom' ? .18 : activeBackground === 'minika' ? .24 : activeBackground === 'home' || activeBackground === 'dmit-room' ? .2 : .2,
    )
    return () => {
      ambientAudio.current?.pause()
      ambientAudio.current = null
    }
  }, [activeBackground])

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
      const rewardLevels = Array.from({ length: level }, (_, index) => index + 1).filter((currentLevel) => currentLevel % 3 === 0 && !current.rewardedSpecialLevels.includes(currentLevel))
      if (rewardLevels.length === 0) return current
      return { ...current, specialPoints: current.specialPoints + rewardLevels.length, rewardedSpecialLevels: [...current.rewardedSpecialLevels, ...rewardLevels] }
    })
  }, [player.experience])

  useEffect(() => {
    const level = experienceForLevel(player.experience)
    const nextPerkLevel = Array.from({ length: level }, (_, index) => index + 1).find((currentLevel) => currentLevel % 2 === 0 && !player.claimedPerkLevels.includes(currentLevel))
    if (nextPerkLevel) setPendingPerkLevel(nextPerkLevel)
  }, [player.experience, player.claimedPerkLevels])

  const applyEffects = (effects?: SceneEffect) => {
    if (!effects) return
    setPlayer((current) => {
      const experience = effects.experience ?? 0
      const boostedExperience = current.perks.includes('streetwise') && experience > 0 ? Math.ceil(experience * 1.25) : experience
      const relations = Object.fromEntries(Object.entries(effects.relations ?? {}).map(([character, value]) => [character, current.relations[character as keyof typeof current.relations] + (value ?? 0)]))
      return {
        ...current,
        money: Math.max(0, (current.money ?? 0) + (effects.money ?? 0)),
        experience: current.experience + boostedExperience,
        reputation: current.reputation + (effects.reputation ?? 0),
        abilities: { ...current.abilities, ...Object.fromEntries(Object.entries(effects.abilities ?? {}).map(([ability, value]) => [ability, current.abilities[ability as keyof typeof current.abilities] + (value ?? 0)])) },
        relations: { ...current.relations, ...relations },
        flags: [...current.flags, ...(effects.flags ?? [])],
      }
    })
  }

  const resolveNextScene = (next?: number) => {
    if (next !== undefined) return next
    const flagRoute = scene.nextByFlag?.find((route) => player.flags.includes(route.flag))
    return flagRoute?.next ?? scene.fallbackNext
  }

  const advance = (next?: number) => {
    if (!complete) {
      setVisibleText(typingText)
      return
    }
    const resolvedNext = resolveNextScene(next)
    if (resolvedNext !== undefined) {
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
    if (checks.length === 0) return 100
    const chances = checks.map(([ability, minimum]) => {
      const abilityScore = player.abilities[ability as keyof typeof player.abilities]
      const difference = abilityScore - minimum
      const rawChance = difference >= 0 ? 70 + difference * 10 : 70 + difference * 27.5
      return Math.round(Math.max(5, Math.min(95, rawChance)) / 5) * 5
    })
    return Math.min(...chances)
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

  const spokenChoiceText = (choice: StoryChoice) => choice.say ?? cleanChoiceText(choice.label)

  const queueChoiceResolution = (choice: StoryChoice, resolution: PendingChoiceResolution) => {
    setChoiceTimerLeft(null)
    setSideDialogue({
      speaker: 'Дмит',
      text: spokenChoiceText(choice),
    })
    setPendingChoiceResolution(resolution)
  }

  const continuePendingChoice = () => {
    if (!pendingChoiceResolution) return

    if (pendingChoiceResolution.followupDialogue) {
      applyEffects(pendingChoiceResolution.effects)
      setSideDialogue(pendingChoiceResolution.followupDialogue)
      setPendingChoiceResolution({
        next: pendingChoiceResolution.next,
      })
      return
    }

    applyEffects(pendingChoiceResolution.effects)
    const nextScene = pendingChoiceResolution.next
    setPendingChoiceResolution(null)
    setSideDialogue(null)
    if (nextScene !== undefined) {
      advance(nextScene)
    }
  }

  const formatChoiceLabel = (choice: StoryChoice) => {
    const checks = Object.entries(choice.requires ?? {})
    const shortLabel = choice.shortLabel ?? shortenChoiceText(choice.label)
    if (checks.length === 0) return shortLabel
    const requirements = checks.map(([ability, minimum]) => {
      const abilityKey = ability as keyof typeof player.abilities
      return `${abilityLabels[abilityKey]} ${player.abilities[abilityKey]}/${minimum}`
    }).join(', ')
    return `[${requirements} · шанс ${skillCheckChance(choice)}%] ${shortLabel}`
  }

  const canChoose = (choice: StoryChoice) => (
    (choice.requiresMoney === undefined || player.money >= choice.requiresMoney)
    && (choice.requiresPerks ?? []).every((perk) => player.perks.includes(perk))
    && Object.entries(choice.requiresRelations ?? {}).every(([character, minimum]) => player.relations[character as keyof typeof player.relations] >= minimum)
  )

  const choose = (choice: StoryChoice) => {
    if (!canChoose(choice)) return
    playSound(gameSounds.uiClick, .58)
    if (Object.keys(choice.requires ?? {}).length > 0 && Math.random() * 100 >= skillCheckChance(choice)) {
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
      applyEffects(choice.failureEffects)
      if (choice.failNext !== undefined) {
        setPendingChoiceFailureNext(choice.failNext ?? null)
        setSideDialogue({
          speaker: 'Рассказчик',
          text: choice.failureText ?? 'Дмит пытается провернуть это, но районная математика говорит: не сегодня.',
        })
        return
      }
      setSideDialogue({
        speaker: 'Рассказчик',
        text: choice.failureText ?? 'Дмит пытается провернуть это, но районная математика говорит: не сегодня.',
      })
      return
    }
    if (Object.keys(choice.requires ?? {}).length > 0) playSound(gameSounds.skillSuccess, .58)
    queueChoiceResolution(choice, {
      next: choice.next,
      effects: choice.effects,
    })
    return
    applyEffects(choice.effects)
    advance(choice.next)
  }

  useEffect(() => {
    const timer = scene.choiceTimer
    if (!timer || !scene.choices || !complete || activeDialogue) {
      setChoiceTimerLeft(null)
      return
    }

    let expired = false
    setChoiceTimerLeft(timer.durationSeconds)
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const left = Math.max(0, timer.durationSeconds - elapsed)
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
  }, [sceneIndex, complete, activeDialogue])

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
  const skipDialogueAnimation = () => {
    playSound(gameSounds.dialoguePage, .34)
    setVisibleText(typingText)
  }
  const toggleTextAnimation = () => {
    playSound(gameSounds.uiToggle, .48)
    setTextAnimationEnabled((current) => !current)
  }
  const toggleDebugMode = () => {
    if (!debugAvailable) return
    playSound(gameSounds.uiToggle, .48)
    setDebugModeEnabled((current) => !current)
  }
  const startQuestFromMap = (questSceneIndex: number, setupFlags: string[] = [], resetFlags: string[] = []) => {
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
    setSceneIndex(Math.min(questSceneIndex, chapter.scenes.length - 1))
  }
  const handleDialoguePanelTap = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('button')) return
    if (!dialogueComplete) {
      skipDialogueAnimation()
      return
    }
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
    setMapOpen(true)
  }
  const handleMobileStageTap = (event: MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(max-width: 680px)').matches) return
    if (cinematicActive || phoneMode || sidebarOpen || inventoryOpen || mapOpen || settingsOpen || pendingPerkLevel) return
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
    ? scene.choices.map((choice) => ({
      label: formatChoiceLabel(choice),
      locked: !canChoose(choice),
      onSelect: () => choose(choice),
    }))
    : []

  return (
    <main className={`story-screen scene-tone-${scene.tone ?? 'default'} ${cinematicActive ? 'cinematic-running' : ''}`}>
      <GameSidebar player={player} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onUpgradeAbility={upgradeAbility} visibleRelations={seenRelationCharacters} />
      <InventoryPanel player={player} open={inventoryOpen} onClose={() => setInventoryOpen(false)} />
      <MapPanel open={mapOpen} onClose={() => setMapOpen(false)} currentSceneIndex={sceneIndex} playerFlags={player.flags} debugModeEnabled={activeDebugMode} onStartQuest={startQuestFromMap} />
      <SettingsPanel
        open={settingsOpen}
        textAnimationEnabled={textAnimationEnabled}
        debugModeEnabled={activeDebugMode}
        debugAvailable={debugAvailable}
        onToggleTextAnimation={toggleTextAnimation}
        onToggleDebugMode={toggleDebugMode}
        onClose={() => setSettingsOpen(false)}
      />
      {pendingPerkLevel && <PerkSelection level={pendingPerkLevel} selectedPerks={player.perks} onSelect={choosePerk} />}
      <div className="game-stage" onClick={handleMobileStageTap}>
        <div className="story-topbar">
          <button onClick={onExit} aria-label="Вернуться в меню">← Меню</button>
          <span>{chapter.title} <i /> {chapter.subtitle}</span>
          <div className="topbar-actions"><button onClick={() => { setSidebarOpen((current) => !current); setInventoryOpen(false); setMapOpen(false); setSettingsOpen(false) }}>Характеристики</button><button onClick={() => { setInventoryOpen((current) => !current); setSidebarOpen(false); setMapOpen(false); setSettingsOpen(false) }}>Инвентарь</button><button onClick={() => { setMapOpen((current) => !current); setSidebarOpen(false); setInventoryOpen(false); setSettingsOpen(false) }}>Карта</button><button onClick={() => { setSettingsOpen((current) => !current); setSidebarOpen(false); setInventoryOpen(false); setMapOpen(false) }}>Настройки</button><b>{String(sceneIndex + 1).padStart(2, '0')} / {String(chapter.scenes.length).padStart(2, '0')}</b></div>
        </div>
        <div className={`school-background background-${activeBackground}`} style={{ backgroundImage }} />
        {!cinematicActive && !phoneMode && <section className="portraits desktop-portraits" aria-label="Персонажи сцены">
          <Portrait character={scene.left} position="left" active={dialogueSpeaker === scene.left} emotion={scene.leftEmotion} />
          <Portrait character={scene.right} position="right" active={dialogueSpeaker === scene.right} emotion={scene.rightEmotion} />
        </section>}
        {!cinematicActive && !phoneMode && <section className="portraits mobile-portraits" aria-label="Персонажи сцены на телефоне">
          <Portrait character={mobileSpeaker} position={mobileSpeakerPosition} active={Boolean(mobileSpeaker)} emotion={mobileSpeakerEmotion} layoutMode="mobile" visible={Boolean(mobileSpeaker)} transitionKey={`mobile-${dialogueSpeaker}-${sceneIndex}`} />
        </section>}
        {!cinematicActive && phoneMode && scene.phoneMessage && <PhoneMessenger contact={scene.phoneMessage.contact} messages={phoneMessages} complete={dialogueComplete} choices={phoneChoiceOptions} time={scene.phoneMessage.time} onTap={handleDialoguePanelTap} />}
        {!cinematicActive && !phoneMode && <div className="dialogue-shell" onClick={(event) => { event.stopPropagation(); handleDialoguePanelTap(event) }}>
          <div className={`speaker-name ${speakerNameSide === 'narrator' ? 'narrator' : `speaker-${speakerNameSide}`}`}>{dialogueSpeaker}</div>
          <section className="dialogue-panel"><p className="dialogue-text">{dialogueText}<span className={!dialogueComplete ? 'caret' : 'caret hidden'}>в–Ќ</span></p>
          {choiceTimerVisible && <div
            className="choice-timer"
            style={{ '--choice-timer-progress': `${choiceTimerProgress}%` } as CSSProperties}
            aria-label={`Осталось ${choiceTimerLeft} секунд`}
          >
            <span>{choiceTimerLeft}</span>
          </div>}
          {complete && scene.choices && !activeDialogue && <div className={`choices ${choiceTimerVisible ? 'timed' : ''}`}>{scene.choices.map((choice) => <button className={!canChoose(choice) ? 'locked' : ''} disabled={!canChoose(choice)} key={choice.label} onClick={() => choose(choice)}><span>{formatChoiceLabel(choice)}</span><i>{canChoose(choice) ? '→' : '×'}</i></button>)}</div>}
          {activeDialogue && pendingChoiceResolution && <button className="continue next-step" onClick={continuePendingChoice}>Дальше <span>↓</span></button>}
          {activeDialogue && pendingChoiceFailureNext !== null && <button className="continue next-step" onClick={() => { const nextScene = pendingChoiceFailureNext; setPendingChoiceFailureNext(null); advance(nextScene) }}>Дальше <span>↓</span></button>}
          {complete && scene.quiz && activeQuizQuestion && !pendingQuizAnswer && <div className="choices quiz-dialogue-choices">{activeQuizQuestion.answers.map((answer) => <button key={answer.label} onClick={() => answerQuiz(answer)}><span>{answer.label}</span><i>→</i></button>)}</div>}
          {complete && scene.quiz && pendingQuizAnswer && <button className="continue quiz-continue" onClick={continueQuiz}>Продолжить <span>→</span></button>}
          {complete && !scene.choices && !scene.quiz && !scene.cheatGame && !scene.roachGame && resolveNextScene(scene.next) !== undefined && <button className="continue next-step" onClick={() => advance(scene.next)}>Далее <span>↓</span></button>}
          {complete && !scene.choices && !scene.quiz && !scene.cheatGame && !scene.roachGame && resolveNextScene(scene.next) === undefined && <button className="continue finish" onClick={() => setMapOpen(true)}>Открыть карту <span>↗</span></button>}
          {!complete && <button className="skip" onClick={skipDialogueAnimation}>Показать текст</button>}
          </section>
        </div>}
        {complete && scene.cheatGame && activeCheatQuestion && <section className="control-work-window" aria-label="Контрольная работа"><div className="cheat-card"><div className="cheat-head"><div><p className="quiz-progress">{scene.cheatGame.title} · Лист {testQuestion + 1} из {scene.cheatGame.questions.length}</p><h2>{activeCheatQuestion.prompt}</h2></div><div className={`teacher-watch ${teacherPosition !== 'board' ? 'watching' : ''}`}><i />Географичка {teacherPositionLabel}</div></div><p className="cheat-description">{scene.cheatGame.description}</p><div className="warning-track"><span>Предупреждения</span><b>{testWarnings} / {scene.cheatGame.warningLimit}</b></div><div className="suspicion-meter"><span>Подозрение</span><div><b style={{ width: `${testSuspicion}%` }} /></div><strong>{testSuspicion}%</strong></div><div className="test-sheet">{activeCheatQuestion.answers.map((answer) => <button className={copiedAnswer === answer.label ? 'copied' : ''} key={answer.label} onClick={() => writeTestAnswer(answer)}>Записать: {answer.label}</button>)}</div><div className="cheat-actions"><button onClick={peekAtVeronica}>Подсмотреть у Вероники <small>риск {Math.round(cheatingRisk('peek') * 100)}%</small></button><button onClick={pretendToThink}>Сидеть ровно <small>-подозрение</small></button></div></div></section>}
        {complete && scene.roachGame && <CockroachHuntGame game={scene.roachGame} onFinish={finishRoachGame} />}
        {cinematicActive && <DoorReveal onComplete={completeCinematic} />}
      </div>
    </main>
  )
}


