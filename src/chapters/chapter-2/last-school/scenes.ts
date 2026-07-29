import type { Scene } from '../../../types/story'
import { compileQuest } from '../../../story/questDsl'
import { chapter2LastSchoolDefinition } from './chapter.generated'

/**
 * Runtime-ready scenes assembled from chapter.quest and its included parts.
 */
export const chapterTwoLastSchoolPartOneScenes: Scene[] = compileQuest(
  0,
  chapter2LastSchoolDefinition,
)
