# Quest DSL

`src/story/questDsl.ts` compiles a typed quest graph into the existing runtime `Scene[]`. Node IDs are graph links, never presentation rules.

```ts
const quest = defineQuest({
  id: 'example',
  start: 'start',
  defaults: { background: 'school-yard-night', cast: ['Дмит'] },
  nodes: [
    dialogue({
      id: 'start',
      lines: [
        ['Рассказчик', 'Вечер у школы.'],
        ['Вадим', 'Мне нужна помощь.', ['Дмит', 'Вадим']],
      ],
      next: 'help',
    }),
    choice({
      id: 'help',
      prompt: 'Что делать?',
      options: [{
        text: 'Перелезть через забор.',
        check: skill('agility', 5),
        next: 'inside',
        failNext: 'caught',
        effects: [flag('VADIM_HELPED'), relation('Вадим', 1)],
      }],
    }),
    cosmeticChoice({
      id: 'tone',
      prompt: 'Что ответить?',
      continueTo: 'inside',
      options: [{ text: 'Без лекций.', reply: [['Дмит', 'Без лекций.']] }],
    }),
    timedChoice({
      id: 'run',
      prompt: 'Охранник близко.',
      durationSeconds: 10,
      defaultOptionIndex: 0,
      options: [{ text: 'Бежать.', next: 'inside' }],
    }),
    route({ id: 'state', routes: [['VADIM_HELPED', 'inside']].map(([flag, next]) => ({ flag, next })), fallback: 'caught' }),
    dialogue({ id: 'inside', lines: [['Рассказчик', 'Вы внутри.']], end: true }),
    dialogue({ id: 'caught', lines: [['Охранник', 'Стоять!']], end: true }),
  ],
})

const scenes = compileQuest(120, quest)
```

Dialogue lines receive deterministic internal IDs (`start`, `start__1`, …) and are auto-chained. The final line points to its node’s `next`. In a cosmetic choice, reply branches get generated IDs and all return to `continueTo`.

Presentation inherits in this order: quest `defaults` → node → dialogue line. `cast: ['Дмит', 'Вадим']` maps to `left/right`; a one-character cast leaves `right` absent. Set backgrounds, music, sounds, emotions and phone metadata in this context—never from an ID prefix.

Use `flag`, `relation`, and `money` for effects. Use `skill`, `requiresFlag`, `requiresAllFlags`, `requiresAnyFlag`, and `requiresMoney` for conditions. Runtime currently understands `requiresFlags`, `requiresAnyFlags`, and `requiresMoney` on choices.

`validateQuest` runs automatically in `compileQuest`. It rejects duplicate and generated-ID collisions, missing start/targets/fallbacks/failure routes, empty dialogue/options, invalid skill values and timed defaults, non-positive timers, cosmetic choices without `continueTo`, and unreachable nodes. Use `allowUnreachable` only while isolating intentionally archived legacy branches; remove it when the migration is complete.

Migration recipe:

1. Preserve every existing line, effect, check, route and ending in node data.
2. Move repeated visuals to defaults or node context.
3. Convert sequential lines to one `dialogue` node; do not hand-link each line.
4. Convert neutral answer/reply trees to `cosmeticChoice`, timed moments to `timedChoice`, and flag forks to `route`.
5. Run `npm run test:quest-dsl`, `npm run build`, and `npm run lint`.
