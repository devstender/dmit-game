import type { Ability, AbilityScores, RelationCharacter } from '../types/story'
export { availableConsumableItems, type AvailableConsumableItem, type DialogueItemEffect } from './items'

export type InventoryItem = {
  id: string
  name: string
  icon: string
  description: string
}

export type PlayerState = {
  money: number
  experience: number
  reputation: number
  abilities: AbilityScores
  relations: Record<RelationCharacter, number>
  inventory: InventoryItem[]
  flags: string[]
  perks: string[]
  specialPoints: number
  claimedPerkLevels: number[]
  rewardedSpecialLevels: number[]
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

export const relationLabels: Record<RelationCharacter, string> = {
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
  abilities: {
    ...abilities,
  },
  relations: {
    Мишган: 0,
    Кед: 0,
    Данз: 0,
    Полина: 0,
    Географичка: 0,
    Вероника: 0,
  },
  inventory: [
    { id: 'keys', name: 'Ключи от квартиры', icon: '⌁', description: 'Ключи от квартиры Дмитa. На одном брелоке написано: «Не потеряй».' },
    { id: 'phone', name: 'Телефон', icon: '▣', description: 'Телефон с треснувшим экраном. Заряд — 18%, уверенность — 100%.' },
    { id: 'backpack', name: 'Рюкзак', icon: '▱', description: 'Рюкзак, в котором есть всё необходимое и два старых фантика.' },
    { id: 'pen', name: 'Ручка', icon: '✎', description: 'Синяя ручка. Иногда пишет, когда ей действительно важно.' },
    { id: 'torn-note', name: 'Рваный лист бумаги', icon: '▤', description: 'Лист с обрывком неизвестной записи. Может пригодиться позже.' },
  ],
  flags: [],
  perks: [],
  specialPoints: 0,
  claimedPerkLevels: [],
  rewardedSpecialLevels: [],
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
