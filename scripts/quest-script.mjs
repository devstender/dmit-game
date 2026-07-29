import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const characters = new Set(['Дмит', 'Мишган', 'Кед', 'Данз', 'Полина', 'Географичка', 'Вероника', 'Охранник', 'Татьяна', 'Игорь', 'Папа', 'Матвей', 'Приятель Матвея', 'Учительница', 'Классная руководительница', 'Мама', 'Вадим', 'Копяр', 'Незнакомка', '???', 'Пацан', 'Пацан Матвея', 'Женщина из окна', 'Женщина с балкона', 'Рассказчик'])
const relationCharacters = new Set(['Мишган', 'Кед', 'Данз', 'Полина', 'Географичка', 'Вероника', 'Вадим', 'Копяр', 'Мама'])
const abilities = new Set(['Сила', 'Внимательность', 'Выносливость', 'Харизма', 'Интеллект', 'Ловкость', 'Удача'])
const backgrounds = new Set(['school', 'school-dark-vaz', 'classroom', 'home', 'dmit-room', 'minika', 'school-yard-night', 'school-main-entrance-night', 'school-backyard-night', 'school-corridor-night', 'school-corridor-morning', 'school-second-floor-night', 'computer-class-night', 'school-classroom-day', 'school-corridor-day', 'school-yard-day', 'dmit-home-hallway-day', 'dmit-bedroom-day', 'dmit-bedroom-evening', 'dmit-bedroom-night', 'dmit-bedroom-morning'])
const sounds = new Set(['school-bell', 'mishgan-fall', 'dmit-run', 'guard-run', 'guard-shout', 'phone-vibrate', 'quest-complete', 'beer-open', 'matvey-music', 'skill-success', 'skill-fail', 'school-door-buzz', 'school-entry-creak', 'guard-alert', 'black-phone-vibration', 'igor-mystery-sting', 'bike-chain-rattle', 'alarm-clock'])
const phoneOwnershipFlags = new Set(['DMIT_HAS_BLACK_PHONE', 'VADIM_HAS_BLACK_PHONE', 'BLACK_PHONE_LEFT_AT_SCHOOL', 'BLACK_PHONE_DESTROYED', 'BLACK_PHONE_CONFISCATED'])

const fail = (source, line, message) => {
  throw new Error(`${source}:${line}: ${message}`)
}
const clean = (line) => line.trim()
const parseCast = (value, source, line) => {
  const cast = value.split('|').map(clean).filter(Boolean)
  if (cast.length < 1 || cast.length > 2 || cast.some((name) => !characters.has(name))) fail(source, line, 'Unknown or invalid @cast.')
  return cast
}
const parseEffect = (line, source, lineNumber) => {
  const match = line.match(/^\+(flag|relation|money)\s+(.+)$/)
  if (!match) fail(source, lineNumber, `Unknown effect: ${line}`)
  const [, type, raw] = match
  if (type === 'flag') return { type, value: raw.trim() }
  if (type === 'money') {
    const value = Number(raw)
    if (!Number.isFinite(value)) fail(source, lineNumber, 'Money effect must be a number.')
    return { type, value }
  }
  const relation = raw.match(/^(.+?)\s+(-?\d+)$/)
  if (!relation || !relationCharacters.has(relation[1])) fail(source, lineNumber, 'Unknown relation character or delta.')
  return { type, character: relation[1], value: Number(relation[2]) }
}

