type SettingsPanelProps = {
  open: boolean
  textAnimationEnabled: boolean
  debugModeEnabled: boolean
  debugAvailable: boolean
  onToggleTextAnimation: () => void
  onToggleDebugMode: () => void
  onClose: () => void
}

export function SettingsPanel({
  open,
  textAnimationEnabled,
  debugModeEnabled,
  debugAvailable,
  onToggleTextAnimation,
  onToggleDebugMode,
  onClose,
}: SettingsPanelProps) {
  return (
    <aside className={`settings-panel ${open ? 'open' : ''}`} aria-label="Настройки">
      <div className="settings-heading"><div><span>Игра</span><h2>Настройки</h2></div><button className="panel-close" onClick={onClose} aria-label="Закрыть настройки">×</button></div>
      <button className="setting-toggle" onClick={onToggleTextAnimation} role="switch" aria-checked={textAnimationEnabled}>
        <span><strong>Печатать текст</strong><small>{textAnimationEnabled ? 'Реплики появляются посимвольно.' : 'Реплики появляются сразу.'}</small></span>
        <i className={textAnimationEnabled ? 'on' : ''}><b /></i>
      </button>
      {debugAvailable && (
        <>
          <button className="setting-toggle debug-toggle" onClick={onToggleDebugMode} role="switch" aria-checked={debugModeEnabled}>
            <span><strong>Режим отладки</strong><small>{debugModeEnabled ? 'DEV: все квесты доступны на карте.' : 'DEV: открыть все квесты и тестовые развилки.'}</small></span>
            <i className={debugModeEnabled ? 'on' : ''}><b /></i>
          </button>
        </>
      )}
    </aside>
  )
}
