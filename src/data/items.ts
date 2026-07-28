import type { AbilityScores } from '../types/story'
import type { InventoryItem } from './player'

export type DialogueItemEffect = {
  duration: {
    type: 'dialogue-choice'
    uses: 1
  }
  bonuses: Partial<AbilityScores>
  penalties: Partial<AbilityScores>
  note: string
}

export type AvailableConsumableItem = InventoryItem & {
  kind: 'consumable'
  legalAgeRestricted: boolean
  effect: DialogueItemEffect
}

export const availableConsumableItems: AvailableConsumableItem[] = [
  {
    id: 'beer-bottle',
    name: 'Бутылка пива',
    icon: '🍺',
    description: 'Тёплое пиво из пакета. На одну реплику Дмит становится увереннее, но карта мира и логика начинают плыть.',
    kind: 'consumable',
    legalAgeRestricted: true,
    effect: {
      duration: { type: 'dialogue-choice', uses: 1 },
      bonuses: { charisma: 1 },
      penalties: { intelligence: -1 },
      note: '+1 Харизма, -1 Интеллект на одну опцию диалога.',
    },
  },
  {
    id: 'vodka-bottle',
    name: 'Бутылка водки',
    icon: '▥',
    description: 'Стеклянный аргумент плохих решений. На одну реплику добавляет дерзости и силы, но мозг уходит на перекур.',
    kind: 'consumable',
    legalAgeRestricted: true,
    effect: {
      duration: { type: 'dialogue-choice', uses: 1 },
      bonuses: { strength: 1, charisma: 1 },
      penalties: { intelligence: -1, perception: -1 },
      note: '+1 Сила, +1 Харизма, -1 Интеллект, -1 Внимательность на одну опцию диалога.',
    },
  },
  {
    id: 'cigarettes',
    name: 'Сигареты',
    icon: '▦',
    description: 'Пачка, которая выглядит взросло только издалека. Дмит говорит спокойнее, но выносливость платит по счёту.',
    kind: 'consumable',
    legalAgeRestricted: true,
    effect: {
      duration: { type: 'dialogue-choice', uses: 1 },
      bonuses: { charisma: 1 },
      penalties: { endurance: -1 },
      note: '+1 Харизма, -1 Выносливость на одну опцию диалога.',
    },
  },
  {
    id: 'snus',
    name: 'Снюс',
    icon: '◉',
    description: 'Маленькая шайба нервной энергии. Помогает резко собраться, но тело будто вспоминает, что оно против.',
    kind: 'consumable',
    legalAgeRestricted: true,
    effect: {
      duration: { type: 'dialogue-choice', uses: 1 },
      bonuses: { perception: 1, agility: 1 },
      penalties: { strength: -1 },
      note: '+1 Внимательность, +1 Ловкость, -1 Сила на одну опцию диалога.',
    },
  },
  {
    id: 'snuff',
    name: 'Нюхательный табак',
    icon: '✦',
    description: 'Пыльный фокус для тех, кто хочет выглядеть загадочно и сразу пожалеть. Голова работает быстрее, нос — нет.',
    kind: 'consumable',
    legalAgeRestricted: true,
    effect: {
      duration: { type: 'dialogue-choice', uses: 1 },
      bonuses: { intelligence: 1, perception: 1 },
      penalties: { charisma: -1 },
      note: '+1 Интеллект, +1 Внимательность, -1 Харизма на одну опцию диалога.',
    },
  },
]