function parseScript(input, source = 'quest', shouldValidate = true) {
  const rawLines = input.replace(/^\uFEFF/, '').split(/\r?\n/)
  const nodes = []
  let current = null
  let pending = {}

  const addLine = (speaker, text, line) => {
    if (!current || (current.type !== 'dialogue' && current.type !== 'phone' && current.type !== 'cosmetic')) fail(source, line, 'Dialogue line outside a dialogue block.')
    if (!characters.has(speaker) && !(current.type === 'phone' && speaker === current.contact)) fail(source, line, `Unknown character "${speaker}".`)
    if (current.type === 'phone' && speaker === 'Рассказчик') fail(source, line, 'Narrator is not allowed inside ::phone.')
    const meta = { ...pending }
    pending = {}
    current.lines.push({ speaker, text, ...meta, line })
  }
  const addOption = (text, line) => {
    if (!current || (current.type !== 'choice' && current.type !== 'cosmetic' && current.type !== 'extend-choice')) fail(source, line, 'Option outside a choice block.')
    current.options.push({ text, line, effects: [], requiresAll: [], requiresAny: [] })
  }
  const activeOption = (line) => {
    const option = current?.options.at(-1)
    if (!option) fail(source, line, 'Option directive without an option.')
    return option
  }
  const finish = (line) => {
    if (!current) fail(source, line, 'Unexpected ::end.')
    if (Object.keys(pending).length) fail(source, line, 'A *-next directive has no following dialogue line.')
    if ((current.type === 'dialogue' || current.type === 'phone') && !current.next && !current.end) fail(source, line, 'Dialogue requires @next or @end.')
    if ((current.type === 'choice' || current.type === 'cosmetic' || current.type === 'extend-choice') && current.options.length === 0) fail(source, line, 'Choice requires at least one option.')
    if (current.type === 'choice') current.options.forEach((option) => { if (!option.next) fail(source, option.line, 'Choice option requires -> target.'); if (option.skill && !option.failNext) fail(source, option.line, 'Skill check requires !-> failure target.') })
    if (current.type === 'cosmetic') {
      if (!current.continueTo) fail(source, line, 'Cosmetic choice requires @continue.')
      current.options.forEach((option) => { if (!option.reply?.length) fail(source, option.line, 'Cosmetic option requires at least one reply.') })
    }
    if (current.type === 'hook' && (!current.fallback || !current.continueTo)) fail(source, line, 'Hook requires @fallback and @continue.')
    if (current.type === 'extend' && !current.start) fail(source, line, 'Extension requires @start.')
    if (current.type === 'extend-choice') current.options.forEach((option) => { if (!option.next) fail(source, option.line, 'Choice option requires -> target.'); if (option.skill && !option.failNext) fail(source, option.line, 'Skill check requires !-> failure target.') })
    if (current.type === 'route' && !current.fallback) fail(source, line, 'Route requires * -> fallback.')
    nodes.push(current)
    current = null
  }

  rawLines.forEach((raw, index) => {
    const lineNumber = index + 1
    const line = clean(raw)
    if (!line || line.startsWith('#') || line.startsWith('//')) return
    const block = line.match(/^::(dialogue|phone|route|choice|cosmetic|hook|extend|extend-choice)\s+([\w-]+)$/)
    if (block) {
      if (current) fail(source, lineNumber, 'Close the previous block with ::end.')
      const [, type, id] = block
      current = { type, id, line: lineNumber, lines: [], options: [], effects: [], routes: [], cast: undefined, next: undefined, end: false, whenAll: [], whenAny: [], unless: [] }
      return
    }
    if (line === '::end') return finish(lineNumber)
    if (!current) fail(source, lineNumber, 'Content outside a block.')

    if (current.type === 'route') {
      const route = line.match(/^(\*|[A-Z][A-Z0-9_]+)\s*->\s*([\w-]+)$/)
      if (!route) fail(source, lineNumber, 'Route syntax: FLAG -> target or * -> fallback.')
      if (route[1] === '*') current.fallback = route[2]
      else current.routes.push({ flag: route[1], next: route[2], line: lineNumber })
      return
    }

    if (line.startsWith('@')) {
      const [directive, ...parts] = line.slice(1).split(/\s+/)
      const value = parts.join(' ').trim()
      if (directive === 'bg') { if (!backgrounds.has(value)) fail(source, lineNumber, `Unknown background "${value}".`); current.background = value; return }
      if (directive === 'cast') { current.cast = parseCast(value, source, lineNumber); return }
      if (directive === 'next') { current.next = value; return }
      if (directive === 'end') { current.end = true; return }
      if (directive === 'prompt') { current.prompt = value; return }
      if (directive === 'continue') { current.continueTo = value; return }
      if (directive === 'fallback') { if (current.type !== 'hook') fail(source, lineNumber, '@fallback is only available inside ::hook.'); current.fallback = value; return }
      if (directive === 'start') { if (current.type !== 'extend') fail(source, lineNumber, '@start is only available inside ::extend.'); current.start = value; return }
      if (directive === 'when') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when is only available inside extensions.'); current.whenAll.push(value); return }
      if (directive === 'when-all') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when-all is only available inside extensions.'); current.whenAll.push(...parts); return }
      if (directive === 'when-any') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when-any is only available inside extensions.'); current.whenAny.push(...parts); return }
      if (directive === 'unless') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@unless is only available inside extensions.'); current.unless.push(...parts); return }
      if (directive === 'priority') { if (current.type !== 'extend') fail(source, lineNumber, '@priority is only available inside ::extend.'); const priority = Number(value); if (!Number.isFinite(priority)) fail(source, lineNumber, '@priority must be a number.'); current.priority = priority; return }
      if (directive === 'position') { if (current.type !== 'extend-choice') fail(source, lineNumber, '@position is only available inside ::extend-choice.'); const position = Number(value); if (!Number.isInteger(position) || position < 0) fail(source, lineNumber, '@position must be a non-negative integer.'); current.position = position; return }
      if (directive === 'contact') { if (current.type !== 'phone') fail(source, lineNumber, '@contact is only available inside ::phone.'); current.contact = value; return }
      if (directive === 'time') { if (current.type !== 'phone') fail(source, lineNumber, '@time is only available inside ::phone.'); current.time = value; return }
      if (directive === 'notify') { if (current.type !== 'phone' || !sounds.has(value)) fail(source, lineNumber, 'Unknown phone notification sound.'); current.notify = value; return }
      if (directive === 'tone') { if (!['default', 'danger'].includes(value)) fail(source, lineNumber, 'Tone must be default or danger.'); current.tone = value; return }
      if (directive === 'sound-next') { if (!sounds.has(value)) fail(source, lineNumber, `Unknown sound "${value}".`); pending.sound = value; return }
      if (directive === 'effect-next') { pending.effects = [...(pending.effects ?? []), parseEffect(`+${value}`, source, lineNumber)]; return }
      if (directive === 'cast-next') { pending.cast = parseCast(value, source, lineNumber); return }
      if (directive === 'tone-next') { if (!['default', 'danger'].includes(value)) fail(source, lineNumber, 'Tone must be default or danger.'); pending.tone = value; return }
      if (directive === 'say') { activeOption(lineNumber).say = value; return }
      if (directive === 'narration') { activeOption(lineNumber).narration = value; return }
      if (directive === 'requires') { activeOption(lineNumber).requiresAll.push(value); return }
      if (directive === 'requires-all') { activeOption(lineNumber).requiresAll.push(...parts); return }
      if (directive === 'requires-any') { activeOption(lineNumber).requiresAny.push(...parts); return }
      fail(source, lineNumber, `Unknown directive @${directive}.`)
    }

    if (line.startsWith('+')) { activeOption(lineNumber).effects.push(parseEffect(line, source, lineNumber)); return }
    if (line.startsWith('- ')) { addOption(line.slice(2).trim(), lineNumber); return }
    if (line.startsWith('->')) { activeOption(lineNumber).next = line.slice(2).trim(); return }
    if (line.startsWith('!->')) { activeOption(lineNumber).failNext = line.slice(3).trim(); return }
    if (line.startsWith('? ')) {
      const match = line.slice(2).match(/^(.+?)\s+(\d+)$/)
      if (!match || !abilities.has(match[1])) fail(source, lineNumber, 'Skill syntax: ? Харизма 3.')
      activeOption(lineNumber).skill = { stat: match[1], value: Number(match[2]) }
      return
    }

    const speech = line.match(/^([^:]+):\s*(.+)$/)
    if (!speech) fail(source, lineNumber, 'Expected a dialogue line, option, directive, or transition.')
    if (current.type === 'cosmetic' && current.options.length) {
      const option = activeOption(lineNumber)
      option.reply ??= []
      const meta = { ...pending }
      pending = {}
      option.reply.push({ speaker: speech[1].trim(), text: speech[2].trim(), ...meta, line: lineNumber })
      if (!characters.has(speech[1].trim())) fail(source, lineNumber, `Unknown character "${speech[1].trim()}".`)
      return
    }
    addLine(speech[1].trim(), speech[2].trim(), lineNumber)
  })
  if (current) fail(source, rawLines.length, 'Missing ::end.')
  const prepared = shouldValidate ? prepareNodes(nodes, source) : nodes
  if (shouldValidate) validate(prepared, source)
  return prepared
}

