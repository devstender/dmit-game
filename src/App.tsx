import { useState } from 'react'
import { chapterOne } from './chapters/chapter-1'
import { CharacterCreation } from './components/CharacterCreation'
import { MainMenu } from './components/MainMenu'
import { StoryScreen } from './components/StoryScreen'
import { createPlayerState, defaultAbilities, type PlayerState } from './data/player'
import { readSavedGame, writeSavedGame } from './data/saveGame'
import type { AbilityScores } from './types/story'
import './App.css'

function App() {
  const [screen, setScreen] = useState<'menu' | 'creation' | 'story'>('menu')
  const [player, setPlayer] = useState<PlayerState>(() => readSavedGame()?.player ?? createPlayerState(defaultAbilities))
  const [initialSceneIndex, setInitialSceneIndex] = useState(() => readSavedGame()?.sceneIndex ?? 0)
  const [initialPlayedCinematics, setInitialPlayedCinematics] = useState<number[]>(() => readSavedGame()?.playedCinematics ?? [])
  const [hasSave, setHasSave] = useState(() => readSavedGame() !== null)

  if (screen === 'menu') {
    const continueStory = () => {
      const save = readSavedGame()
      if (!save) return
      setPlayer(save.player)
      setInitialSceneIndex(Math.min(save.sceneIndex, chapterOne.scenes.length - 1))
      setInitialPlayedCinematics(save.playedCinematics)
      setScreen('story')
    }

    return <MainMenu hasSave={hasSave} onStart={() => setScreen('creation')} onContinue={continueStory} />
  }

  if (screen === 'creation') {
    const startStory = (abilities: AbilityScores) => {
      const newPlayer = createPlayerState(abilities)
      setPlayer(newPlayer)
      setInitialSceneIndex(0)
      setInitialPlayedCinematics([])
      writeSavedGame({ sceneIndex: 0, player: newPlayer, playedCinematics: [] })
      setHasSave(true)
      setScreen('story')
    }
    return <CharacterCreation onComplete={startStory} onBack={() => setScreen('menu')} />
  }

  return <StoryScreen chapter={chapterOne} initialPlayer={player} initialSceneIndex={initialSceneIndex} initialPlayedCinematics={initialPlayedCinematics} onSave={() => setHasSave(true)} onExit={() => setScreen('menu')} />
}

export default App
