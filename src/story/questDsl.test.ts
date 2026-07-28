import {
  choice,
  compileQuest,
  cosmeticChoice,
  defineQuest,
  dialogue,
  flag,
  money,
  requiresAllFlags,
  requiresAnyFlag,
  requiresMoney,
  route,
  skill,
  timedChoice,
  validateQuest,
} from './questDsl.ts'
import type { Character } from '../types/story'

// The project is currently repairing historical mojibake in character literals.
// These test-only typed labels keep the graph tests independent from that cleanup.
const hero = 'Дмит' as Character
const narrator = 'Рассказчик' as Character

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const expectError = (action: () => void, text: string) => {
  try {
    action()
  } catch (error) {
    assert(error instanceof Error && error.message.includes(text), `Expected error containing: ${text}`)
    return
  }
  throw new Error(`Expected validation error containing: ${text}`)
}

export const runQuestDslTests = () => {
  const quest = defineQuest({
    id: 'unit',
    start: 'start',
    defaults: { background: 'school-yard-night' as const, cast: [hero] as const, tone: 'default' as const },
    nodes: [
      dialogue({ id: 'start', lines: [[narrator, 'one'], [hero, 'two', { cast: [hero] as const, tone: 'danger' as const }]], next: 'pick' }),
      choice({
        id: 'pick', prompt: 'pick', options: [
          { text: 'skill', next: 'timer', failNext: 'fail', check: skill('agility', 5), effects: [flag('WIN'), money(3)] },
          { text: 'locked', next: 'cosmetic', require: [requiresMoney(2), requiresAllFlags('A'), requiresAnyFlag('B', 'C')] },
        ],
      }),
      timedChoice({ id: 'timer', prompt: 'timer', durationSeconds: 7, defaultOptionIndex: 0, options: [{ text: 'go', next: 'cosmetic' }] }),
      cosmeticChoice({ id: 'cosmetic', prompt: 'cosmetic', continueTo: 'router', options: [{ text: 'answer', reply: [[hero, 'reply'], [narrator, 'reaction']] }] }),
      route({ id: 'router', routes: [{ flag: 'WIN', next: 'win' }], fallback: 'fail' }),
      dialogue({ id: 'win', lines: [[narrator, 'win']], end: true }),
      dialogue({ id: 'fail', lines: [[narrator, 'fail']], end: true }),
    ],
  })
  const scenes = compileQuest(41, quest)
  assert(scenes[0]?.next === 42, 'Dialogue lines must auto-chain.')
  assert(scenes[1]?.next === 43, 'Last dialogue line must transition to the next node.')
  const pick = scenes.find((scene) => scene.text === 'pick')
  assert(pick?.choices?.[0]?.failNext !== undefined, 'Skill check must compile failNext.')
  assert(pick?.choices?.[1]?.requiresMoney === 2 && pick.choices[1].requiresFlags?.includes('A') && pick.choices[1].requiresAnyFlags?.includes('B'), 'Requirements must compile to runtime fields.')
  const timer = scenes.find((scene) => scene.text === 'timer')
  assert(timer?.choiceTimer?.durationSeconds === 7, 'Timed choice duration must not be hard-coded.')
  const cosmetic = scenes.find((scene) => scene.text === 'cosmetic')
  assert(cosmetic?.choices?.[0]?.next !== undefined, 'Cosmetic choices need a generated reply branch.')
  const router = scenes.find((scene) => scene.text === '')
  assert(router?.nextByFlag?.[0]?.flag === 'WIN' && router.fallbackNext !== undefined, 'Routes must compile.')
  assert(scenes[0]?.background === 'school-yard-night' && scenes[1]?.tone === 'danger', 'Node and line context must inherit and override deterministically.')
  assert(JSON.stringify(compileQuest(41, quest)) === JSON.stringify(scenes), 'Generated scene indices must be stable.')

  expectError(() => validateQuest(defineQuest({ id: 'missing', start: 'a', nodes: [dialogue({ id: 'a', lines: [[narrator, 'x']], next: 'lost' })] })), 'Unknown target')
  expectError(() => validateQuest(defineQuest({ id: 'duplicate', start: 'a', nodes: [dialogue({ id: 'a', lines: [[narrator, 'x']], end: true }), dialogue({ id: 'a', lines: [[narrator, 'y']], end: true })] })), 'Duplicate node id')
  expectError(() => validateQuest(defineQuest({ id: 'unreachable', start: 'a', nodes: [dialogue({ id: 'a', lines: [[narrator, 'x']], end: true }), dialogue({ id: 'b', lines: [[narrator, 'y']], end: true })] })), 'Unreachable node')
  expectError(() => validateQuest(defineQuest({ id: 'bad-timer', start: 'a', nodes: [timedChoice({ id: 'a', prompt: 'x', durationSeconds: 0, options: [{ text: 'x', next: 'end' }] }), dialogue({ id: 'end', lines: [[narrator, 'end']], end: true })] })), 'durationSeconds')
}

runQuestDslTests()
console.info('Quest DSL tests passed.')
