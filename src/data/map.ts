import { returnHomeQuestStartScene } from '../chapters/chapter-1/quests/return-home/scenes'
import { boozeMinikaQuestStartScene } from '../chapters/chapter-1/quests/booze-minika/scenes'

export type QuestStatus = 'locked' | 'active' | 'completed'
export type QuestDebugSetupOption = {
  id: string
  label: string
  description?: string
  flags: string[]
}
export type QuestDebugSetupGroup = {
  id: string
  title: string
  description?: string
  options: QuestDebugSetupOption[]
}
export type Quest = {
  id: string
  title: string
  description: string
  type: 'main' | 'side'
  status: QuestStatus
  locationId: string
  startSceneIndex?: number
  availableAfterSceneIndex?: number
  availableByFlags?: string[]
  completedAfterSceneIndex?: number
  completedByFlags?: string[]
  debugSetup?: QuestDebugSetupGroup[]
}

export type MapLocation = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  description: string
  opens?: 'school'
  questType?: 'main' | 'side'
}

export const mapLocations: MapLocation[] = [
  { id: 'school', name: 'Школа № 76', x: 45.6, y: 22.4, width: 21.4, height: 22.1, description: 'Главный корпус. Здесь географичка держит район в страхе сильнее турникетов.', opens: 'school', questType: 'main' },
  { id: 'school-entrance', name: 'Вход в школу', x: 54.4, y: 44.2, width: 7.2, height: 4.8, description: 'Главные ступеньки школы. Место, где разговоры после уроков звучат почти как планы на жизнь.', questType: 'main' },
  { id: 'sports-ground', name: 'Стадион', x: 69.9, y: 4.5, width: 21, height: 53.4, description: 'Футбольное поле, беговая дорожка и место, где физрук появляется без предупреждения.', questType: 'side' },
  { id: 'courtyard', name: 'Двор у школы', x: 44.8, y: 10.1, width: 7.2, height: 6.2, description: 'Место коротких советов, длинных планов и подозрительно важных перемен.', questType: 'main' },
  { id: 'home', name: 'Дом Дмитa', x: 18.9, y: 60, width: 22, height: 31.3, description: 'Домовая территория. Пока не вершина Арбеково, но уже что-то своё.', questType: 'main' },
  { id: 'minika', name: 'Минька', x: 70.2, y: 72.4, width: 10.8, height: 8.8, description: 'Локальная точка вечерних сборов. Лавка, темнота, пакет и ощущение, что район сейчас начнёт принимать решения.', questType: 'main' },
]

export const schoolLocations: MapLocation[] = [
  { id: 'geography-classroom', name: 'Кабинет географии', x: 12, y: 18, width: 34, height: 26, description: 'Кабинет на третьем этаже. Карты мира висят так, будто тоже боятся отвечать.', questType: 'main' },
  { id: 'third-floor-hall', name: 'Коридор 3 этажа', x: 54, y: 16, width: 34, height: 26, description: 'Узкий коридор перед кабинетом. Идеальное место для плохих новостей от Кеда.', questType: 'side' },
  { id: 'gym', name: 'Спортзал', x: 26, y: 58, width: 46, height: 25, description: 'Тут можно найти сына географички, потерянный телефон и пару новых проблем.', questType: 'side' },
]

