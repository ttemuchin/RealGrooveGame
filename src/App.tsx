import MPStart from "./MediaPipe/MPmoduleV8";
import CanvasGame from "./GameMain";
import { useState } from "react";
import styles from "./App.module.css";

function App() {
  const [handPos, setHandPos] = useState<string>("None");

  return (
    <>
      <div className={styles.gameField}>
        <CanvasGame handPosition={handPos} />
        <div className={styles.rightCol}>
          <MPStart setHandPosition={setHandPos} />
          <div>= MENU =</div>
        </div>
      </div>
    </>
  );
}

export default App;
