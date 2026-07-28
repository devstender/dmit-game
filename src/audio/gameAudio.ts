import classDoor from '../assets/audio/class-door.ogg'
import classroomAmbient from '../assets/audio/в классе.mp3'
import dialoguePage from '../assets/audio/dialogue-page.ogg'
import schoolBell from '../assets/audio/school-bell.mp3'
import nightAmbient from '../assets/audio/ночной_ambient.mp3'
import teacherReveal from '../assets/audio/teacher-reveal.ogg'
import uiClick from '../assets/audio/ui-click.ogg'
import uiToggle from '../assets/audio/ui-toggle.ogg'
import runSound from '../assets/audio/звук_бега.mp3'
import fallSound from '../assets/audio/звук_падения.mp3'
import guardShoutSound from '../assets/audio/крик_охранника.mp3'
import phoneNotification from '../assets/audio/уведомление_телефона.mp3'
import minikaAmbient from '../assets/audio/минька_амбиент.mp3'
import matveyMusic from '../assets/audio/музыка_матвей.mp3'
import beerOpen from '../assets/audio/звук_открывания_пива.mp3'
import dmitRoomAmbient from '../assets/audio/звук_комнаты_дмита.mp3'
import roachMusic from '../assets/audio/тараканы.mp3'
import chaseMusic from '../assets/audio/погоня.mp3'
import questComplete from '../assets/audio/sfx/quest-complete.wav'
import phoneMessageReceived from '../assets/audio/пришло_сообщение.mp3'
import blackPhoneVibration from '../assets/audio/small-school/вибрация_телефона.mp3'
import igorMysterySting from '../assets/audio/small-school/звук_мистики.mp3'
import schoolEntryCreak from '../assets/audio/small-school/звук_открытия_двери_окна.mp3'
import schoolChase from '../assets/audio/small-school/интерактив.mp3'
import schoolDoorBuzz from '../assets/audio/small-school/тревожная_кнопка.mp3'
import guardAlert from '../assets/audio/small-school/тревожный_звук.mp3'
import bikeChainRattle from '../assets/audio/звук_починки.mp3'

export const gameSounds = {
  classDoor,
  classroomAmbient,
  dialoguePage,
  dmitRun: runSound,
  guardRun: runSound,
  guardShout: guardShoutSound,
  beerOpen,
  matveyMusic,
  minikaAmbient,
  dmitRoomAmbient,
  roachMusic,
  chaseMusic,
  schoolChase,
  schoolDoorBuzz,
  schoolEntryCreak,
  guardAlert,
  blackPhoneVibration,
  igorMysterySting,
  phoneMessageReceived,
  bikeChainRattle,
  mishganFall: fallSound,
  phoneVibrate: phoneNotification,
  questComplete,
  schoolBell,
  nightAmbient,
  teacherReveal,
  uiClick,
  uiToggle,
  skillSuccess: uiToggle,
  skillFail: teacherReveal,
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