function targets(node) {
  if (node.type === 'route') return [...node.routes.map((item) => item.next), node.fallback]
  if (node.type === 'hook') return [node.fallback, ...node.branches.map((branch) => branch.start)]
  if (node.type === 'dialogue' || node.type === 'phone') return node.next ? [node.next] : []
  if (node.type === 'choice') return node.options.flatMap((option) => [option.next, option.failNext].filter(Boolean))
  return [node.continueTo]
}
function prepareNodes(nodes, source) {
  const hooks = nodes.filter((node) => node.type === 'hook')
  const extensions = nodes.filter((node) => node.type === 'extend')
  const choiceExtensions = nodes.filter((node) => node.type === 'extend-choice')
  const prepared = nodes.filter((node) => !['extend', 'extend-choice'].includes(node.type)).map((node) => ({ ...node, options: node.options ? [...node.options] : node.options }))
  const byId = new Map(prepared.map((node) => [node.id, node]))

  for (const hook of hooks) {
    const target = byId.get(hook.id)
    if (!target || target.type !== 'hook') fail(source, hook.line, `Unknown hook "${hook.id}".`)
    const branches = extensions.filter((extension) => extension.id === hook.id)
      .map((extension) => ({
        start: extension.start,
        ...(extension.whenAll.length ? { allFlags: extension.whenAll } : {}),
        ...(extension.whenAny.length ? { anyFlags: extension.whenAny } : {}),
        ...(extension.unless.length ? { unlessFlags: extension.unless } : {}),
        ...(extension.priority !== undefined ? { priority: extension.priority } : {}),
      }))
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
    target.branches = branches
    prepared.push({ type: 'route', id: `${hook.id}-exit`, line: hook.line, routes: [], fallback: hook.continueTo })
  }

  for (const extension of extensions) {
    const target = byId.get(extension.id)
    if (!target || target.type !== 'hook') fail(source, extension.line, `::extend target "${extension.id}" is not a ::hook.`)
  }

  for (const extension of choiceExtensions) {
    const target = byId.get(extension.id)
    if (!target || target.type !== 'choice') fail(source, extension.line, `::extend-choice target "${extension.id}" is not a ::choice.`)
    const visibleWhen = {
      ...(extension.whenAll.length ? { allFlags: extension.whenAll } : {}),
      ...(extension.whenAny.length ? { anyFlags: extension.whenAny } : {}),
      ...(extension.unless.length ? { unlessFlags: extension.unless } : {}),
    }
    const options = extension.options.map((option) => ({ ...option, ...(Object.keys(visibleWhen).length ? { visibleWhen } : {}) }))
    const position = Math.min(extension.position ?? target.options.length, target.options.length)
    target.options.splice(position, 0, ...options)
  }

  return prepared
}
function allEffects(node) {
  const optionEffects = node.options?.flatMap((option) => option.effects ?? []) ?? []
  return [...(node.effects ?? []), ...optionEffects, ...node.lines?.flatMap((line) => line.effects ?? []) ?? []]
}
function validate(nodes, source) {
  const ids = new Map()
  const errors = []
  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`${source}:${node.line}: Duplicate node id "${node.id}" (first at line ${ids.get(node.id)}).`)
    ids.set(node.id, node.line)
    if (node.type === 'phone' && !node.contact) errors.push(`${source}:${node.line}: ::phone requires @contact.`)
    if (node.type === 'phone' && node.lines.some((line) => line.speaker === 'Рассказчик')) errors.push(`${source}:${node.line}: Narrator is not allowed inside ::phone.`)
    const ownership = allEffects(node).filter((effect) => effect.type === 'flag' && phoneOwnershipFlags.has(effect.value))
    if (new Set(ownership.map((effect) => effect.value)).size > 1) errors.push(`${source}:${node.line}: Conflicting black-phone ownership effects in one node.`)
  }
  for (const node of nodes) for (const target of targets(node)) if (target && !ids.has(target)) errors.push(`${source}:${node.line}: Unknown target "${target}" from "${node.id}".`)
  if (nodes.length) {
    const reachable = new Set([nodes[0].id])
    const queue = [nodes[0].id]
    while (queue.length) {
      const currentId = queue.shift()
      const node = nodes.find((candidate) => candidate.id === currentId)
      if (!node) continue
      for (const target of targets(node)) if (target && !reachable.has(target)) { reachable.add(target); queue.push(target) }
    }
    nodes.filter((node) => !reachable.has(node.id)).forEach((node) => errors.push(`${source}:${node.line}: Unreachable node "${node.id}".`))
  }
  if (errors.length) throw new Error(errors.join('\n'))
}

