import type { PlayerState } from './player'

export const SAVE_GAME_KEY = 'dmit-save-v1'
export type StoryChapterId = 'chapter-1' | 'chapter-2'

export type SavedGame = {
  version: 1
  chapterId: StoryChapterId
  sceneIndex: number
  player: PlayerState
  playedCinematics: number[]
  updatedAt: string
}

export function readSavedGame(): SavedGame | null {
  try {
    const rawSave = window.localStorage.getItem(SAVE_GAME_KEY)
    if (!rawSave) return null
    const save = JSON.parse(rawSave) as Partial<SavedGame>
    if (save.version !== 1 || typeof save.sceneIndex !== 'number' || !save.player) return null
    const player = save.player
    return {
      version: 1,
      chapterId: save.chapterId === 'chapter-2' ? 'chapter-2' : 'chapter-1',
      sceneIndex: save.sceneIndex,
      player: {
        ...player,
        suspicion: typeof player.suspicion === 'number' ? player.suspicion : 0,
        traits: {
          courage: 0, composure: 0, responsibility: 0, camaraderie: 0, cunning: 0, empathy: 0,
          ...(player.traits as Partial<PlayerState['traits']> | undefined),
        },
        // В старых сохранениях уровни выдачи SPECIAL не сохранялись:
        // такие очки уже тратились через сайдбар и не должны открыть старые окна.
        claimedSpecialLevels: Array.isArray(player.claimedSpecialLevels)
          ? player.claimedSpecialLevels
          : Array.from(
            { length: Math.floor((player.experience ?? 0) / 40) + 1 },
            (_, index) => index + 1,
          ).filter((level) => level > 1),
      },
      playedCinematics: Array.isArray(save.playedCinematics) ? save.playedCinematics : [],
      updatedAt: save.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function writeSavedGame(save: Pick<SavedGame, 'sceneIndex' | 'player' | 'playedCinematics'> & { chapterId?: StoryChapterId }) {
  const nextSave: SavedGame = {
    version: 1,
    chapterId: save.chapterId ?? 'chapter-1',
    ...save,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(nextSave))
}
