import type {
  Ability,
  Character,
  ChoiceTimer,
  Emotion,
  PhoneMessage,
  PersonalityTrait,
  PersonalityTraits,
  RelationCharacter,
  Scene,
  SceneEffect,
  SceneSound,
  StoryChoice,
} from '../types/story'

type Cast = readonly [Character] | readonly [Character, Character]
type Tone = NonNullable<Scene['tone']>
type Background = NonNullable<Scene['background']>
type Music = NonNullable<Scene['music']>

type Effect =
  | { kind: 'flag'; name: string }
  | { kind: 'item'; id: string }
  | { kind: 'ability'; ability: Ability; delta: number }
  | { kind: 'relation'; character: RelationCharacter; delta: number }
  | { kind: 'money'; delta: number }
  | { kind: 'experience'; delta: number }
  | { kind: 'trait'; trait: PersonalityTrait; delta: number }
  | { kind: 'suspicion'; delta: number }
  | { kind: 'reputation'; delta: number }

type Context = {
  background?: Background
  cast?: Cast
  leftEmotion?: Emotion
  rightEmotion?: Emotion
  tone?: Tone
  sound?: SceneSound
  music?: Music
  phoneMessage?: PhoneMessage
  /** Compatibility for authored phone conversations; compiles to an incoming message. */
  phone?: { contact: string; time?: string }
  effects?: SceneEffect | readonly Effect[]
  transition?: Scene['transition']
}

type DialogueSpeaker = Character | string

type DialogueLine =
  | readonly [DialogueSpeaker, string]
  | readonly [DialogueSpeaker, string, Cast | Context]

type SkillCheck =
  | { kind: 'ability'; stat: Ability; value: number }
  | { kind: 'trait'; trait: PersonalityTrait; value: number }

type Requirement =
  | { kind: 'flags-all'; flags: readonly string[] }
  | { kind: 'flags-any'; flags: readonly string[] }
  | { kind: 'money'; amount: number }
  | { kind: 'trait'; trait: PersonalityTrait; value: number }

type FlagVisibility = {
  allFlags?: string[]
  anyFlags?: string[]
  unlessFlags?: string[]
  traits?: Partial<PersonalityTraits>
  reputation?: number
}

type Option = {
  text: string
  shortText?: string
  say?: string
  narration?: string
  next: string
  failNext?: string
  check?: SkillCheck
  require?: Requirement | readonly Requirement[]
  runtimeRequires?: StoryChoice['requires']
  runtimeRequiresMoney?: number
  runtimeRequiresFlags?: string[]
  runtimeRequiresAnyFlags?: string[]
  effects?: readonly Effect[]
  sceneEffects?: SceneEffect
  failureEffects?: readonly Effect[]
  failureSceneEffects?: SceneEffect
  failureText?: string
  visibleWhen?: FlagVisibility
}

type DialogueNode = Context & {
  kind: 'dialogue'
  id: string
  lines: readonly DialogueLine[]
  next?: string
  end?: boolean
  routes?: readonly { flag: string; next: string }[]
  fallback?: string
}

type ChoiceNode = Context & {
  kind: 'choice' | 'timed-choice'
  id: string
  speaker?: Character
  prompt: string
  options: readonly Option[]
  durationSeconds?: number
  defaultOptionIndex?: number
}

type CosmeticOption = {
  text: string
  shortText?: string
  reply: readonly DialogueLine[]
  effects?: readonly Effect[]
}

type CosmeticChoiceNode = Context & {
  kind: 'cosmetic-choice'
  id: string
  speaker?: Character
  prompt: string
  options: readonly CosmeticOption[]
  continueTo: string
}

type RouteNode = {
  kind: 'route'
  id: string
  routes: readonly { flag: string; next: string }[]
  fallback: string
}

type HookBranch = FlagVisibility & {
  start: string
  priority?: number
}

type HookNode = {
  kind: 'hook'
  id: string
  fallback: string
  branches: readonly HookBranch[]
}

type RouteInput = { flag: string; next: string } | readonly [string, string]

type QuestNode = DialogueNode | ChoiceNode | CosmeticChoiceNode | RouteNode | HookNode

type QuestDefinition = {
  id: string
  start: string
  defaults?: Context
  nodes: readonly QuestNode[]
  allowUnreachable?: boolean
}

