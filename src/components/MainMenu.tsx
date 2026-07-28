import { dmitImage } from "../data/characters";
import startBackground from "../assets/start.png";
import { gameSounds, playSound } from "../audio/gameAudio";

type MainMenuProps = {
  hasSave: boolean
  onStart: () => void
  onContinue: () => void
};

export function MainMenu({ hasSave, onStart, onContinue }: MainMenuProps) {
  return (
    <main className="menu-screen" style={{ backgroundImage: `linear-gradient(90deg, rgba(18, 15, 32, .86) 0%, rgba(31, 20, 41, .62) 46%, rgba(38, 22, 44, .35) 100%), url(${startBackground})` }}>
      <div className="grain" />
      <div className="menu-city city-back">АРБЕКОВО</div>
      <div className="menu-content">
        <p className="eyebrow">интерактивная история · пролог</p>
        <h1>
          Помоги <span>Дмиту</span>
          <br />
          встать с колен
        </h1>
        <p className="menu-lead">
          Большой путь к вершине <br />
          начинается с последней парты.
        </p>
        <div className="menu-actions">
          <button className="primary-button" onClick={() => { playSound(gameSounds.uiClick); onStart() }}>
            Начать историю <span>→</span>
          </button>
          <button className="ghost-button" disabled={!hasSave} onClick={() => { playSound(gameSounds.uiClick); onContinue() }}>
            Продолжить {!hasSave && <small>нет сохранения</small>}
          </button>
        </div>
      </div>
      <div className="menu-character">
        <img src={dmitImage} alt="Дмит" />
        <p>Дмит</p>
      </div>
      <footer>Глава первая · Школьный звонок</footer>
    </main>
  );
}