const quote = (value) => JSON.stringify(value)
const effectCode = (effect) => effect.type === 'flag' ? `flag(${quote(effect.value)})` : effect.type === 'money' ? `money(${effect.value})` : `relation(${quote(effect.character)}, ${effect.value})`
const contextCode = (node) => [
  node.background ? `...setBackground(${quote(node.background)})` : '',
  node.cast?.length ? `cast: [${node.cast.map(quote).join(', ')}]` : '',
  node.tone ? `tone: ${quote(node.tone)}` : '',
].filter(Boolean).join(',\n    ')
const lineCode = (line, phone) => {
  const extras = []
  if (line.cast) extras.push(`cast: [${line.cast.map(quote).join(', ')}]`)
  if (line.tone) extras.push(`tone: ${quote(line.tone)}`)
  if (line.sound) extras.push(`sound: ${quote(line.sound)}`)
  if (line.effects?.length) extras.push(`effects: [${line.effects.map(effectCode).join(', ')}]`)
  if (phone) extras.push(`phoneMessage: { contact: ${quote(phone.contact)}, direction: ${quote(line.speaker === 'Дмит' ? 'outgoing' : 'incoming')}${phone.time ? `, time: ${quote(phone.time)}` : ''} }`)
  return `[${quote(line.speaker)}, ${quote(line.text)}${extras.length ? `, { ${extras.join(', ')} }` : ''}]`
}
const requirementsCode = (option) => {
  const requirements = []
  if (option.requiresAll.length) requirements.push(`requiresAllFlags(${option.requiresAll.map(quote).join(', ')})`)
  if (option.requiresAny.length) requirements.push(`requiresAnyFlag(${option.requiresAny.map(quote).join(', ')})`)
  if (!requirements.length) return ''
  return `, require: ${requirements.length === 1 ? requirements[0] : `[${requirements.join(', ')}]`}`
}
function generate(nodes, options) {
  const first = nodes[0]?.id
  const questId = options.id ?? path.basename(options.input, '.quest')
  const start = options.start ?? first
  const exportName = `${questId.replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase()).replace(/^[^a-zA-Z_]/, 'quest') || 'quest'}Definition`
  const importPath = relativeImport(options.output, path.resolve('src/story/questDsl.ts'))
  const imported = new Set(['defineQuest'])
  nodes.forEach((node) => {
    if (node.type === 'dialogue' || node.type === 'phone') imported.add('dialogue')
    if (node.type === 'choice') imported.add('choice')
    if (node.type === 'cosmetic') imported.add('cosmeticChoice')
    if (node.type === 'route') imported.add('route')
    if (node.type === 'hook') imported.add('hook')
    if (node.background) imported.add('setBackground')
    node.options?.forEach((option) => {
      if (option.skill) imported.add('skill')
      if (option.requiresAll?.length) imported.add('requiresAllFlags')
      if (option.requiresAny?.length) imported.add('requiresAnyFlag')
    })
    allEffects(node).forEach((effect) => imported.add(effect.type))
  })
  const nodeCode = nodes.map((node) => {
    if (node.type === 'route') return `route({\n    id: ${quote(node.id)},\n    routes: [${node.routes.map((item) => `[${quote(item.flag)}, ${quote(item.next)}]`).join(', ')}],\n    fallback: ${quote(node.fallback)},\n  })`
    if (node.type === 'hook') return `hook({\n    id: ${quote(node.id)},\n    fallback: ${quote(node.fallback)},\n    branches: [${node.branches.map((branch) => `{ start: ${quote(branch.start)}${branch.allFlags?.length ? `, allFlags: [${branch.allFlags.map(quote).join(', ')}]` : ''}${branch.anyFlags?.length ? `, anyFlags: [${branch.anyFlags.map(quote).join(', ')}]` : ''}${branch.unlessFlags?.length ? `, unlessFlags: [${branch.unlessFlags.map(quote).join(', ')}]` : ''}${branch.priority !== undefined ? `, priority: ${branch.priority}` : ''} }`).join(', ')}],\n  })`
    if (node.type === 'dialogue' || node.type === 'phone') {
      const phone = node.type === 'phone' ? { contact: node.contact, time: node.time } : null
      const context = contextCode(node)
      let notified = false
      const lines = node.lines.map((line) => {
        const phoneLine = phone && line.speaker !== 'Дмит' ? { ...phone } : phone
        const withNotify = node.type === 'phone' && !notified && line.speaker !== 'Дмит' && node.notify ? { ...line, sound: node.notify } : line
        if (node.type === 'phone' && line.speaker !== 'Дмит') notified = true
        return lineCode(withNotify, phoneLine)
      })
      return `dialogue({\n    id: ${quote(node.id)},\n${context ? `    ${context},\n` : ''}    lines: [\n      ${lines.join(',\n      ')},\n    ],${node.next ? `\n    next: ${quote(node.next)},` : ''}${node.end ? '\n    end: true,' : ''}\n  })`
    }
    if (node.type === 'choice') {
      const context = contextCode(node)
      const optionsCode = node.options.map((option) => `      { text: ${quote(option.text)}${option.say ? `, say: ${quote(option.say)}` : ''}${option.narration ? `, narration: ${quote(option.narration)}` : ''}, next: ${quote(option.next)}${option.failNext ? `, failNext: ${quote(option.failNext)}` : ''}${option.skill ? `, check: skill(${quote(option.skill.stat)}, ${option.skill.value})` : ''}${requirementsCode(option)}${option.visibleWhen ? `, visibleWhen: ${JSON.stringify(option.visibleWhen)}` : ''}${option.effects.length ? `, effects: [${option.effects.map(effectCode).join(', ')}]` : ''} }`).join(',\n')
      return `choice({\n    id: ${quote(node.id)},\n    speaker: 'Дмит',\n    prompt: ${quote(node.prompt)},\n${context ? `    ${context},\n` : ''}    options: [\n${optionsCode}\n    ],\n  })`
    }
    const context = contextCode(node)
    const optionCode = node.options.map((option) => `      { text: ${quote(option.text)}, reply: [${option.reply.map((line) => lineCode(line)).join(', ')}]${option.effects.length ? `, effects: [${option.effects.map(effectCode).join(', ')}]` : ''} }`).join(',\n')
    return `cosmeticChoice({\n    id: ${quote(node.id)},\n    speaker: 'Дмит',\n    prompt: ${quote(node.prompt)},\n${context ? `    ${context},\n` : ''}    continueTo: ${quote(node.continueTo)},\n    options: [\n${optionCode}\n    ],\n  })`
  }).join(',\n  ')
  return `/* This file is generated by scripts/quest-script.mjs. Do not edit manually. */\nimport { ${[...imported].sort().join(', ')} } from ${quote(importPath)}\n\nexport const ${exportName} = defineQuest({\n  id: ${quote(questId)},\n  start: ${quote(start)},\n  nodes: [\n  ${nodeCode}\n  ],\n})\n`
}
function relativeImport(from, target) {
  let relative = path.relative(path.dirname(path.resolve(from)), target).replaceAll('\\', '/').replace(/\.ts$/, '')
  if (!relative.startsWith('.')) relative = `./${relative}`
  return relative
}
function parseArgs(argv) {
  const args = { check: false, inputs: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--check') args.check = true
    else if (value === '--out') args.output = argv[++index]
    else if (value === '--id') args.id = argv[++index]
    else if (value === '--start') args.start = argv[++index]
    else args.inputs.push(value)
  }
  if (!args.inputs.length) throw new Error('Usage: npm run quest:build -- path/to/quest.quest [more.quest] [--out output.generated.ts] [--id quest-id] [--start node-id]')
  args.input = args.inputs[0]
  args.output ??= args.input.replace(/\.quest$/i, '.generated.ts')
  return args
}

