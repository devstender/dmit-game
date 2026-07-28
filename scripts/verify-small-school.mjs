import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const quest = await server.ssrLoadModule('/src/chapters/chapter-1/quests/small-school/scenes.ts')
  if (!quest.smallSchoolQuestScenes.length || !quest.smallSchoolQuestDefinition.nodes.length) {
    throw new Error('Small-school DSL migration produced an empty quest.')
  }
  console.info(`Small-school DSL verification passed: ${quest.smallSchoolQuestScenes.length} scenes.`)
} finally {
  await server.close()
}
