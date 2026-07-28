import type { Scene } from '../../types/story'
import { geographyQuestScenes } from './quests/geography/scenes'
import { meetMishganQuestScenes } from './quests/meet-mishgan/scenes'
import { returnHomeQuestScenes } from './quests/return-home/scenes'
import { boozeMinikaQuestScenes } from './quests/booze-minika/scenes'

export const chapterOneScenes: Scene[] = [
  ...geographyQuestScenes,
  ...meetMishganQuestScenes,
  ...returnHomeQuestScenes,
  ...boozeMinikaQuestScenes,
]
