import { useMemo } from 'react'
import dagre from '@dagrejs/dagre'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Chapter, Scene } from '../types/story'

type DebugQuestGraphProps = {
  chapter: Chapter
  currentSceneIndex: number
  startIndex: number
  endIndex: number
  onSelectStage: (sceneIndex: number) => void
  fullscreen: boolean
  onToggleFullscreen: () => void
}

type GraphNodeData = {
  startIndex: number
  endIndex: number
  title: string
  speaker: string
  text: string
  current: boolean
  branchCount: number
}

type Stage = {
  id: string
  startIndex: number
  endIndex: number
  scene: Scene
  targets: GraphTarget[]
}

type GraphTarget = {
  target: number
  label?: string
  kind: 'next' | 'choice' | 'failure' | 'condition' | 'result'
}

const nodeWidth = 244
const nodeHeight = 94

function QuestStageNode({ data }: NodeProps) {
  const stage = data as GraphNodeData
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <strong>{stage.title}</strong>
      <span>{stage.speaker}</span>
      <small>{stage.text}</small>
      {stage.branchCount > 1 && <i>{stage.branchCount} перехода</i>}
      <Handle type="source" position={Position.Right} />
    </>
  )
}

const nodeTypes: NodeTypes = { quest: QuestStageNode }

const shorten = (text: string, length: number) => text.length <= length
  ? text
  : `${text.slice(0, length).trimEnd()}…`

const logicalStageId = (scene: Scene, index: number) => {
  if (!scene.id) return `scene-${index}`
  return scene.id.replace(/__(?:\d+|option_\d+(?:__\d+)?)$/, '')
}

const targetsFor = (scene: Scene): GraphTarget[] => [
  ...(scene.next === undefined ? [] : [{ target: scene.next, kind: 'next' as const }]),
  ...(scene.fallbackNext === undefined ? [] : [{ target: scene.fallbackNext, label: 'иначе', kind: 'condition' as const }]),
  ...(scene.nextByFlag ?? []).map((route) => ({ target: route.next, label: route.flag, kind: 'condition' as const })),
  ...(scene.conditionalNext ?? []).map((route) => ({ target: route.next, label: [...(route.allFlags ?? []), ...(route.anyFlags ?? [])].join(' | ') || 'условие', kind: 'condition' as const })),
  ...(scene.choices ?? []).flatMap((choice, index) => [
    { target: choice.next, label: `${index + 1}. ${shorten(choice.shortLabel ?? choice.label, 34)}`, kind: 'choice' as const },
    ...(choice.failNext === undefined ? [] : [{ target: choice.failNext, label: `неудача: ${shorten(choice.shortLabel ?? choice.label, 25)}`, kind: 'failure' as const }]),
  ]),
  ...(scene.choiceTimer?.defaultNext === undefined ? [] : [{ target: scene.choiceTimer.defaultNext, label: 'таймер', kind: 'result' as const }]),
  ...(scene.quiz?.results.flatMap((result) => [{ target: result.next, label: `оценка ${result.grade}`, kind: 'result' as const }]) ?? []),
  ...(scene.cheatGame ? [
    { target: scene.cheatGame.successNext, label: 'контрольная: успех', kind: 'result' as const },
    { target: scene.cheatGame.failNext, label: 'контрольная: провал', kind: 'failure' as const },
  ] : []),
  ...(scene.roachGame ? [
    { target: scene.roachGame.successNext, label: 'игра: успех', kind: 'result' as const },
    { target: scene.roachGame.failNext, label: 'игра: провал', kind: 'failure' as const },
  ] : []),
]