const includePattern = /^@include\s+["'](.+)["']$/
async function expandInclude(pattern, manifestPath) {
  const absolutePattern = path.resolve(path.dirname(manifestPath), pattern)
  if (!absolutePattern.includes('*')) return [absolutePattern]
  const directory = path.dirname(absolutePattern)
  const wildcard = path.basename(absolutePattern)
  const expression = new RegExp(`^${wildcard.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`)
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return []
    throw error
  }
  return entries.filter((entry) => entry.isFile() && expression.test(entry.name)).map((entry) => path.join(directory, entry.name)).sort()
}

async function resolveQuestInputs(inputPaths) {
  const entries = []
  let chapter = null
  for (const inputPath of inputPaths) {
    const content = await readFile(inputPath, 'utf8')
    const firstMeaningful = content.split(/\r?\n/).map(clean).find((line) => line && !line.startsWith('#') && !line.startsWith('//'))
    const chapterHeader = firstMeaningful?.match(/^::chapter\s+([\w-]+)$/)
    if (!chapterHeader) {
      entries.push({ inputPath, content })
      continue
    }
    if (chapter) throw new Error(`Only one ::chapter manifest can be used per build: ${inputPath}`)
    const directives = content.split(/\r?\n/).map(clean)
    const start = directives.find((line) => line.startsWith('@start '))?.slice(7).trim()
    const includes = directives.map((line) => line.match(includePattern)).filter(Boolean).map((match) => match[1])
    if (!start) throw new Error(`${inputPath}: ::chapter requires @start.`)
    if (!includes.length) throw new Error(`${inputPath}: ::chapter requires at least one @include.`)
    chapter = { id: chapterHeader[1], start }
    for (const include of includes) {
      const files = await expandInclude(include, inputPath)
      if (!files.length && !include.includes('*')) throw new Error(`${inputPath}: @include "${include}" did not match files.`)
      for (const file of files) entries.push({ inputPath: file, content: await readFile(file, 'utf8') })
    }
  }
  return { entries, chapter }
}

export { generate, parseScript }

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2))
    const resolved = await resolveQuestInputs(options.inputs)
    if (resolved.chapter) {
      options.id ??= resolved.chapter.id
      options.start ??= resolved.chapter.start
      options.input = options.inputs[0]
    }
    const parsedScripts = await Promise.all(resolved.entries.map(async ({ inputPath, content }) => (
      parseScript(content, inputPath, false)
    )))
    const nodes = prepareNodes(parsedScripts.flat(), options.inputs.join(', '))
    validate(nodes, options.inputs.join(', '))
    if (!options.check) {
      await mkdir(path.dirname(options.output), { recursive: true })
      await writeFile(options.output, generate(nodes, options), 'utf8')
      console.info(`Generated ${options.output}: ${nodes.length} nodes.`)
    } else console.info(`Quest script check passed: ${options.inputs.join(', ')} (${nodes.length} nodes).`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
