import classDoor from '../assets/audio/class-door.ogg'
import classroomAmbient from '../assets/audio/в классе.mp3'
import dialoguePage from '../assets/audio/dialogue-page.ogg'
import schoolBell from '../assets/audio/school-bell.mp3'
import schoolyardAmbient from '../assets/audio/двор.mp3'
import teacherReveal from '../assets/audio/teacher-reveal.ogg'
import uiClick from '../assets/audio/ui-click.ogg'
import uiToggle from '../assets/audio/ui-toggle.ogg'
import runSound from '../assets/audio/звук_бега.mp3'
import fallSound from '../assets/audio/звук_падения.mp3'
import guardShoutSound from '../assets/audio/крик_охранника.mp3'
import phoneNotification from '../assets/audio/уведомление_телефона.mp3'
import questComplete from '../assets/audio/sfx/quest-complete.wav'

export const gameSounds = {
  classDoor,
  classroomAmbient,
  dialoguePage,
  dmitRun: runSound,
  guardRun: runSound,
  guardShout: guardShoutSound,
  mishganFall: fallSound,
  phoneVibrate: phoneNotification,
  questComplete,
  schoolBell,
  schoolyardAmbient,
  teacherReveal,
  uiClick,
  uiToggle,
}

export function playSound(source: string, volume = 0.7, maxDurationSeconds?: number) {
  const sound = new Audio(source)
  sound.volume = volume
  void sound.play().catch(() => undefined)
  if (maxDurationSeconds !== undefined) {
    window.setTimeout(() => {
      sound.pause()
      sound.currentTime = 0
    }, maxDurationSeconds * 1000)
  }
}

export function playLoop(source: string, volume = 0.28) {
  const sound = new Audio(source)
  sound.loop = true
  sound.volume = volume
  void sound.play().catch(() => undefined)
  return sound
}
