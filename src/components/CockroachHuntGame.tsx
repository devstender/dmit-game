import { useEffect, useRef, useState } from 'react'
import { gameSounds, playLoop } from '../audio/gameAudio'
import type { RoachGame } from '../types/story'

type CockroachHuntGameProps = {
  game: RoachGame
  onFinish: (success: boolean) => void
}

type Roach = {
  id: number
  x: number
  y: number
  size: number
  bornAt: number
  lifespan: number
  rotation: number
}

export function CockroachHuntGame({ game, onFinish }: CockroachHuntGameProps) {
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(game.durationSeconds)
  const [kills, setKills] = useState(0)
  const [escaped, setEscaped] = useState(0)
  const [roaches, setRoaches] = useState<Roach[]>([])
  const [combo, setCombo] = useState(0)
  const finished = useRef(false)
  const nextRoachId = useRef(1)
  const roachAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!started || finished.current) return
    roachAudio.current?.pause()
    roachAudio.current = playLoop(gameSounds.roachMusic, .42)
    return () => {
      roachAudio.current?.pause()
      roachAudio.current = null
    }
  }, [started])

  useEffect(() => {
    if (!started || finished.current) return

    const clock = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1))
    }, 1000)

    const spawn = window.setInterval(() => {
      setRoaches((current) => {
        if (current.length >= 5) return current
        const pressure = 1 - timeLeft / game.durationSeconds
        const lifespan = Math.max(720, 1320 - pressure * 420 - Math.random() * 220)
        const roach: Roach = {
          id: nextRoachId.current,
          x: 7 + Math.random() * 82,
          y: 34 + Math.random() * 46,
          size: 22 + Math.random() * 13,
          bornAt: Date.now(),
          lifespan,
          rotation: -35 + Math.random() * 70,
        }
        nextRoachId.current += 1
        return [...current, roach]
      })
    }, Math.max(360, 560 - combo * 12))

    const sweep = window.setInterval(() => {
      const now = Date.now()
      setRoaches((current) => {
        const alive = current.filter((roach) => now - roach.bornAt < roach.lifespan)
        const lost = current.length - alive.length
        if (lost > 0) {
          setEscaped((value) => value + lost)
          setCombo(0)
        }
        return alive
      })
    }, 120)

    return () => {
      window.clearInterval(clock)
      window.clearInterval(spawn)
      window.clearInterval(sweep)
    }
  }, [combo, game.durationSeconds, started, timeLeft])

  useEffect(() => {
    if (!started || finished.current) return
    if (kills >= game.targetKills) {
      finished.current = true
      window.setTimeout(() => onFinish(escaped <= game.maxEscaped), 450)
    }
  }, [escaped, game.maxEscaped, game.targetKills, kills, onFinish, started])

  useEffect(() => {
    if (!started || finished.current) return
    if (escaped > game.maxEscaped || timeLeft <= 0) {
      finished.current = true
      window.setTimeout(() => onFinish(kills >= game.targetKills && escaped <= game.maxEscaped), 450)
    }
  }, [escaped, game.maxEscaped, game.targetKills, kills, onFinish, started, timeLeft])

  const start = () => {
    setStarted(true)
    setTimeLeft(game.durationSeconds)
    setKills(0)
    setEscaped(0)
    setCombo(0)
    setRoaches([])
    finished.current = false
  }

  const hitRoach = (roachId: number) => {
    setRoaches((current) => current.filter((roach) => roach.id !== roachId))
    setKills((current) => current + 1)
    setCombo((current) => current + 1)
  }

  const miss = () => {
    if (!started || finished.current) return
    setEscaped((current) => current + 1)
    setCombo(0)
  }

  return (
    <section className="roach-game" aria-label={game.title}>
      <div className="roach-game-card">
        <div className="roach-game-head">
          <div>
            <p className="quiz-progress">Мини-игра</p>
            <h2>{game.title}</h2>
          </div>
          <div className="roach-stats">
            <span>⏱ {timeLeft}с</span>
            <span>✓ {kills}/{game.targetKills}</span>
            <span className={escaped > game.maxEscaped ? 'danger' : ''}>убежали {escaped}/{game.maxEscaped}</span>
          </div>
        </div>
        <p className="roach-description">{game.description}</p>
        {!started ? (
          <button className="roach-start" onClick={start}>Начать зачистку</button>
        ) : (
          <div className="roach-arena" onClick={miss}>
            <div className="sofa">
              <span>диван</span>
            </div>
            <div className="under-sofa-shadow" />
            {roaches.map((roach) => (
              <button
                className="roach"
                key={roach.id}
                onClick={(event) => {
                  event.stopPropagation()
                  hitRoach(roach.id)
                }}
                style={{
                  left: `${roach.x}%`,
                  top: `${roach.y}%`,
                  width: `${roach.size}px`,
                  height: `${roach.size * .58}px`,
                  transform: `rotate(${roach.rotation}deg)`,
                }}
                aria-label="Ударить таракана"
              >
                <i />
              </button>
            ))}
            <div className="slipper">тапок</div>
          </div>
        )}
        <div className="roach-rules">
          <span>Цель: убить {game.targetKills}</span>
          <span>Промах по полу считается побегом</span>
          <span>Тараканы ускоряются под конец</span>
        </div>
      </div>
    </section>
  )
}
