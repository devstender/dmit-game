import { perks } from '../data/player'

type PerkSelectionProps = {
  level: number
  selectedPerks: string[]
  onSelect: (perkId: string) => void
}

export function PerkSelection({ level, selectedPerks, onSelect }: PerkSelectionProps) {
  return (
    <div className="perk-overlay" role="dialog" aria-modal="true" aria-label="Выбор перка">
      <section className="perk-dialog">
        <p className="eyebrow">новый уровень · {level}</p>
        <h2>Выбери <em>перк</em></h2>
        <p>Это решение нельзя отменить. Перки меняют возможности Дмитa, а не просто цифры.</p>
        <div className="perk-list">
          {perks.map((perk) => (
            <button key={perk.id} disabled={selectedPerks.includes(perk.id)} onClick={() => onSelect(perk.id)}>
              <strong>{perk.name}</strong><span>{selectedPerks.includes(perk.id) ? 'Уже выбран' : perk.description}</span><i>→</i>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
