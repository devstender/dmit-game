import type { PlayerState } from './player'

export const SAVE_GAME_KEY = 'dmit-save-v1'

export type SavedGame = {
  version: 1
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
    return {
      version: 1,
      sceneIndex: save.sceneIndex,
      player: save.player,
      playedCinematics: Array.isArray(save.playedCinematics) ? save.playedCinematics : [],
      updatedAt: save.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function writeSavedGame(save: Pick<SavedGame, 'sceneIndex' | 'player' | 'playedCinematics'>) {
  const nextSave: SavedGame = {
    version: 1,
    ...save,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(nextSave))
}