type PublicDialogueInput = Omit<DialogueNode, 'kind'>
type PublicChoiceInput = Omit<ChoiceNode, 'kind' | 'durationSeconds' | 'defaultOptionIndex'>
type PublicTimedChoiceInput = Omit<ChoiceNode, 'kind'> & {
  durationSeconds: number
  defaultOptionIndex?: number
}
type PublicCosmeticChoiceInput = Omit<CosmeticChoiceNode, 'kind'>
type PublicRouteInput = Omit<RouteNode, 'kind' | 'routes'> & { routes: readonly RouteInput[] }
type PublicHookInput = Omit<HookNode, 'kind'>

type GeneratedScene = Scene & { id: string }

const isCast = (value: Cast | Context): value is Cast => Array.isArray(value)
const isEffectList = (value: Context['effects']): value is readonly Effect[] => Array.isArray(value)
const isRouteTuple = (value: RouteInput): value is readonly [string, string] => Array.isArray(value)

const contextFrom = (defaults: Context | undefined, node: Context, line?: Context): Context => ({
  ...defaults,
  ...node,
  ...line,
})

const toSceneContext = (context: Context): Pick<Scene, 'left' | 'right' | 'leftEmotion' | 'rightEmotion' | 'tone' | 'background' | 'sound' | 'music' | 'phoneMessage' | 'effects' | 'transition'> => ({
  ...(context.cast ? { left: context.cast[0], right: context.cast[1] } : {}),
  ...(context.leftEmotion ? { leftEmotion: context.leftEmotion } : {}),
  ...(context.rightEmotion ? { rightEmotion: context.rightEmotion } : {}),
  ...(context.tone ? { tone: context.tone } : {}),
  ...(context.background ? { background: context.background } : {}),
  ...(context.sound ? { sound: context.sound } : {}),
  ...(context.music ? { music: context.music } : {}),
  ...(context.phoneMessage || context.phone ? {
    phoneMessage: context.phoneMessage ?? {
      contact: context.phone!.contact,
      direction: 'incoming',
      ...(context.phone!.time ? { time: context.phone!.time } : {}),
    },
  } : {}),
  ...(context.effects ? { effects: isEffectList(context.effects) ? mergeEffects(context.effects) : context.effects } : {}),
  ...(context.transition ? { transition: context.transition } : {}),
})

const mergeEffects = (effects: readonly Effect[] | undefined): SceneEffect | undefined => {
  if (!effects?.length) return undefined
  const result: SceneEffect = {}
  for (const effect of effects) {
    if (effect.kind === 'flag') result.flags = [...(result.flags ?? []), effect.name]
    if (effect.kind === 'item') result.items = [...(result.items ?? []), effect.id]
    if (effect.kind === 'ability') result.abilities = { ...(result.abilities ?? {}), [effect.ability]: (result.abilities?.[effect.ability] ?? 0) + effect.delta }
    if (effect.kind === 'money') result.money = (result.money ?? 0) + effect.delta
    if (effect.kind === 'experience') result.experience = (result.experience ?? 0) + effect.delta
    if (effect.kind === 'reputation') result.reputation = (result.reputation ?? 0) + effect.delta
    if (effect.kind === 'suspicion') result.suspicion = (result.suspicion ?? 0) + effect.delta
    if (effect.kind === 'trait') result.traits = { ...(result.traits ?? {}), [effect.trait]: (result.traits?.[effect.trait] ?? 0) + effect.delta }
    if (effect.kind === 'relation') {
      result.relations = { ...(result.relations ?? {}), [effect.character]: (result.relations?.[effect.character] ?? 0) + effect.delta }
    }
  }
  return result
}

const requirementsToChoice = (requirements: Requirement | readonly Requirement[] | undefined): Pick<StoryChoice, 'requiresMoney' | 'requiresFlags' | 'requiresAnyFlags' | 'requiresTraits'> => {
  const all = !requirements ? [] : Array.isArray(requirements) ? requirements : [requirements]
  const flags = all.filter((item): item is Extract<Requirement, { kind: 'flags-all' }> => item.kind === 'flags-all').flatMap((item) => item.flags)
  const anyFlags = all.filter((item): item is Extract<Requirement, { kind: 'flags-any' }> => item.kind === 'flags-any').flatMap((item) => item.flags)
  const moneyRequirement = all.find((item): item is Extract<Requirement, { kind: 'money' }> => item.kind === 'money')
  const traits = all.filter((item): item is Extract<Requirement, { kind: 'trait' }> => item.kind === 'trait')
  // The runtime only has an all-flags condition. Keep any-flags in DSL validation/docs until the engine gains a matching field.
  return {
    ...(flags.length ? { requiresFlags: flags } : {}),
    ...(anyFlags.length ? { requiresAnyFlags: anyFlags } : {}),
    ...(moneyRequirement ? { requiresMoney: moneyRequirement.amount } : {}),
    ...(traits.length ? { requiresTraits: Object.fromEntries(traits.map((item) => [item.trait, item.value])) } : {}),
  }
}

