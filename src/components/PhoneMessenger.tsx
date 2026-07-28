import { useEffect, useRef, type MouseEvent } from 'react'
import type { Character, PhoneMessage } from '../types/story'

export type PhoneThreadMessage = {
  speaker: Character
  text: string
  direction: PhoneMessage['direction']
}

export type PhoneChoiceOption = {
  label: string
  locked: boolean
  onSelect: () => void
}

type PhoneMessengerProps = {
  contact: Character | string
  messages: PhoneThreadMessage[]
  complete: boolean
  choices?: PhoneChoiceOption[]
  time?: string
  onTap: (event: MouseEvent<HTMLElement>) => void
}

export function PhoneMessenger({ contact, messages, complete, choices = [], time = '13:37', onTap }: PhoneMessengerProps) {
  const threadRef = useRef<HTMLDivElement | null>(null)
  const currentMessageText = messages[messages.length - 1]?.text ?? ''

  useEffect(() => {
    const thread = threadRef.current
    if (!thread) return
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' })
  }, [choices.length, messages.length, currentMessageText])

  return (
    <section className="phone-scene" aria-label="Переписка в телефоне" onClick={onTap}>
      <div className="iphone5" role="presentation">
        <div className="iphone-camera" />
        <div className="iphone-speaker" />
        <div className="iphone-screen">
          <div className="iphone-status">
            <span>Арбеково LTE</span>
            <b>{time}</b>
            <span>42%</span>
          </div>
          <div className="messenger-header">
            <span className="messenger-back">‹</span>
            <div>
              <strong>{contact}</strong>
              <small>сообщения</small>
            </div>
            <i />
          </div>
          <div className="message-thread" ref={threadRef}>
            <div className="message-day">сегодня</div>
            {messages.map((message, index) => {
              const isCurrent = index === messages.length - 1
              const senderName = message.speaker === 'Рассказчик' ? 'Система' : message.speaker

              return (
                <article className={`message-bubble ${message.direction} ${isCurrent ? 'current' : ''}`} key={`${index}-${message.speaker}-${message.direction}`}>
                  <span>{senderName}</span>
                  <p>
                    {message.text}
                    {isCurrent && <i className={!complete ? 'caret' : 'caret hidden'}>▍</i>}
                  </p>
                </article>
              )
            })}
            {choices.length > 0 && (
              <div className="phone-choice-list" aria-label="Варианты ответа">
                {choices.map((choice) => (
                  <button className={choice.locked ? 'locked' : ''} disabled={choice.locked} key={choice.label} onClick={choice.onSelect}>
                    {choice.label}
                    <span>{choice.locked ? '×' : '↑'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="message-input">
            <span>iMessage</span>
            <b>↑</b>
          </div>
        </div>
        <div className="iphone-home" />
      </div>
      <p className="phone-tap-hint">{complete ? 'Нажми на экран телефона, чтобы продолжить' : 'Нажми, чтобы показать сообщение полностью'}</p>
    </section>
  )
}
