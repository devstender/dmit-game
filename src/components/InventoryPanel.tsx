import type { PlayerState } from '../data/player'

type InventoryPanelProps = {
  player: PlayerState
  open: boolean
  onClose: () => void
}

export function InventoryPanel({ player, open, onClose }: InventoryPanelProps) {
  return (
    <aside className={`inventory-panel ${open ? 'open' : ''}`} aria-label="Инвентарь">
      <div className="inventory-heading"><div><span>Дмит</span><h2>Инвентарь</h2></div><button className="panel-close" onClick={onClose} aria-label="Закрыть инвентарь">×</button></div>
      <p className="inventory-help">Наведите курсор на предмет, чтобы рассмотреть его.</p>
      <div className="wallet"><span>Карманные деньги</span><strong>{player.money} ₽</strong><small>На сегодня должно хватить.</small></div>
      <ul className="inventory-grid">
        {player.inventory.map((item) => (
          <li key={item.id} tabIndex={0}>
            <i>{item.icon}</i><strong>{item.name}</strong><span className="inventory-tooltip">{item.description}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