const optionTargets = (option: Option): string[] => [option.next, ...(option.failNext ? [option.failNext] : [])]

const nodeTargets = (node: QuestNode): string[] => {
  if (node.kind === 'dialogue') return [...(node.next ? [node.next] : []), ...(node.routes?.map((route) => route.next) ?? []), ...(node.fallback ? [node.fallback] : [])]
  if (node.kind === 'route') return [...node.routes.map((route) => route.next), node.fallback]
  if (node.kind === 'hook') return [node.fallback, ...node.branches.map((branch) => branch.start)]
  if (node.kind === 'cosmetic-choice') return [node.continueTo]
  return node.options.flatMap(optionTargets)
}

const generatedIdsFor = (node: QuestNode): string[] => {
  if (node.kind === 'dialogue') return node.lines.map((_, index) => index === 0 ? node.id : `${node.id}__${index}`)
  if (node.kind !== 'cosmetic-choice') return [node.id]
  return [
    node.id,
    ...node.options.flatMap((option, optionIndex) => option.reply.map((_, lineIndex) => `${node.id}__option_${optionIndex}${lineIndex ? `__${lineIndex}` : ''}`)),
  ]
}

const message = (quest: QuestDefinition, node: QuestNode, detail: string) => `Quest "${quest.id}"\nNode "${node.id}"\n${detail}`

export const defineQuest = (quest: QuestDefinition): QuestDefinition => quest
export const dialogue = (node: PublicDialogueInput): DialogueNode => ({ kind: 'dialogue', ...node })
export const choice = (node: PublicChoiceInput): ChoiceNode => ({ kind: 'choice', ...node })
export const cosmeticChoice = (node: PublicCosmeticChoiceInput): CosmeticChoiceNode => ({ kind: 'cosmetic-choice', ...node })
export const timedChoice = (node: PublicTimedChoiceInput): ChoiceNode => ({ kind: 'timed-choice', ...node })
export const route = (node: PublicRouteInput): RouteNode => ({
  kind: 'route',
  ...node,
  routes: node.routes.map((item): { flag: string; next: string } => isRouteTuple(item) ? { flag: item[0], next: item[1] } : item),
})
export const hook = (node: PublicHookInput): HookNode => ({ kind: 'hook', ...node })
/**
 * Marks a location change. The compiler emits it once; the story screen keeps
 * the last emitted background until another node calls setBackground().
 */
export const setBackground = (background: Background): Pick<Context, 'background'> => ({ background })
const localizedAbilityNames: Record<string, Ability> = {
  'Сила': 'strength',
  'Внимательность': 'perception',
  'Выносливость': 'endurance',
  'Харизма': 'charisma',
  'Интеллект': 'intelligence',
  'Ловкость': 'agility',
  'Удача': 'luck',
}

const localizedTraitNames: Record<string, PersonalityTrait> = {
  'Характер': 'courage',
  'Смелость': 'courage',
  'Самообладание': 'composure',
  'Ответственность': 'responsibility',
  'Товарищество': 'camaraderie',
  'Хитрость': 'cunning',
  'Эмпатия': 'empathy',
}

