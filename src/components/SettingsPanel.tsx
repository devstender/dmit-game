type SettingsPanelProps = {
  open: boolean
  debugModeEnabled: boolean
  debugAvailable: boolean
  debugPanelOpen: boolean
  onToggleDebugMode: () => void
  onOpenDebugPanel: () => void
  onRestartChapter: () => void
  onClose: () => void
}

export function SettingsPanel({
  open,
  debugModeEnabled,
  debugAvailable,
  debugPanelOpen,
  onToggleDebugMode,
  onOpenDebugPanel,
  onRestartChapter,
  onClose,
}: SettingsPanelProps) {
  return (
    <aside className={`settings-panel ${open ? 'open' : ''}`} aria-label="Настройки">
      <div className="settings-heading">
        <div><span>Игра</span><h2>Настройки</h2></div>
        <button className="panel-close" onClick={onClose} aria-label="Закрыть настройки">×</button>
      </div>
      {debugAvailable && (
        <>
          <button className="setting-toggle debug-toggle" onClick={onToggleDebugMode} role="switch" aria-checked={debugModeEnabled}>
            <span><strong>Режим отладки</strong><small>{debugModeEnabled ? 'DEV: все квесты доступны на карте.' : 'DEV: открыть все квесты и тестовые развилки.'}</small></span>
            <i className={debugModeEnabled ? 'on' : ''}><b /></i>
          </button>
          {debugModeEnabled && <button className="debug-stage-launch" onClick={onOpenDebugPanel}>Открыть граф и этапы квеста <b>{debugPanelOpen ? 'Открыто' : '→'}</b></button>}
          <button className="debug-stage-launch" onClick={onRestartChapter}>Начать текущую главу заново <b>↻</b></button>
        </>
      )}
    </aside>
  )
}
