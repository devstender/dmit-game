import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const characters = new Set(['Дмит', 'Мишган', 'Кед', 'Данз', 'Полина', 'Географичка', 'Вероника', 'Охранник', 'Татьяна', 'Игорь', 'Папа', 'Матвей', 'Приятель Матвея', 'Учительница', 'Классная руководительница', 'Мама', 'Вадим', 'Копяр', 'Романыч', 'Ваня Ильичёв', 'Даша', 'Неизвестный', 'Незнакомка', '???', 'Пацан', 'Пацан Матвея', 'Женщина из окна', 'Женщина с балкона', 'Рассказчик', 'Все'])
const relationCharacters = new Set(['Мишган', 'Кед', 'Данз', 'Полина', 'Географичка', 'Вероника', 'Вадим', 'Копяр', 'Мама', 'Романыч', 'Даша'])
const abilities = new Set(['Сила', 'Внимательность', 'Выносливость', 'Харизма', 'Интеллект', 'Ловкость', 'Удача'])
const traits = new Map([['Характер', 'courage'], ['Смелость', 'courage'], ['Самообладание', 'composure'], ['Ответственность', 'responsibility'], ['Товарищество', 'camaraderie'], ['Хитрость', 'cunning'], ['Эмпатия', 'empathy']])
const backgrounds = new Set(['school', 'school-dark-vaz', 'classroom', 'home', 'dmit-room', 'minika', 'school-yard-night', 'school-main-entrance-night', 'school-backyard-night', 'school-corridor-night', 'school-corridor-morning', 'school-second-floor-night', 'computer-class-night', 'school-storage-night', 'school-classroom-day', 'school-corridor-day', 'school-yard-day', 'dmit-home-hallway-day', 'dmit-bedroom-day', 'dmit-bedroom-evening', 'dmit-bedroom-night', 'dmit-bedroom-morning', 'penza-station-square-morning', 'penza-station-platform-morning', 'electric-train-carriage-day', 'road-to-builder-camp-day', 'builder-camp-gates-day'])
const sounds = new Set(['school-bell', 'mishgan-fall', 'dmit-run', 'guard-run', 'guard-shout', 'phone-vibrate', 'quest-complete', 'beer-open', 'matvey-music', 'skill-success', 'skill-fail', 'school-door-buzz', 'school-entry-creak', 'guard-alert', 'black-phone-vibration', 'igor-mystery-sting', 'bike-chain-rattle', 'alarm-clock', 'camera-shutter', 'station-announcement', 'metal-rattle', 'security-beep', 'metal-grate', 'metal-crash', 'distant-door', 'school-alarm', 'balls-scatter', 'guard-shout-distant', 'metal-gate-close', 'piano-crash', 'school-bell-short', 'door-creak', 'phone-screen-crack', 'fire-door-rattle', 'station-shoulder-bump', 'train-carriage-entry', 'train-departure', 'train-start-moving', 'acoustic-guitar-strum', 'matvey-head-slap', 'train-brakes', 'camp-gate-close'])
const phoneOwnershipFlags = new Set(['DMIT_HAS_BLACK_PHONE', 'VADIM_HAS_BLACK_PHONE', 'BLACK_PHONE_LEFT_AT_SCHOOL', 'BLACK_PHONE_DESTROYED', 'BLACK_PHONE_CONFISCATED'])

