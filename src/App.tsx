import CanvasGame from "./GameMain";
import { useRef, useState } from "react";
import styles from "./App.module.css";
import Menu from "./Menu";

function App() {
  const [handPos, setHandPos] = useState<string>("None");

  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);

  const [gameOver, setGameOver] = useState(false);

  const gameRef = useRef<{ startGame: () => void; pauseGame: () => void; resetGame: () => void }>(null);

  const startGame = () => {
    setGameStarted(true);
    setGamePaused(false);
    if (gameRef.current) {
      gameRef.current.startGame();
    }
  };

  const pauseGame = () => {
    setGamePaused((prev) => !prev);
    if (gameRef.current) {
      gameRef.current.pauseGame();
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGamePaused(false);
    setGameOver(false);
    if (gameRef.current) {
      gameRef.current.resetGame();
    }
  };

  return (
    <>
      <div className={styles.gameField}>
        <CanvasGame
          handPosition={handPos}
          ref={gameRef}
          isGameStarted={gameStarted}
          isGamePaused={gamePaused}
          setGameOver={setGameOver}
        />
        <div className={styles.rightCol}>
          <Menu
            setHandPosition={setHandPos}
            startGame={startGame}
            pauseGame={pauseGame}
            resetter={resetGame}
            gameOver={gameOver}
            isGameStarted={gameStarted}
          />
        </div>
      </div>
    </>
  );
}

export default App;
