import { useState } from 'react'
import { chapterOne } from './chapters/chapter-1'
import { chapterTwo } from './chapters/chapter-2'
import { CharacterCreation } from './components/CharacterCreation'
import { MainMenu } from './components/MainMenu'
import { StoryScreen } from './components/StoryScreen'
import { ChapterSelect } from './components/ChapterSelect'
import { createPlayerState, defaultAbilities, type PlayerState } from './data/player'
import { readSavedGame, writeSavedGame, type StoryChapterId } from './data/saveGame'
import type { AbilityScores } from './types/story'
import './App.css'

function App() {
  const chapterById = (chapterId: StoryChapterId) => chapterId === 'chapter-2' ? chapterTwo : chapterOne
  const [screen, setScreen] = useState<'menu' | 'creation' | 'chapters' | 'story'>('menu')
  const [player, setPlayer] = useState<PlayerState>(() => readSavedGame()?.player ?? createPlayerState(defaultAbilities))
  const [activeChapterId, setActiveChapterId] = useState<StoryChapterId>(() => readSavedGame()?.chapterId ?? 'chapter-1')
  const [initialSceneIndex, setInitialSceneIndex] = useState(() => readSavedGame()?.sceneIndex ?? 0)
  const [initialPlayedCinematics, setInitialPlayedCinematics] = useState<number[]>(() => readSavedGame()?.playedCinematics ?? [])
  const [hasSave, setHasSave] = useState(() => readSavedGame() !== null)

  if (screen === 'menu') {
    const openChapterSelect = () => {
      const save = readSavedGame()
      if (!save) return
      setPlayer(save.player)
      setActiveChapterId(save.chapterId)
      setInitialSceneIndex(Math.min(save.sceneIndex, chapterById(save.chapterId).scenes.length - 1))
      setInitialPlayedCinematics(save.playedCinematics)
      setScreen('chapters')
    }

    const openDebugChapters = () => {
      const save = readSavedGame()
      if (save) {
        setPlayer(save.player)
        setActiveChapterId(save.chapterId)
        setInitialSceneIndex(Math.min(save.sceneIndex, chapterById(save.chapterId).scenes.length - 1))
        setInitialPlayedCinematics(save.playedCinematics)
      }
      setScreen('chapters')
    }

    return <MainMenu hasSave={hasSave} debugAvailable={import.meta.env.DEV} onStart={() => setScreen('creation')} onContinue={openChapterSelect} onOpenChapters={openDebugChapters} />
  }

  if (screen === 'creation') {
    const startStory = (abilities: AbilityScores) => {
      const newPlayer = createPlayerState(abilities)
      setPlayer(newPlayer)
      setInitialSceneIndex(0)
      setInitialPlayedCinematics([])
      writeSavedGame({ chapterId: 'chapter-1', sceneIndex: 0, player: newPlayer, playedCinematics: [] })
      setActiveChapterId('chapter-1')
      setHasSave(true)
      setScreen('story')
    }
    return <CharacterCreation onComplete={startStory} onBack={() => setScreen('menu')} />
  }

  if (screen === 'chapters') {
    const replayChapter = () => {
      const replayPlayer = createPlayerState(player.abilities)
      setPlayer(replayPlayer)
      setInitialSceneIndex(0)
      setInitialPlayedCinematics([])
      writeSavedGame({ chapterId: 'chapter-1', sceneIndex: 0, player: replayPlayer, playedCinematics: [] })
      setActiveChapterId('chapter-1')
      setHasSave(true)
      setScreen('story')
    }

    const startChapter = (chapterId: StoryChapterId) => {
      const save = readSavedGame()
      const nextChapter = chapterById(chapterId)
      const resumesCurrentChapter = save?.chapterId === chapterId
      const nextSceneIndex = resumesCurrentChapter ? Math.min(save.sceneIndex, nextChapter.scenes.length - 1) : 0
      const nextCinematics = resumesCurrentChapter ? save.playedCinematics : []
      setActiveChapterId(chapterId)
      setInitialSceneIndex(nextSceneIndex)
      setInitialPlayedCinematics(nextCinematics)
      writeSavedGame({ chapterId, sceneIndex: nextSceneIndex, player, playedCinematics: nextCinematics })
      setHasSave(true)
      setScreen('story')
    }

    return <ChapterSelect chapter={chapterOne} chapterTwo={chapterTwo} player={player} sceneIndex={initialSceneIndex} activeChapterId={activeChapterId} debugAvailable={import.meta.env.DEV} onReplay={replayChapter} onStartChapter={startChapter} onBack={() => setScreen('menu')} />
  }

  const activeChapter = chapterById(activeChapterId)

  return <StoryScreen chapter={activeChapter} chapterId={activeChapterId} initialPlayer={player} initialSceneIndex={initialSceneIndex} initialPlayedCinematics={initialPlayedCinematics} onSave={() => setHasSave(true)} onExit={() => setScreen('menu')} onChapterComplete={() => {
    const save = readSavedGame()
    if (save) {
      setPlayer(save.player)
      setInitialSceneIndex(save.sceneIndex)
      setInitialPlayedCinematics(save.playedCinematics)
    }
    setScreen('chapters')
  }} />
}

export default App