const fail = (source, line, message) => {
  throw new Error(`${source}:${line}: ${message}`)
}
const clean = (line) => line.trim()
const parseCast = (value, source, line) => {
  const cast = value.split('|').map(clean).filter(Boolean)
  if (cast.length < 1 || cast.some((name) => !characters.has(name))) fail(source, line, 'Unknown or invalid @cast.')
  // The authored cast may list the whole group. The generator selects the
  // current speaker plus Дмит for each dialogue line.
  return cast
}
const parseEffect = (line, source, lineNumber) => {
  const match = line.match(/^([+-])(flag|item|relation|money|experience|ability|trait|suspicion|reputation)\s+(.+)$/)
  if (!match) fail(source, lineNumber, `Unknown effect: ${line}`)
  const [, sign, type, raw] = match
  if (type === 'flag') { if (sign === '-') fail(source, lineNumber, 'Flags can only be added.'); return { type, value: raw.trim() } }
  if (type === 'item') {
    if (sign === '-') fail(source, lineNumber, 'Items can only be added.')
    if (!/^[a-z0-9-]+$/.test(raw.trim())) fail(source, lineNumber, 'Item id must use lowercase letters, digits, and hyphens.')
    return { type, value: raw.trim() }
  }
  if (type === 'money' || type === 'experience' || type === 'suspicion' || type === 'reputation') {
    const normalizedRaw = type === 'reputation' ? raw.replace(/^(?:Авторитет|Подозрение)\s+/, '') : raw
    const value = Number(normalizedRaw) * (sign === '-' ? -1 : 1)
    if (!Number.isFinite(value)) fail(source, lineNumber, `${type} effect must be a number.`)
    return { type, value }
  }
  if (type === 'ability') {
    const ability = raw.match(/^(.+?)\s+(-?\d+)$/)
    if (!ability || !abilities.has(ability[1])) fail(source, lineNumber, 'Ability syntax: +ability Внимательность 1.')
    return { type, ability: ability[1], value: Number(ability[2]) * (sign === '-' ? -1 : 1) }
  }
  if (type === 'trait') {
    if (raw.match(/^Авторитет\s+(-?\d+)$/)) return { type: 'reputation', value: Number(raw.match(/^Авторитет\s+(-?\d+)$/)[1]) * (sign === '-' ? -1 : 1) }
    const trait = raw.match(/^(.+?)\s+(-?\d+)$/)
    if (trait && abilities.has(trait[1])) return { type: 'ability', ability: trait[1], value: Number(trait[2]) * (sign === '-' ? -1 : 1) }
    if (!trait || !traits.has(trait[1])) fail(source, lineNumber, 'Trait syntax: +trait Смелость 1.')
    return { type, trait: traits.get(trait[1]), value: Number(trait[2]) * (sign === '-' ? -1 : 1) }
  }
  const relation = raw.match(/^(.+?)\s+(-?\d+)$/)
  if (!relation || !relationCharacters.has(relation[1])) fail(source, lineNumber, 'Unknown relation character or delta.')
  return { type, character: relation[1], value: Number(relation[2]) * (sign === '-' ? -1 : 1) }
}

