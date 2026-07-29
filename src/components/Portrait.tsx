import { AnimatePresence, motion } from 'framer-motion'
import { characterPresentation } from '../data/characters'
import type { Character, Emotion } from '../types/story'

type PortraitProps = {
  character?: Character
  position: 'left' | 'right'
  active: boolean
  emotion?: Emotion
  layoutMode?: 'desktop' | 'mobile'
  visible?: boolean
  transitionKey?: string
}

export function Portrait({ character, position, active, emotion = 'default', layoutMode = 'desktop', visible = true, transitionKey }: PortraitProps) {
  if (!character || character === 'Рассказчик') return <div className={`portrait-space ${position}`} />

  const presentation = characterPresentation[character]
  if (!presentation) return <div className={`portrait-space ${position}`} />
  const image = presentation.images?.[emotion] ?? presentation.images?.default
  const mobile = layoutMode === 'mobile'

  return (
    <AnimatePresence mode="wait" initial={false}>
      {visible && <motion.div
        key={transitionKey ?? `${character}-${position}-${layoutMode}`}
        className={`portrait ${presentation.className} ${position} ${active ? 'active' : ''} ${mobile ? 'mobile-portrait' : ''} emotion-${emotion}`}
        animate={{
          opacity: active || mobile ? 1 : .56,
          scale: active ? (mobile ? 1 : 1.03) : mobile ? 1 : .92,
          x: active || mobile ? 0 : position === 'left' ? -14 : 14,
          y: active ? (mobile ? -6 : -18) : 0,
          filter: active || mobile ? 'saturate(1.08) brightness(1)' : 'saturate(.74) brightness(.82)',
        }}
        initial={{ opacity: 0, x: position === 'left' ? (mobile ? -120 : -36) : (mobile ? 120 : 36), y: mobile ? 0 : 12, scale: mobile ? .94 : .97 }}
        exit={{ opacity: 0, x: position === 'left' ? (mobile ? -120 : -24) : (mobile ? 120 : 24), y: mobile ? 0 : 8, scale: mobile ? .94 : .98 }}
        transition={mobile ? { duration: .34, ease: [.2, .82, .22, 1] } : { duration: .24, ease: [.22, .8, .24, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
        {image ? (
          <motion.div
            key={`${character}-${emotion}`}
            className="portrait-image-frame"
            initial={{ opacity: 0, y: 26, scale: .96, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, scale: .98, filter: 'blur(4px)' }}
            transition={{ duration: .24, ease: [.22, .8, .24, 1] }}
          >
            <img className="portrait-image" src={image} alt={`${character}: ${emotion}`} />
          </motion.div>
        ) : (
          <motion.div
            key={`${character}-${emotion}`}
            className="portrait-avatar"
            initial={{ opacity: 0, y: 26, scale: .96, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, scale: .98, filter: 'blur(4px)' }}
            transition={{ duration: .24, ease: [.22, .8, .24, 1] }}
          >
            <span>{presentation.initial}</span>
          </motion.div>
        )}
        </AnimatePresence>
        <div className="portrait-label"><strong>{character}</strong></div>
      </motion.div>}
    </AnimatePresence>
  )
}
