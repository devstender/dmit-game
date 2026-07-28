import type { Scene } from '../../types/story'
import { geographyQuestScenes } from './quests/geography/scenes'
import { meetMishganQuestScenes } from './quests/meet-mishgan/scenes'
import { returnHomeQuestScenes } from './quests/return-home/scenes'
import { boozeMinikaQuestScenes } from './quests/booze-minika/scenes'
import { interestingPlaceQuestScenes } from './quests/interesting-place/scenes'
import { smallSchoolQuestScenes } from './quests/small-school/scenes'

export const chapterOneScenes: Scene[] = [
  ...geographyQuestScenes,
  ...meetMishganQuestScenes,
  ...returnHomeQuestScenes,
  ...boozeMinikaQuestScenes,
  ...interestingPlaceQuestScenes,
  ...smallSchoolQuestScenes,
]
