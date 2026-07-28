export type Character = 'Дмит' | 'Мишган' | 'Кед' | 'Данз' | 'Полина' | 'Географичка' | 'Вероника' | 'Охранник' | 'Татьяна' | 'Игорь' | 'Матвей' | 'Незнакомка' | 'Парень Матвея' | 'Второй парень Матвея' | 'Женщина с балкона' | 'Рассказчик'
export type Emotion = 'default' | 'sad' | 'angry' | 'happy' | 'surprised' | 'thinking'
export type Ability = 'strength' | 'perception' | 'endurance' | 'charisma' | 'intelligence' | 'agility' | 'luck'
export type AbilityScores = Record<Ability, number>
export type RelationCharacter = 'Мишган' | 'Кед' | 'Данз' | 'Полина' | 'Географичка' | 'Вероника'
export type SceneSound = 'school-bell' | 'mishgan-fall' | 'dmit-run' | 'guard-run' | 'guard-shout' | 'phone-vibrate' | 'quest-complete' | 'beer-open' | 'matvey-music' | 'skill-success' | 'skill-fail'
export type PhoneMessage = {
  contact: Character | string
  direction: 'incoming' | 'outgoing'
  time?: string
}

export type SceneEffect = {
  money?: number
  experience?: number
  reputation?: number
  abilities?: Partial<AbilityScores>
  relations?: Partial<Record<RelationCharacter, number>>
  flags?: string[]
}

export type StoryChoice = {
  label: string
  shortLabel?: string
  say?: string
  next: number
  failNext?: number
  requiresMoney?: number
  requires?: Partial<AbilityScores>
  requiresPerks?: string[]
  requiresRelations?: Partial<Record<RelationCharacter, number>>
  effects?: SceneEffect
  failureEffects?: SceneEffect
  failureText?: string
}

export type ChoiceTimer = {
  durationSeconds: number
  defaultChoiceIndex?: number
  defaultNext?: number
  effects?: SceneEffect
}

export type QuizQuestion = {
  question: string
  answers: { label: string; points: number; reaction?: string }[]
}

export type Quiz = {
  title: string
  intro: string
  questions: QuizQuestion[]
  results: { minimumScore: number; grade: 2 | 3 | 4 | 5; next: number; effects?: SceneEffect }[]
}

export type CheatGameQuestion = {
  prompt: string
  answers: { label: string; correct?: boolean }[]
  veronicaHint: string
  veronicaRefusal?: string
}

export type CheatGame = {
  title: string
  description: string
  warningLimit: number
  minimumCorrect: number
  questions: CheatGameQuestion[]
  successNext: number
  failNext: number
  successEffects?: SceneEffect
  failEffects?: SceneEffect
}

export type RoachGame = {
  title: string
  description: string
  durationSeconds: number
  targetKills: number
  maxEscaped: number
  successNext: number
  failNext: number
  successEffects?: SceneEffect
  failEffects?: SceneEffect
}

export type Scene = {
  speaker: Character
  text: string
  left?: Character
  right?: Character
  leftEmotion?: Emotion
  rightEmotion?: Emotion
  choices?: StoryChoice[]
  choiceTimer?: ChoiceTimer
  quiz?: Quiz
  cheatGame?: CheatGame
  roachGame?: RoachGame
  tone?: 'default' | 'danger'
  background?: 'school' | 'classroom' | 'home' | 'dmit-room' | 'minika'
  cinematic?: 'door-reveal'
  sound?: SceneSound
  phoneMessage?: PhoneMessage
  effects?: SceneEffect
  next?: number
  nextByFlag?: { flag: string; next: number }[]
  fallbackNext?: number
}

export type Chapter = {
  title: string
  subtitle: string
  schoolNumber: number
  background: string
  scenes: Scene[]
}