export const skill = (stat: Ability | PersonalityTrait | keyof typeof localizedAbilityNames | keyof typeof localizedTraitNames, value: number): SkillCheck => {
  const traitName = localizedTraitNames[stat]
  if (traitName) return { kind: 'trait', trait: traitName, value }
  return { kind: 'ability', stat: localizedAbilityNames[stat] ?? stat as Ability, value }
}
export const flag = (name: string): Effect => ({ kind: 'flag', name })
export const item = (id: string): Effect => ({ kind: 'item', id })
export const ability = (value: Ability | keyof typeof localizedAbilityNames, delta: number): Effect => ({ kind: 'ability', ability: localizedAbilityNames[value] ?? value as Ability, delta })
export const relation = (character: RelationCharacter, delta: number): Effect => ({ kind: 'relation', character, delta })
export const money = (delta: number): Effect => ({ kind: 'money', delta })
export const experience = (delta: number): Effect => ({ kind: 'experience', delta })
export const trait = (value: PersonalityTrait, delta: number): Effect => ({ kind: 'trait', trait: value, delta })
export const suspicion = (delta: number): Effect => ({ kind: 'suspicion', delta })
export const reputation = (delta: number): Effect => ({ kind: 'reputation', delta })
export const requiresFlag = (name: string): Requirement => ({ kind: 'flags-all', flags: [name] })
export const requiresAllFlags = (...flags: string[]): Requirement => ({ kind: 'flags-all', flags })
export const requiresAnyFlag = (...flags: string[]): Requirement => ({ kind: 'flags-any', flags })
export const requiresMoney = (amount: number): Requirement => ({ kind: 'money', amount })
export const requiresTrait = (trait: PersonalityTrait, value: number): Requirement => ({ kind: 'trait', trait, value })

export const validateQuest = (quest: QuestDefinition): void => {
  const ids = new Set<string>()
  const errors: string[] = []
  const validAbilities = new Set<Ability>(['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'])

  for (const node of quest.nodes) {
    if (ids.has(node.id)) errors.push(message(quest, node, 'Duplicate node id.'))
    ids.add(node.id)
    if (node.kind === 'dialogue' && node.lines.length === 0) errors.push(message(quest, node, 'Dialogue must contain at least one line.'))
    if (node.kind === 'dialogue' && !node.next && !node.routes?.length && !node.fallback && !node.end) errors.push(message(quest, node, 'Missing next target or end marker.'))
    if (node.kind === 'choice' || node.kind === 'timed-choice') {
      if (node.options.length === 0) errors.push(message(quest, node, 'Choice must contain at least one option.'))
      if (node.kind === 'timed-choice') {
        if (!node.durationSeconds || node.durationSeconds <= 0) errors.push(message(quest, node, 'Timed choice durationSeconds must be greater than zero.'))
        if (node.defaultOptionIndex !== undefined && (node.defaultOptionIndex < 0 || node.defaultOptionIndex >= node.options.length)) errors.push(message(quest, node, 'Timed choice defaultOptionIndex is out of range.'))
      }
      node.options.forEach((option, index) => {
        if (option.check && ((!('trait' in option.check) && !validAbilities.has(option.check.stat)) || !Number.isFinite(option.check.value) || option.check.value <= 0)) errors.push(message(quest, node, `Option ${index + 1} "${option.text}": invalid skill value.`))
        if (option.check && !option.failNext) errors.push(message(quest, node, `Option ${index + 1} "${option.text}": skill check requires failNext.`))
      })
    }
    if (node.kind === 'cosmetic-choice') {
      if (!node.continueTo) errors.push(message(quest, node, 'Cosmetic choice requires continueTo.'))
      if (node.options.length === 0) errors.push(message(quest, node, 'Cosmetic choice must contain at least one option.'))
    }
    if ((node.kind === 'route' || node.kind === 'hook') && !node.fallback) errors.push(message(quest, node, 'Route requires fallback.'))
  }

  if (!ids.has(quest.start)) errors.push(`Quest "${quest.id}"\nMissing start node: "${quest.start}".`)
  const generated = new Map<string, QuestNode>()
  for (const node of quest.nodes) {
    for (const generatedId of generatedIdsFor(node)) {
      const owner = generated.get(generatedId)
      if (owner && owner !== node) errors.push(message(quest, node, `Generated scene id conflict: "${generatedId}" with node "${owner.id}".`))
      generated.set(generatedId, node)
      if (generatedId !== node.id && ids.has(generatedId)) errors.push(message(quest, node, `Generated scene id conflicts with node id: "${generatedId}".`))
    }
  }
  for (const node of quest.nodes) {
    if (node.kind === 'choice' || node.kind === 'timed-choice') {
      node.options.forEach((option, index) => optionTargets(option).forEach((target) => {
        if (!ids.has(target)) errors.push(message(quest, node, `Option ${index + 1} "${option.text}"\nUnknown target: "${target}".`))
      }))
    } else {
      nodeTargets(node).forEach((target) => {
        if (!ids.has(target)) errors.push(message(quest, node, `Unknown target: "${target}".`))
      })
    }
  }

  if (ids.has(quest.start)) {
    const reachable = new Set<string>([quest.start])
    const queue = [quest.start]
    while (queue.length) {
      const id = queue.shift()
      const node = quest.nodes.find((candidate) => candidate.id === id)
      if (!node) continue
      for (const target of nodeTargets(node)) {
        if (!reachable.has(target)) {
          reachable.add(target)
          queue.push(target)
        }
      }
    }
    if (!quest.allowUnreachable) {
      for (const node of quest.nodes) if (!reachable.has(node.id)) errors.push(message(quest, node, 'Unreachable node.'))
    }
  }

  if (errors.length) throw new Error(errors.join('\n\n'))
}