function parseScript(input, source = 'quest', shouldValidate = true) {
  const rawLines = input.replace(/^\uFEFF/, '').split(/\r?\n/)
  const nodes = []
  let current = null
  let pending = {}

  const addLine = (speaker, text, line) => {
    if (!current || (current.type !== 'dialogue' && current.type !== 'phone' && current.type !== 'cosmetic')) fail(source, line, 'Dialogue line outside a dialogue block.')
    if (speaker === 'Все') { speaker = 'Рассказчик'; text = `Все: ${text}` }
    if (speaker === 'Охранник издалека') speaker = 'Охранник'
    if (!characters.has(speaker) && !(current.type === 'phone' && speaker === current.contact)) fail(source, line, `Unknown character "${speaker}".`)
    const meta = { ...pending }
    pending = {}
    current.lines.push({ speaker, text, ...meta, line })
  }
  const addOption = (text, line) => {
    if (!current || (current.type !== 'choice' && current.type !== 'cosmetic' && current.type !== 'extend-choice')) fail(source, line, 'Option outside a choice block.')
    current.options.push({ text, line, effects: [], requiresAll: [], requiresAny: [], requiresTraits: {}, requiresMoney: undefined })
  }
  const activeOption = (line) => {
    const option = current?.options.at(-1)
    if (!option) fail(source, line, 'Option directive without an option.')
    return option
  }
  const applyPendingToLastLine = (line) => {
    if (!Object.keys(pending).length) return
    const lastLine = current?.lines?.at(-1)
    if (!lastLine) fail(source, line, 'A *-next directive requires a preceding dialogue line.')
    if (pending.effects?.length) lastLine.effects = [...(lastLine.effects ?? []), ...pending.effects]
    if (pending.sound) lastLine.sound = pending.sound
    if (pending.cast) lastLine.cast = pending.cast
    if (pending.tone) lastLine.tone = pending.tone
    pending = {}
  }
  const finish = (line) => {
    if (!current) fail(source, line, 'Unexpected ::end.')
    applyPendingToLastLine(line)
    if ((current.type === 'dialogue' || current.type === 'phone') && !current.next && !current.end) fail(source, line, 'Dialogue requires @next or @end.')
    if ((current.type === 'choice' || current.type === 'cosmetic' || current.type === 'extend-choice') && current.options.length === 0) fail(source, line, 'Choice requires at least one option.')
    if (current.type === 'choice') current.options.forEach((option) => { if (!option.next) fail(source, option.line, 'Choice option requires -> target.') })
    if (current.type === 'cosmetic') {
      if (!current.continueTo) fail(source, line, 'Cosmetic choice requires @continue.')
      current.options.forEach((option) => { if (!option.reply?.length) fail(source, option.line, 'Cosmetic option requires at least one reply.') })
    }
    if (current.type === 'hook' && (!current.fallback || !current.continueTo)) fail(source, line, 'Hook requires @fallback and @continue.')
    if (current.type === 'extend' && !current.start) fail(source, line, 'Extension requires @start.')
    if (current.type === 'extend-choice') current.options.forEach((option) => { if (!option.next) fail(source, option.line, 'Choice option requires -> target.') })
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
      current = { type, id, line: lineNumber, lines: [], options: [], effects: [], routes: [], cast: undefined, next: undefined, end: false, whenAll: [], whenAny: [], unless: [], whenTraits: {}, whenReputation: undefined }
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
      if (directive === 'next') { applyPendingToLastLine(lineNumber); current.next = value; return }
      if (directive === 'end') { applyPendingToLastLine(lineNumber); current.end = true; return }
      if (directive === 'prompt') { current.prompt = value; return }
      if (directive === 'continue') { current.continueTo = value; return }
      if (directive === 'fallback') { if (current.type !== 'hook') fail(source, lineNumber, '@fallback is only available inside ::hook.'); current.fallback = value; return }
      if (directive === 'start') { if (current.type !== 'extend') fail(source, lineNumber, '@start is only available inside ::extend.'); current.start = value; return }
      if (directive === 'when') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when is only available inside extensions.'); current.whenAll.push(value); return }
      if (directive === 'when-all') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when-all is only available inside extensions.'); current.whenAll.push(...parts); return }
      if (directive === 'when-any') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when-any is only available inside extensions.'); current.whenAny.push(...parts); return }
      if (directive === 'when-trait') { if (current.type !== 'extend' && current.type !== 'extend-choice') fail(source, lineNumber, '@when-trait is only available inside extensions.'); const match = value.match(/^(.+?)\s+(-?\d+)$/); if (!match || !traits.has(match[1])) fail(source, lineNumber, '@when-trait syntax: @when-trait Смелость 4.'); current.whenTraits[traits.get(match[1])] = Number(match[2]); return }
      if (directive === 'when-reputation') { if (current.type !== 'extend-choice') fail(source, lineNumber, '@when-reputation is only available inside ::extend-choice.'); const match = value.match(/^(?:Авторитет\s+)?(-?\d+)$/); if (!match) fail(source, lineNumber, '@when-reputation syntax: @when-reputation Авторитет 3.'); current.whenReputation = Number(match[1]); return }
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
      if (directive === 'requires-trait') { const match = value.match(/^(.+?)\s+(-?\d+)$/); if (!match || !traits.has(match[1])) fail(source, lineNumber, '@requires-trait syntax: @requires-trait Смелость 4.'); activeOption(lineNumber).requiresTraits[traits.get(match[1])] = Number(match[2]); return }
      if (directive === 'requires-money') { const amount = Number(value); if (!Number.isFinite(amount) || amount < 0) fail(source, lineNumber, '@requires-money must be a non-negative number.'); activeOption(lineNumber).requiresMoney = amount; return }
      fail(source, lineNumber, `Unknown directive @${directive}.`)
    }

    if (line.startsWith('+') || line.startsWith('-trait ') || line.startsWith('-suspicion ') || line.startsWith('-reputation ')) { activeOption(lineNumber).effects.push(parseEffect(line, source, lineNumber)); return }
    if (line.startsWith('- ')) { addOption(line.slice(2).trim(), lineNumber); return }
    if (line.startsWith('->')) { activeOption(lineNumber).next = line.slice(2).trim(); return }
    if (line.startsWith('!->')) { activeOption(lineNumber).failNext = line.slice(3).trim(); return }
    if (line.startsWith('? ')) {
      const match = line.slice(2).match(/^(.+?)\s+(\d+)$/)
        if (!match || (!abilities.has(match[1]) && !traits.has(match[1]))) fail(source, lineNumber, 'Skill syntax: ? Харизма 3. or ? Смелость 3.')
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
        ...(Object.keys(extension.whenTraits).length ? { traits: extension.whenTraits } : {}),
        ...(extension.priority !== undefined ? { priority: extension.priority } : {}),
      }))
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
    target.branches = branches
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
      ...(Object.keys(extension.whenTraits).length ? { traits: extension.whenTraits } : {}),
      ...(extension.whenReputation !== undefined ? { reputation: extension.whenReputation } : {}),
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
    const effectGroups = node.options?.length ? node.options.map((option) => option.effects ?? []) : [allEffects(node)]
    effectGroups.forEach((effects) => {
      const ownership = effects.filter((effect) => effect.type === 'flag' && phoneOwnershipFlags.has(effect.value))
      if (new Set(ownership.map((effect) => effect.value)).size > 1) errors.push(`${source}:${node.line}: Conflicting black-phone ownership effects in one node.`)
    })
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
  const effectCode = (effect) => effect.type === 'flag' ? `flag(${quote(effect.value)})` : effect.type === 'item' ? `item(${quote(effect.value)})` : effect.type === 'ability' ? `ability(${quote(effect.ability)}, ${effect.value})` : effect.type === 'money' ? `money(${effect.value})` : effect.type === 'experience' ? `experience(${effect.value})` : effect.type === 'trait' ? `trait(${quote(effect.trait)}, ${effect.value})` : effect.type === 'suspicion' ? `suspicion(${effect.value})` : effect.type === 'reputation' ? `reputation(${effect.value})` : `relation(${quote(effect.character)}, ${effect.value})`
