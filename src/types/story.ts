export type Character =
  | "Дмит"
  | "Мишган"
  | "Кед"
  | "Данз"
  | "Полина"
  | "Географичка"
  | "Вероника"
  | "Охранник"
  | "Татьяна"
  | "Игорь"
  | "Папа"
  | "Матвей"
  | "Приятель Матвея"
  | "Учительница"
  | "Классная руководительница"
  | "Мама"
  | "Вадим"
  | "Копяр"
  | "Незнакомка"
  | "???"
  | "Пацан"
  | "Пацан Матвея"
  | "Женщина из окна"
  | "Женщина с балкона"
  | "Рассказчик";
export type Emotion =
  | "default"
  | "sad"
  | "angry"
  | "happy"
  | "surprised"
  | "thinking";
export type Ability =
  | "strength"
  | "perception"
  | "endurance"
  | "charisma"
  | "intelligence"
  | "agility"
  | "luck";
export type AbilityScores = Record<Ability, number>;
export type RelationCharacter =
  | "Вадим"
  | "Копяр"
  | "Мишган"
  | "Кед"
  | "Данз"
  | "Полина"
  | "Географичка"
  | "Вероника"
  | "Мама";
export type SceneSound =
  | "school-bell"
  | "mishgan-fall"
  | "dmit-run"
  | "guard-run"
  | "guard-shout"
  | "phone-vibrate"
  | "quest-complete"
  | "beer-open"
  | "matvey-music"
  | "skill-success"
  | "skill-fail"
  | "school-door-buzz"
  | "school-entry-creak"
  | "guard-alert"
  | "black-phone-vibration"
  | "igor-mystery-sting"
  | "bike-chain-rattle";
export type PhoneMessage = {
  contact: Character | string;
  direction: "incoming" | "outgoing";
  time?: string;
};

export type SceneEffect = {
  money?: number;
  experience?: number;
  reputation?: number;
  abilities?: Partial<AbilityScores>;
  relations?: Partial<Record<RelationCharacter, number>>;
  flags?: string[];
};

export type StoryChoice = {
  label: string;
  shortLabel?: string;
  say?: string;
  narration?: string;
  next: number;
  failNext?: number;
  requiresMoney?: number;
  requires?: Partial<AbilityScores>;
  requiresFlags?: string[];
  requiresAnyFlags?: string[];
  requiresPerks?: string[];
  requiresRelations?: Partial<Record<RelationCharacter, number>>;
  visibleWhen?: {
    allFlags?: string[];
    anyFlags?: string[];
    unlessFlags?: string[];
  };
  effects?: SceneEffect;
  failureEffects?: SceneEffect;
  failureText?: string;
};

export type ChoiceTimer = {
  durationSeconds: number;
  defaultChoiceIndex?: number;
  defaultNext?: number;
  effects?: SceneEffect;
};

export type QuizQuestion = {
  question: string;
  answers: { label: string; points: number; reaction?: string }[];
};

export type Quiz = {
  title: string;
  intro: string;
  questions: QuizQuestion[];
  results: {
    minimumScore: number;
    grade: 2 | 3 | 4 | 5;
    next: number;
    effects?: SceneEffect;
  }[];
};

export type CheatGameQuestion = {
  prompt: string;
  answers: { label: string; correct?: boolean }[];
  veronicaHint: string;
  veronicaRefusal?: string;
};

export type CheatGame = {
  title: string;
  description: string;
  warningLimit: number;
  minimumCorrect: number;
  questions: CheatGameQuestion[];
  successNext: number;
  failNext: number;
  successEffects?: SceneEffect;
  failEffects?: SceneEffect;
};

export type RoachGame = {
  title: string;
  description: string;
  durationSeconds: number;
  targetKills: number;
  maxEscaped: number;
  successNext: number;
  failNext: number;
  successEffects?: SceneEffect;
  failEffects?: SceneEffect;
};

export type Scene = {
  /** Stable stage identifier emitted by the Quest DSL compiler. */
  id?: string;
  speaker: Character;
  text: string;
  left?: Character;
  right?: Character;
  leftEmotion?: Emotion;
  rightEmotion?: Emotion;
  choices?: StoryChoice[];
  choiceTimer?: ChoiceTimer;
  quiz?: Quiz;
  cheatGame?: CheatGame;
  roachGame?: RoachGame;
  tone?: "default" | "danger";
  background?: "school" | "school-dark-vaz" | "classroom" | "home" | "dmit-room" | "minika" | "school-yard-night" | "school-main-entrance-night" | "school-backyard-night" | "school-corridor-night" | "school-corridor-morning" | "school-second-floor-night" | "computer-class-night" | "school-classroom-day" | "school-corridor-day" | "school-yard-day" | "dmit-home-hallway-day" | "dmit-bedroom-day";
  cinematic?: "door-reveal";
  sound?: SceneSound;
  music?: "matvey" | "chase" | "school-chase";
  transition?: "checkpoint-fade";
  /** Internal DSL marker: resolve this flag route without rendering a dialogue. */
  autoRoute?: boolean;
  phoneMessage?: PhoneMessage;
  effects?: SceneEffect;
  next?: number;
  nextByFlag?: { flag: string; next: number }[];
  conditionalNext?: {
    next: number;
    allFlags?: string[];
    anyFlags?: string[];
    unlessFlags?: string[];
    priority?: number;
  }[];
  fallbackNext?: number;
};

export type Chapter = {
  title: string;
  subtitle: string;
  schoolNumber: number;
  background: string;
  scenes: Scene[];
};
