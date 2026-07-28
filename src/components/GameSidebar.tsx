import { abilityLabels, experienceForLevel, relationLabels, type PlayerState } from '../data/player'
import type { Ability, RelationCharacter } from '../types/story'

type GameSidebarProps = { player: PlayerState }

type PanelProps = GameSidebarProps & {
  open: boolean
  onClose: () => void
  onUpgradeAbility: (ability: Ability) => void
  visibleRelations: RelationCharacter[]
}

export function GameSidebar({ player, open, onClose, onUpgradeAbility, visibleRelations }: PanelProps) {
  const level = experienceForLevel(player.experience)
  const experienceStep = 40
  const currentLevelExperience = player.experience % experienceStep
  const experienceProgress = Math.min(100, (currentLevelExperience / experienceStep) * 100)
  const visibleRelationRows = visibleRelations.map((character) => [character, player.relations[character]] as const)

  return (
    <aside className={`game-sidebar ${open ? 'open' : ''}`} aria-label="Характеристики">
      <button className="panel-close" onClick={onClose} aria-label="Закрыть характеристики">×</button>
      <div className="player-card">
        <span>Дмит</span>
        <strong>Уровень {level}</strong>
        <div className="experience-meter" aria-label={`Опыт ${currentLevelExperience} из ${experienceStep}`}>
          <div><b style={{ width: `${experienceProgress}%` }} /></div>
          <small>{currentLevelExperience} / {experienceStep} опыта</small>
        </div>
      </div>
      <section className="sidebar-section">
        <h2>Способности {player.specialPoints > 0 && <b className="special-badge">+{player.specialPoints}</b>}</h2>
        {Object.entries(player.abilities).map(([ability, score]) => (
          <div className="ability-row" key={ability}>
            <span>{abilityLabels[ability as Ability]}</span>
            <div><b>{score}</b>{player.specialPoints > 0 && score < 10 && <button className="ability-upgrade" onClick={() => onUpgradeAbility(ability as Ability)} aria-label={`Улучшить ${abilityLabels[ability as Ability]}`}>+</button>}</div>
          </div>
        ))}
      </section>
      <section className="sidebar-section relations-section">
        <h2>Отношения</h2>
        {visibleRelationRows.length > 0 ? visibleRelationRows.map(([character, score]) => <div className="relation-row" key={character}><span>{relationLabels[character]}</span><b className={score > 0 ? 'positive' : score < 0 ? 'negative' : ''}>{score > 0 ? `+${score}` : score}</b></div>) : <p className="relation-empty">Дмит пока ни с кем толком не пересёкся.</p>}
      </section>
      {player.perks.length > 0 && <section className="sidebar-section"><h2>Перки</h2><p className="perk-count">Выбрано: {player.perks.length}</p></section>}
      <p className="sidebar-note">Решения меняют путь Дмитa.</p>
    </aside>
  )
}
