import type { Ability, AbilityScores, PersonalityTrait, PersonalityTraits, RelationCharacter } from '../types/story'
export { availableConsumableItems, type AvailableConsumableItem, type DialogueItemEffect } from './items'

export type InventoryItem = {
  id: string
  name: string
  icon: string
  description: string
}

export const inventoryItemCatalog: Record<string, InventoryItem> = {
  keys: { id: 'keys', name: 'Ключи от квартиры', icon: '⌁', description: 'Ключи от квартиры Дмитa. На одном брелоке написано: «Не потеряй».' },
  phone: { id: 'phone', name: 'Телефон', icon: '▣', description: 'Телефон с треснувшим экраном. Заряд — 18%, уверенность — 100%.' },
  backpack: { id: 'backpack', name: 'Рюкзак', icon: '▱', description: 'Рюкзак, в котором есть всё необходимое и два старых фантика.' },
  pen: { id: 'pen', name: 'Ручка', icon: '✎', description: 'Синяя ручка. Иногда пишет, когда ей действительно важно.' },
  'torn-note': { id: 'torn-note', name: 'Рваный лист бумаги', icon: '▤', description: 'Лист с обрывком неизвестной записи. Может пригодиться позже.' },
  'alcohol-bottle': { id: 'alcohol-bottle', name: 'Бутылка алкоголя', icon: '▥', description: 'Запас на крайний случай. Лучше, чтобы мама не узнала о существовании этого крайнего случая.' },
  multitool: { id: 'multitool', name: 'Старый мультитул', icon: '⌘', description: 'Складной мультитул с ножом, отвёрткой и пассатижами. Может открыть, починить или усложнить ситуацию.' },
  camera: { id: 'camera', name: 'Компактный фотоаппарат', icon: '◉', description: 'Старый, но рабочий фотоаппарат. Незаметнее телефона и не связан с чёрным устройством.' },
}

export type PlayerState = {
  money: number
  experience: number
  reputation: number
  suspicion: number
  abilities: AbilityScores
  traits: PersonalityTraits
  relations: Record<RelationCharacter, number>
  inventory: InventoryItem[]
  flags: string[]
  perks: string[]
  specialPoints: number
  claimedPerkLevels: number[]
  rewardedSpecialLevels: number[]
  claimedSpecialLevels: number[]
}

export type Perk = {
  id: string
  name: string
  description: string
}

export const abilityLabels: Record<Ability, string> = {
  strength: 'Сила',
  perception: 'Внимательность',
  endurance: 'Выносливость',
  charisma: 'Харизма',
  intelligence: 'Интеллект',
  agility: 'Ловкость',
  luck: 'Удача',
}

export const specialAbilityOrder: Ability[] = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck']
export const traitLabels: Record<PersonalityTrait, string> = {
  courage: 'Характер', composure: 'Самообладание', responsibility: 'Ответственность',
  camaraderie: 'Товарищество', cunning: 'Хитрость', empathy: 'Эмпатия',
}
export const traitLevelLabel = (value: number) => value >= 6 ? 'сформированная черта' : value >= 2 ? 'выражено' : value <= -6 ? 'выраженная слабость' : value <= -2 ? 'заметная склонность' : 'нейтрально'

export const relationLabels: Record<RelationCharacter, string> = {
  "Вадим": "Вадим",
  "Копяр": "Копяр",
  "Романыч": "Романыч",
  Даша: 'Даша',
  Мама: 'Мама',
  Мишган: 'Мишган',
  Кед: 'Кед',
  Данз: 'Данз',
  Полина: 'Полина',
  Географичка: 'Географичка',
  Вероника: 'Вероника',
}

export const perks: Perk[] = [
  { id: 'streetwise', name: 'Улица учит', description: 'Опыт за сюжетные решения увеличивается на 25%.' },
  { id: 'observer', name: 'Наблюдатель', description: 'В будущем будет открывать скрытые детали, подсказки и внимательные реплики.' },
  { id: 'boxer', name: 'Уф-уф, бокс', description: 'В будущем даст преимущество в реакциях, таймингах и сценах, где нужно держать удар.' },
  { id: 'lucky-break', name: 'Фартовый выход', description: 'В будущем иногда будет давать второй шанс в мини-играх и рискованных проверках.' },
]

export const experienceForLevel = (experience: number) => Math.floor(experience / 40) + 1

export const createPlayerState = (abilities: AbilityScores): PlayerState => ({
  money: 170,
  experience: 0,
  reputation: 0,
  suspicion: 0,
  abilities: {
    ...abilities,
  },
  traits: { courage: 0, composure: 0, responsibility: 0, camaraderie: 0, cunning: 0, empathy: 0 },
  relations: {
    "Вадим": 0,
    "Копяр": 0,
    "Романыч": 0,
    Даша: 0,
    Мама: 0,
    Мишган: 0,
    Кед: 0,
    Данз: 0,
    Полина: 0,
    Географичка: 0,
    Вероника: 0,
  },
  inventory: ['keys', 'phone', 'backpack', 'pen', 'torn-note'].map((id) => inventoryItemCatalog[id]),
  flags: [],
  perks: [],
  specialPoints: 0,
  claimedPerkLevels: [],
  rewardedSpecialLevels: [],
  claimedSpecialLevels: [],
})

export const defaultAbilities: AbilityScores = {
  strength: 3,
  perception: 3,
  endurance: 3,
  charisma: 3,
  intelligence: 3,
  agility: 3,
  luck: 3,
}
