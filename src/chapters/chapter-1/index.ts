import schoolBackground from '../../assets/school.png'
import type { Chapter } from '../../types/story'
import { chapterOneScenes } from './scenes'

export const chapterOne: Chapter = {
  title: 'Глава первая',
  subtitle: 'Школьный звонок',
  schoolNumber: 76,
  background: schoolBackground,
  scenes: chapterOneScenes,
}
