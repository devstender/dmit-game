import { useEffect } from 'react'
import { gameSounds, playSound } from '../audio/gameAudio'
import geographyTeacherImage from '../assets/географичка/main.png'

type DoorRevealProps = { onComplete: () => void }

export function DoorReveal({ onComplete }: DoorRevealProps) {
  useEffect(() => {
    playSound(gameSounds.classDoor, .78)
    const revealSound = window.setTimeout(() => playSound(gameSounds.teacherReveal, .84), 1350)
    const timer = window.setTimeout(onComplete, 6900)
    return () => {
      window.clearTimeout(revealSound)
      window.clearTimeout(timer)
    }
  }, [onComplete])

  return (
    <div className="door-reveal" aria-label="Кат-сцена: вход в кабинет">
      <div className="door-panel door-left" /><div className="door-panel door-right" />
      <div className="door-light" />
      <div className="teacher-reveal"><img src={geographyTeacherImage} alt="Географичка" /><span>ГЕОГРАФИЧКА</span></div>
    </div>
  )
}
