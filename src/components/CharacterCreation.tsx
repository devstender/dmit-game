import { useMemo, useState } from 'react'
import { gameSounds, playSound } from '../audio/gameAudio'
import startBackground from '../assets/start.png'
import { abilityLabels, defaultAbilities, specialAbilityOrder } from '../data/player'
import type { Ability, AbilityScores } from '../types/story'

const minimumScore = 1
const maximumScore = 10
const totalPoints = 28

type CharacterCreationProps = {
  onComplete: (abilities: AbilityScores) => void
  onBack: () => void
}

export function CharacterCreation({ onComplete, onBack }: CharacterCreationProps) {
  const [abilities, setAbilities] = useState<AbilityScores>(defaultAbilities)
  const spentPoints = useMemo(() => Object.values(abilities).reduce((total, score) => total + score, 0), [abilities])
  const remainingPoints = totalPoints - spentPoints
  const canStart = remainingPoints === 0

  const changeAbility = (ability: Ability, amount: number) => {
    setAbilities((current) => {
      const next = current[ability] + amount
      if (next < minimumScore || next > maximumScore || (amount > 0 && remainingPoints <= 0)) return current
      return { ...current, [ability]: next }
    })
  }

  return (
    <main
      className="creation-screen"
      style={{ backgroundImage: `linear-gradient(90deg, rgba(18, 15, 32, .86) 0%, rgba(31, 20, 41, .62) 46%, rgba(38, 22, 44, .35) 100%), url(${startBackground})` }}
    >
      <div className="grain" />
      <section className="creation-card">
        <div className="creation-brief">
          <p className="eyebrow">S.P.E.C.I.A.L. · досье Дмитa</p>
          <h1>Собери <span>Дмита</span></h1>
          <p className="creation-lead">Распредели очки. Характеристики открывают реплики, проверки и будущие варианты прохождения.</p>
          <div className={`special-points ${canStart ? 'done' : ''}`}>
            <span>Свободные очки</span>
            <strong>{remainingPoints}</strong>
            <small>{canStart ? 'готов к району' : `нужно распределить ${remainingPoints}`}</small>
          </div>
        </div>

        <div className="special-terminal">
          <div className="special-terminal-head">
            <span>характеристики</span>
            <b>{spentPoints} / {totalPoints}</b>
          </div>
          <div className="special-list">
            {specialAbilityOrder.map((ability) => (
              <div className="special-row" key={ability}>
                <div className="special-title">
                  <b>{ability[0].toUpperCase()}</b>
                  <span>{abilityLabels[ability]}</span>
                </div>
                <div className="special-controls">
                  <button onClick={() => { playSound(gameSounds.uiToggle, .48); changeAbility(ability, -1) }} disabled={abilities[ability] <= minimumScore}>−</button>
                  <strong>{abilities[ability]}</strong>
                  <button onClick={() => { playSound(gameSounds.uiToggle, .48); changeAbility(ability, 1) }} disabled={abilities[ability] >= maximumScore || remainingPoints <= 0}>+</button>
                </div>
              </div>
            ))}
          </div>

          {remainingPoints > 0 && <p className="creation-warning">Распредели все свободные очки. Дмит не выходит в район недособранным.</p>}

          <div className="creation-actions">
            <button className="ghost-button" onClick={() => { playSound(gameSounds.uiClick); onBack() }}>Назад</button>
            <button className="primary-button" disabled={!canStart} onClick={() => { playSound(gameSounds.uiClick); onComplete(abilities) }}>
              Начать путь <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