export const compileQuest = (startIndex: number, quest: QuestDefinition): Scene[] => {
  validateQuest(quest)
  const drafts: GeneratedScene[] = []
  const sceneIdToIndex = new Map<string, number>()
  const nodeEntry = new Map<string, string>()
  const add = (scene: GeneratedScene) => {
    // A quest default is an initial state, not a command to redraw every line.
    // This keeps backgrounds persistent and makes location changes explicit.
    if (drafts.length > 0 && scene.background === quest.defaults?.background) delete scene.background
    sceneIdToIndex.set(scene.id, drafts.length)
    drafts.push(scene)
  }

  for (const node of quest.nodes) {
    const base = contextFrom(quest.defaults, node.kind === 'route' || node.kind === 'hook' ? {} : node)
    if (node.kind === 'dialogue') {
      nodeEntry.set(node.id, node.id)
      node.lines.forEach((line, index) => {
        const [speaker, text, extension] = line
        const lineContext = extension && !isCast(extension) ? extension : undefined
        const cast = extension && isCast(extension) ? extension : undefined
        const id = index === 0 ? node.id : `${node.id}__${index}`
        add({ id, speaker: speaker as Character, text, ...toSceneContext(contextFrom(base, { ...(cast ? { cast } : {}) }, lineContext)) })
      })
    } else if (node.kind === 'cosmetic-choice') {
      nodeEntry.set(node.id, node.id)
      add({ id: node.id, speaker: node.speaker ?? 'Рассказчик', text: node.prompt, ...toSceneContext(base) })
      node.options.forEach((option, optionIndex) => {
        option.reply.forEach((line, lineIndex) => {
          const [speaker, text, extension] = line
          const lineContext = extension && !isCast(extension) ? extension : undefined
          const cast = extension && isCast(extension) ? extension : undefined
          const id = `${node.id}__option_${optionIndex}${lineIndex ? `__${lineIndex}` : ''}`
          add({ id, speaker: speaker as Character, text, ...toSceneContext(contextFrom(base, { ...(cast ? { cast } : {}) }, lineContext)) })
        })
      })
    } else {
      nodeEntry.set(node.id, node.id)
      add({
        id: node.id,
        speaker: node.kind === 'route' || node.kind === 'hook' ? 'Рассказчик' : node.speaker ?? 'Рассказчик',
        text: node.kind === 'route' || node.kind === 'hook' ? '' : node.prompt,
        ...(node.kind === 'route' || node.kind === 'hook' ? { autoRoute: true } : {}),
        ...toSceneContext(base),
      })
    }
  }

  const resolve = (target: string): number => {
    const id = nodeEntry.get(target)
    if (!id) throw new Error(`Quest "${quest.id}": compiler could not resolve "${target}".`)
    const index = sceneIdToIndex.get(id)
    if (index === undefined) throw new Error(`Quest "${quest.id}": compiler could not index "${target}".`)
    return startIndex + index
  }
  const at = (id: string): GeneratedScene => {
    const index = sceneIdToIndex.get(id)
    if (index === undefined) throw new Error(`Quest "${quest.id}": compiler could not find generated scene "${id}".`)
    return drafts[index]
  }
  const compileOption = (option: Option): StoryChoice => ({
    label: option.text,
    ...(option.shortText ? { shortLabel: option.shortText } : {}),
    ...(option.say ? { say: option.say } : {}),
    ...(option.narration ? { narration: option.narration } : {}),
    next: resolve(option.next),
    ...(option.failNext ? { failNext: resolve(option.failNext) } : {}),
    ...(option.runtimeRequires ?? (option.check && option.check.kind === 'ability' ? { [option.check.stat]: option.check.value } : undefined) ? { requires: option.runtimeRequires ?? (option.check && option.check.kind === 'ability' ? { [option.check.stat]: option.check.value } : undefined) } : {}),
    ...(option.check?.kind === 'trait' ? { traitCheck: { [option.check.trait]: option.check.value } } : {}),
    ...(option.visibleWhen ? { visibleWhen: option.visibleWhen } : {}),
    ...requirementsToChoice(option.require),
    ...(option.runtimeRequiresMoney !== undefined ? { requiresMoney: option.runtimeRequiresMoney } : {}),
    ...(option.runtimeRequiresFlags?.length ? { requiresFlags: option.runtimeRequiresFlags } : {}),
    ...(option.runtimeRequiresAnyFlags?.length ? { requiresAnyFlags: option.runtimeRequiresAnyFlags } : {}),
    ...(option.sceneEffects ?? mergeEffects(option.effects) ? { effects: option.sceneEffects ?? mergeEffects(option.effects) } : {}),
    ...(option.failureSceneEffects ?? mergeEffects(option.failureEffects) ? { failureEffects: option.failureSceneEffects ?? mergeEffects(option.failureEffects) } : {}),
    ...(option.failureText ? { failureText: option.failureText } : {}),
  })

  for (const node of quest.nodes) {
    if (node.kind === 'dialogue') {
      node.lines.forEach((_, index) => {
        const id = index === 0 ? node.id : `${node.id}__${index}`
        const scene = at(id)
        if (index < node.lines.length - 1) scene.next = startIndex + (sceneIdToIndex.get(`${node.id}__${index + 1}`) ?? 0)
        else if (node.next) scene.next = resolve(node.next)
        if (index === node.lines.length - 1 && node.routes) scene.nextByFlag = node.routes.map((item) => ({ flag: item.flag, next: resolve(item.next) }))
        if (index === node.lines.length - 1 && node.fallback) scene.fallbackNext = resolve(node.fallback)
      })
    }
    if (node.kind === 'choice' || node.kind === 'timed-choice') {
      const scene = at(node.id)
      scene.choices = node.options.map(compileOption)
      if (node.kind === 'timed-choice') {
        const timer: ChoiceTimer = { durationSeconds: node.durationSeconds ?? 0, ...(node.defaultOptionIndex !== undefined ? { defaultChoiceIndex: node.defaultOptionIndex } : {}) }
        scene.choiceTimer = timer
      }
    }
    if (node.kind === 'cosmetic-choice') {
      const scene = at(node.id)
      scene.choices = node.options.map((option, optionIndex) => ({
        label: option.text,
        ...(option.shortText ? { shortLabel: option.shortText } : {}),
        next: startIndex + (sceneIdToIndex.get(`${node.id}__option_${optionIndex}`) ?? 0),
        ...(mergeEffects(option.effects) ? { effects: mergeEffects(option.effects) } : {}),
      }))
      node.options.forEach((option, optionIndex) => {
        option.reply.forEach((_, lineIndex) => {
          const id = `${node.id}__option_${optionIndex}${lineIndex ? `__${lineIndex}` : ''}`
          const replyScene = at(id)
          replyScene.next = lineIndex < option.reply.length - 1
            ? startIndex + (sceneIdToIndex.get(`${node.id}__option_${optionIndex}__${lineIndex + 1}`) ?? 0)
            : resolve(node.continueTo)
        })
      })
    }
    if (node.kind === 'route') {
      const scene = at(node.id)
      scene.nextByFlag = node.routes.map((item) => ({ flag: item.flag, next: resolve(item.next) }))
      scene.fallbackNext = resolve(node.fallback)
    }
    if (node.kind === 'hook') {
      const scene = at(node.id)
      scene.conditionalNext = [...node.branches]
        .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
        .map((branch) => ({
          next: resolve(branch.start),
          ...(branch.allFlags?.length ? { allFlags: branch.allFlags } : {}),
          ...(branch.anyFlags?.length ? { anyFlags: branch.anyFlags } : {}),
          ...(branch.unlessFlags?.length ? { unlessFlags: branch.unlessFlags } : {}),
          ...(branch.traits ? { traits: branch.traits } : {}),
          ...(branch.priority !== undefined ? { priority: branch.priority } : {}),
        }))
      scene.fallbackNext = resolve(node.fallback)
    }
  }

  return drafts.map(({ id: _id, ...scene }) => scene)
}