const runtimeCastFor = (cast, speaker) => {
  if (!cast?.length || speaker === 'Рассказчик' || speaker === 'Все') return []
  const members = [...new Set(cast.filter((character) => character !== 'Рассказчик' && character !== 'Все'))]
  const dmit = members.includes('Дмит') ? 'Дмит' : members[0]
  if (speaker === dmit) return [dmit, members.find((character) => character !== dmit)].filter(Boolean)
  return dmit ? [dmit, speaker] : [speaker]
}
const contextCode = (node, includeCast = true) => [
  node.background ? `...setBackground(${quote(node.background)})` : '',
  includeCast && node.cast?.length ? `cast: [${node.cast.slice(0, 2).map(quote).join(', ')}]` : '',
  node.tone ? `tone: ${quote(node.tone)}` : '',
].filter(Boolean).join(',\n    ')
const lineCode = (line, phone, nodeCast) => {
  const extras = []
  const cast = phone ? [] : runtimeCastFor(line.cast ?? nodeCast, line.speaker)
  if (cast.length) extras.push(`cast: [${cast.map(quote).join(', ')}]`)
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
  if (Object.keys(option.requiresTraits ?? {}).length) requirements.push(...Object.entries(option.requiresTraits).map(([trait, value]) => `requiresTrait(${quote(trait)}, ${value})`))
  if (option.requiresMoney !== undefined) requirements.push(`requiresMoney(${option.requiresMoney})`)
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
      if (option.skill && option.failNext) imported.add('skill')
      if (option.requiresAll?.length) imported.add('requiresAllFlags')
      if (option.requiresAny?.length) imported.add('requiresAnyFlag')
      if (Object.keys(option.requiresTraits ?? {}).length) imported.add('requiresTrait')
      if (option.requiresMoney !== undefined) imported.add('requiresMoney')
    })
    allEffects(node).forEach((effect) => imported.add(effect.type))
  })
  const nodeCode = nodes.map((node) => {
    if (node.type === 'route') return `route({\n    id: ${quote(node.id)},\n    routes: [${node.routes.map((item) => `[${quote(item.flag)}, ${quote(item.next)}]`).join(', ')}],\n    fallback: ${quote(node.fallback)},\n  })`
    if (node.type === 'hook') return `hook({\n    id: ${quote(node.id)},\n    fallback: ${quote(node.fallback)},\n    branches: [${node.branches.map((branch) => `{ start: ${quote(branch.start)}${branch.allFlags?.length ? `, allFlags: [${branch.allFlags.map(quote).join(', ')}]` : ''}${branch.anyFlags?.length ? `, anyFlags: [${branch.anyFlags.map(quote).join(', ')}]` : ''}${branch.unlessFlags?.length ? `, unlessFlags: [${branch.unlessFlags.map(quote).join(', ')}]` : ''}${branch.traits ? `, traits: ${JSON.stringify(branch.traits)}` : ''}${branch.priority !== undefined ? `, priority: ${branch.priority}` : ''} }`).join(', ')}],\n  })`
    if (node.type === 'dialogue' || node.type === 'phone') {
      const phone = node.type === 'phone' ? { contact: node.contact, time: node.time } : null
      const context = contextCode(node, false)
      let notified = false
      const lines = node.lines.map((line) => {
        const phoneLine = phone && line.speaker !== 'Дмит' ? { ...phone } : phone
        const withNotify = node.type === 'phone' && !notified && line.speaker !== 'Дмит' && node.notify ? { ...line, sound: node.notify } : line
        if (node.type === 'phone' && line.speaker !== 'Дмит') notified = true
        return lineCode(withNotify, phoneLine, node.cast)
      })
      return `dialogue({\n    id: ${quote(node.id)},\n${context ? `    ${context},\n` : ''}    lines: [\n      ${lines.join(',\n      ')},\n    ],${node.next ? `\n    next: ${quote(node.next)},` : ''}${node.end ? '\n    end: true,' : ''}\n  })`
    }
    if (node.type === 'choice') {
      const context = contextCode(node)
      const optionsCode = node.options.map((option) => `      { text: ${quote(option.text)}${option.say ? `, say: ${quote(option.say)}` : ''}${option.narration ? `, narration: ${quote(option.narration)}` : ''}, next: ${quote(option.next)}${option.failNext ? `, failNext: ${quote(option.failNext)}` : ''}${option.skill && option.failNext ? `, check: skill(${quote(option.skill.stat)}, ${option.skill.value})` : ''}${requirementsCode(option)}${option.visibleWhen ? `, visibleWhen: ${JSON.stringify(option.visibleWhen)}` : ''}${option.effects.length ? `, effects: [${option.effects.map(effectCode).join(', ')}]` : ''} }`).join(',\n')
      return `choice({\n    id: ${quote(node.id)},\n    speaker: 'Дмит',\n    prompt: ${quote(node.prompt)},\n${context ? `    ${context},\n` : ''}    options: [\n${optionsCode}\n    ],\n  })`
    }
    const context = contextCode(node)
    const optionCode = node.options.map((option) => `      { text: ${quote(option.text)}, reply: [${option.reply.map((line) => lineCode(line, null, node.cast)).join(', ')}]${option.effects.length ? `, effects: [${option.effects.map(effectCode).join(', ')}]` : ''} }`).join(',\n')
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
