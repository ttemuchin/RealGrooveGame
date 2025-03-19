import React, { useState } from "react";
import MPStart from "./MediaPipe/MPmoduleV8";
import styles from "./Menu.module.css";

type MenuProps = {
  setHandPosition: (position: string) => void;
  startGame: () => void;
  pauseGame: () => void;

  resetter: () => void; //для new game
  gameOver: boolean; // получаем параметр для кнопки паузы
  isGameStarted: boolean;
};

const Menu: React.FC<MenuProps> = ({ setHandPosition, startGame, pauseGame, resetter, gameOver, isGameStarted }) => {
  const [webcamEnabled, setCameraEnabled] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);

  const handleWebcam = () => {
    setCameraEnabled((prev) => !prev);
  };

  const handleNewGame = () => {
    resetter();
    startGame();
    setGamePaused(false);
  };

  const handlePause = () => {
    if (!gameOver) {
      setGamePaused((prev) => !prev);
      pauseGame();
    }
  };

  return (
    <div className={styles.menu}>
      {webcamEnabled && <MPStart setHandPosition={setHandPosition} />}
      <div className={styles.menuContent}>
        <div className={styles.buttons}>
          <button onClick={handleWebcam}>{webcamEnabled ? "Disable Camera" : "Enable Camera"}</button>
          <button onClick={handleNewGame}>New Game</button>
          <button onClick={handlePause} disabled={!isGameStarted || gameOver}>
            {gamePaused ? "Resume" : "Pause"}
          </button>
          <button>Quit</button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
