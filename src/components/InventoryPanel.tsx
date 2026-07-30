import type { PlayerState } from '../data/player'
import { Backpack, Beer, Camera, CircleDot, Cigarette, FileText, FlaskConical, KeyRound, Package, PenLine, Smartphone, WandSparkles, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type InventoryPanelProps = {
  player: PlayerState
  open: boolean
  onClose: () => void
}

const itemIcons: Record<string, LucideIcon> = {
  keys: KeyRound,
  phone: Smartphone,
  backpack: Backpack,
  pen: PenLine,
  'torn-note': FileText,
  'beer-bottle': Beer,
  'vodka-bottle': FlaskConical,
  'alcohol-bottle': FlaskConical,
  cigarettes: Cigarette,
  snus: CircleDot,
  snuff: WandSparkles,
  multitool: Wrench,
  camera: Camera,
}

export function InventoryPanel({ player, open, onClose }: InventoryPanelProps) {
  return (
    <aside className={`inventory-panel ${open ? 'open' : ''}`} aria-label="Инвентарь">
      <div className="inventory-heading"><div><span>Дмит</span><h2>Инвентарь</h2></div><button className="panel-close" onClick={onClose} aria-label="Закрыть инвентарь">×</button></div>
      <p className="inventory-help">Наведите курсор на предмет, чтобы рассмотреть его.</p>
      <div className="wallet"><span>Карманные деньги</span><strong>{player.money} ₽</strong><small>На сегодня должно хватить.</small></div>
      <ul className="inventory-grid">
        {player.inventory.map((item) => (
          (() => {
            const ItemIcon = itemIcons[item.id] ?? Package
            return <li key={item.id} tabIndex={0}>
              <i aria-hidden="true"><ItemIcon strokeWidth={2} /></i><strong>{item.name}</strong><span className="inventory-tooltip">{item.description}</span>
            </li>
          })()
        ))}
      </ul>
    </aside>
  )
}
