import { abilityLabels, specialAbilityOrder } from '../data/player'
import type { Ability, AbilityScores } from '../types/story'

type SpecialLevelUpProps = {
  level: number
  abilities: AbilityScores
  onSelect: (ability: Ability) => void
}

export function SpecialLevelUp({ level, abilities, onSelect }: SpecialLevelUpProps) {
  return (
    <div className="perk-overlay special-level-overlay" role="dialog" aria-modal="true" aria-label="Улучшение характеристики">
      <section className="perk-dialog special-level-dialog">
        <p className="eyebrow">новый уровень · {level}</p>
        <h2>Улучши <em>SPECIAL</em></h2>
        <p>Выбери одну характеристику. Это очко нельзя перенести или отменить.</p>
        <div className="special-level-list">
          {specialAbilityOrder.map((ability) => {
            const score = abilities[ability]
            return (
              <button key={ability} disabled={score >= 10} onClick={() => onSelect(ability)}>
                <strong>{abilityLabels[ability]}</strong>
                <span>{score} <i>→</i> {Math.min(10, score + 1)}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