function createGraph(chapter: Chapter, currentSceneIndex: number, startIndex: number, endIndex: number): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const stagesById = new Map<string, Stage>()
  const sceneToStageId = new Map<number, string>()

  chapter.scenes.forEach((scene, index) => {
    if (index < startIndex || index > endIndex) return
    const id = logicalStageId(scene, index)
    sceneToStageId.set(index, id)
    const existing = stagesById.get(id)
    if (existing) {
      existing.endIndex = index
      return
    }
    stagesById.set(id, { id, startIndex: index, endIndex: index, scene, targets: [] })
  })

  chapter.scenes.forEach((scene, index) => {
    if (index < startIndex || index > endIndex) return
    const sourceId = sceneToStageId.get(index)
    const stage = sourceId ? stagesById.get(sourceId) : undefined
    if (!stage) return
    targetsFor(scene).forEach((target) => {
      const targetId = sceneToStageId.get(target.target)
      if (!targetId || targetId === stage.id) return
      if (!stage.targets.some((item) => item.target === target.target && item.label === target.label && item.kind === target.kind)) {
        stage.targets.push(target)
      }
    })
  })

  const stages = [...stagesById.values()]
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', ranksep: 96, nodesep: 42, marginx: 34, marginy: 36 })
  stages.forEach((stage) => graph.setNode(stage.id, { width: nodeWidth, height: nodeHeight }))
  stages.forEach((stage) => stage.targets.forEach((target) => {
    const targetId = sceneToStageId.get(target.target)
    if (targetId) graph.setEdge(stage.id, targetId)
  }))
  dagre.layout(graph)

  const currentStageId = sceneToStageId.get(currentSceneIndex)
  const nodes = stages.map((stage) => {
    const position = graph.node(stage.id) as { x: number; y: number }
    const firstText = stage.scene.text || (stage.scene.autoRoute ? 'Автопереход по условию' : 'Пустая реплика')
    return {
      id: stage.id,
      position: { x: position.x - nodeWidth / 2, y: position.y - nodeHeight / 2 },
      data: {
        startIndex: stage.startIndex,
        endIndex: stage.endIndex,
        title: stage.id,
        speaker: stage.scene.autoRoute ? 'Системный переход' : stage.scene.speaker,
        text: shorten(firstText, 86),
        current: stage.id === currentStageId,
        branchCount: stage.targets.length,
      },
      type: 'quest',
      className: `quest-graph-node ${stage.id === currentStageId ? 'current' : ''} ${stage.targets.length > 1 ? 'branch' : ''}`,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })

  const edges: Edge[] = []
  stages.forEach((stage) => stage.targets.forEach((target, index) => {
    const targetId = sceneToStageId.get(target.target)
    if (!targetId) return
    const tone = target.kind === 'failure' ? 'failure' : target.kind === 'condition' ? 'condition' : target.kind === 'choice' ? 'choice' : 'result'
    edges.push({
      id: `${stage.id}-${targetId}-${target.kind}-${index}`,
      source: stage.id,
      target: targetId,
      label: target.label,
      type: 'smoothstep',
      animated: stage.id === currentStageId,
      className: `quest-graph-edge ${tone}`,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    })
  }))

  return { nodes, edges }
}

export function DebugQuestGraph({ chapter, currentSceneIndex, startIndex, endIndex, onSelectStage, fullscreen, onToggleFullscreen }: DebugQuestGraphProps) {
  const { nodes, edges } = useMemo(
    () => createGraph(chapter, currentSceneIndex, startIndex, endIndex),
    [chapter, currentSceneIndex, endIndex, startIndex],
  )

  return (
    <div className="debug-quest-graph" aria-label="Граф путей квеста">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: .16, maxZoom: .85 }}
        minZoom={.08}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => onSelectStage((node.data as GraphNodeData).startIndex)}
      >
        <Background gap={18} size={1} color="rgba(255, 228, 192, .14)" />
        <MiniMap pannable zoomable nodeColor={(node) => node.className?.includes('current') ? '#efb363' : '#775667'} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <button className="quest-graph-fullscreen" onClick={onToggleFullscreen}>
        {fullscreen ? 'Свернуть граф' : 'На весь экран'}
      </button>
      <div className="quest-graph-legend"><span className="current" /> Текущий этап <span className="choice" /> Выбор <span className="failure" /> Провал / условие</div>
    </div>
  )
}