export const quests: Quest[] = [
  { id: 'geography', title: 'Урок географии', description: 'Пережить опрос, контрольную и диктатуру кабинета географии.', type: 'main', status: 'active', locationId: 'school', startSceneIndex: 0, completedAfterSceneIndex: 55 },
  {
    id: 'meet-mishgan',
    title: 'Встреча с Мишганом',
    description: 'После урока найти Мишгана у входа в школу и решить, своих бросают или нет.',
    type: 'main',
    status: 'active',
    locationId: 'school-entrance',
    startSceneIndex: 56,
    availableAfterSceneIndex: 55,
    completedAfterSceneIndex: 183,
    completedByFlags: ['CHAPTER_1_HELPED_MISHGAN', 'CHAPTER_1_LEFT_MISHGAN'],
    debugSetup: [
      {
        id: 'geography-grade',
        title: 'Итог географии',
        description: 'От этого зависит первая реплика Мишгана после урока.',
        options: [
          { id: 'grade-3', label: 'Оценка 3', flags: ['geography-grade-3'] },
          { id: 'grade-2', label: 'Оценка 2', flags: ['geography-grade-2'] },
          { id: 'caught', label: 'Поймали на контрольной', flags: ['control-work-caught', 'geography-grade-2'] },
          { id: 'grade-4', label: 'Оценка 4', flags: ['geography-grade-4'] },
          { id: 'grade-5', label: 'Оценка 5', flags: ['geography-grade-5'] },
        ],
      },
    ],
  },
  {
    id: 'return-home',
    title: 'Возвращение домой',
    description: 'Вернуться в квартиру Дмитa, пережить родителей, тараканов и выбор вечера.',
    type: 'main',
    status: 'active',
    locationId: 'home',
    startSceneIndex: returnHomeQuestStartScene,
    availableAfterSceneIndex: 183,
    availableByFlags: ['CHAPTER_1_HELPED_MISHGAN', 'CHAPTER_1_LEFT_MISHGAN'],
    completedByFlags: ['CHAPTER_1_RETURNED_HOME'],
    debugSetup: [
      {
        id: 'mishgan-result',
        title: 'Что Дмит сделал с Мишганом?',
        description: 'Этот выбор ставит ключевой флаг ветки после географии.',
        options: [
          { id: 'helped', label: 'Помог Мишгану', description: 'Дмит не бросил своего и попал в более плотную школьную мясорубку.', flags: ['CHAPTER_1_HELPED_MISHGAN'] },
          { id: 'left', label: 'Сбежал без Мишгана', description: 'Дмит спас ноги, но оставил вопрос дружбы висеть у входа в школу.', flags: ['CHAPTER_1_LEFT_MISHGAN'] },
        ],
      },
      {
        id: 'geography-grade',
        title: 'Итог географии',
        description: 'Нужен для разговора с родителями об оценках.',
        options: [
          { id: 'grade-3', label: 'Оценка 3', flags: ['geography-grade-3'] },
          { id: 'grade-2', label: 'Оценка 2', flags: ['geography-grade-2'] },
          { id: 'caught', label: 'Поймали на контрольной', flags: ['control-work-caught', 'geography-grade-2'] },
          { id: 'grade-4', label: 'Оценка 4', flags: ['geography-grade-4'] },
          { id: 'grade-5', label: 'Оценка 5', flags: ['geography-grade-5'] },
        ],
      },
    ],
  },
  {
    id: 'booze-minika',
    title: 'Бухич на миньке',
    description: 'Встретиться с пацанами на Миньке и начать вечер перед лагерем.',
    type: 'main',
    status: 'active',
    locationId: 'minika',
    startSceneIndex: boozeMinikaQuestStartScene,
    availableByFlags: ['CHAPTER_1_RETURNED_HOME'],
    completedByFlags: ['CHAPTER_1_MINIKA_BOOZE_DONE'],
    debugSetup: [
      {
        id: 'mishgan-result',
        title: 'Что было с Мишганом после школы?',
        options: [
          { id: 'helped', label: 'Дмит помог Мишгану', flags: ['CHAPTER_1_HELPED_MISHGAN'] },
          { id: 'left', label: 'Дмит бросил Мишгана', flags: ['CHAPTER_1_LEFT_MISHGAN'] },
        ],
      },
      {
        id: 'home-result',
        title: 'Как прошёл домашний квест?',
        options: [
          { id: 'returned', label: 'Квест завершён обычно', flags: ['CHAPTER_1_RETURNED_HOME'] },
          { id: 'cleaned', label: 'Тараканы побеждены', description: 'Дмит получил награду за комнату.', flags: ['CHAPTER_1_RETURNED_HOME', 'CHAPTER_1_ROOM_CLEANED', 'CHAPTER_1_ROACH_REWARD'] },
          { id: 'roaches', label: 'Тараканы выжили', flags: ['CHAPTER_1_RETURNED_HOME', 'CHAPTER_1_ROACHES_SURVIVED'] },
        ],
      },
      {
        id: 'alcohol',
        title: 'Что купили на вечер?',
        description: 'Влияет на стартовое состояние Дмитa на Миньке.',
        options: [
          { id: 'beer', label: 'Только пиво', flags: ['CHAPTER_1_ALCOHOL_BEER'] },
          { id: 'heavy', label: 'Водка и пиво', flags: ['CHAPTER_1_ALCOHOL_HEAVY'] },
          { id: 'sober', label: 'Не пить', flags: ['CHAPTER_1_ALCOHOL_SOBER'] },
        ],
      },
    ],
  },
]
