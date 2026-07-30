import type { Scene } from '../../../../types/story'
import { compileQuest } from '../../../../story/questDsl'
import { interestingPlaceQuestScenes, interestingPlaceQuestStartScene } from '../interesting-place/scenes'
import { smallSchoolDefinition } from './chapter.generated'

export const smallSchoolQuestStartScene = interestingPlaceQuestStartScene + interestingPlaceQuestScenes.length
export const smallSchoolQuestDefinition = smallSchoolDefinition
export const smallSchoolQuestScenes: Scene[] = compileQuest(smallSchoolQuestStartScene, smallSchoolQuestDefinition)
