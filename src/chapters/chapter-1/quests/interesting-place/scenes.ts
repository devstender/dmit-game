import type { Scene } from '../../../../types/story'
import {
  boozeMinikaQuestScenes,
  boozeMinikaQuestStartScene,
} from '../booze-minika/scenes'

export const interestingPlaceQuestStartScene =
  boozeMinikaQuestStartScene + boozeMinikaQuestScenes.length

export const interestingPlaceQuestScenes: Scene[] = [
  {
    speaker: 'Дмит',
    text: 'О! Я нашёл 300 рублей. Нихуя себе, школа впервые что-то дала, а не забрала.',
    left: 'Дмит',
    background: 'school',
    next: interestingPlaceQuestStartScene + 1,
  },
  {
    speaker: 'Рассказчик',
    text: 'Дмит быстро убирает купюры в карман. Деньги выглядят так, будто тоже хотели уйти из школы раньше всех.',
    left: 'Дмит',
    background: 'school',
    sound: 'quest-complete',
    effects: {
      money: 300,
      experience: 3,
      flags: ['CHAPTER_1_FOUND_SCHOOL_ENTRANCE_MONEY'],
    },
  },
]
