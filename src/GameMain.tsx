/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useRef, useState, useImperativeHandle } from "react";
import styles from "./GameMain.module.css";

import wallImgFile from "./images/wall.jpg";
import car1 from "./images/car.jpg";
import car2 from "./images/car2.jpg";
import car3 from "./images/car3.jpg";
import car4 from "./images/car4.jpg";
import car5 from "./images/car5.jpg";

type Props = {
  handPosition: string;
  isGameStarted: boolean;
  isGamePaused: boolean;
  setGameOver: (gameOver: boolean) => void;
  ref: React.Ref<{ startGame: () => void; pauseGame: () => void; resetGame: () => void }>;
};

const CanvasGame: React.FC<Props> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(props.isGameStarted);
  const [gamePaused, setGamePaused] = useState(props.isGamePaused);

  const [collisions, setCollisions] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const direction = props.handPosition; //

  const [carX, setCarX] = useState(0);
  const [carY, setCarY] = useState(0);
  const obstacles = useRef<{ x: number; y: number }[]>([]);
  const roadLine = useRef<{ y: number }[]>([]); //
  const roadOffset = useRef(0);

  const wallImgRef = useRef<HTMLImageElement | null>(null);
  const carImagesRef = useRef<HTMLImageElement[]>([]);
  const [isImagesLoaded, setImagesLoaded] = useState(false);
  const carImagesPath = [
    car1, // collisions= 0 and 1
    car2,
    car3,
    car4,
    car5, // collisions= 5
  ];


  // game const
  const CELL_SIZE = 100;
  const ROAD_WIDTH = 8;
  const CAR_SIZE = CELL_SIZE * 0.5;
  const ROAD_SPEED = 1.8;
  const CAR_SPEED = 2;
  const SMOOTHNESS = 0.1; // коэффициент плавности (0,1)

  let ROAD_X = 100; // resets below

  useEffect(() => {
    const loadImages = async () => {
      const carPromises = carImagesPath.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {resolve(img);};
          img.onerror = () => {reject(new Error(`Failed to load image: ${src}`));};
        });
      });

      const wallPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        const imgWall = new Image();
        imgWall.src = wallImgFile;
        imgWall.onload = () => {resolve(imgWall)};
        imgWall.onerror = () => {reject(new Error(`Failed to load wall image`))};
      });

      try {
        const [loadedImages, loadedWall] = await Promise.all([
          Promise.all(carPromises),
          wallPromise, 
        ]);

        carImagesRef.current = loadedImages as HTMLImageElement[];
        wallImgRef.current = loadedWall;
        setImagesLoaded(true);


      } catch (error) {
        console.error(error);
      }
    };

    loadImages();
    
  }, []);

  const generateObstacle = () => {
    const x = ROAD_X + Math.floor(Math.random() * ROAD_WIDTH) * CELL_SIZE;
    const y = -CELL_SIZE;
    obstacles.current.push({ x, y });
  };
  const generateRoadLine = () => {
    const y = -CELL_SIZE*2;
    roadLine.current.push({ y });
  };

  const checkCollision = () => {
    for (let i = 0; i < obstacles.current.length; i++) {
      const obstacle = obstacles.current[i];
      if (
        carX < obstacle.x + CELL_SIZE &&
        carX + CAR_SIZE > obstacle.x &&
        carY < obstacle.y + CELL_SIZE &&
        carY + CAR_SIZE > obstacle.y
      ) {
        // удаление препятствий
        obstacles.current.splice(i, 1);
        setCollisions((prev) => prev + 1);
        if (collisions + 1 >= 5) {
          setGameOver(true);
          props.setGameOver(true);
        }
        break;
      }
    }
  };

  // init
  useEffect(() => {
    const canvas = canvasRef.current!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ?
    ROAD_X = (canvas.width * 0.46 - ROAD_WIDTH * CELL_SIZE) / 2;

    setCarX(ROAD_X + 2 * CELL_SIZE);
    setCarY(canvas.height - 2 * CELL_SIZE);

    return;
  }, []);

  //game
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let lastTime = 0;

    // ошибок стало меньше при переносе в основной useEffect
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameOver) {
        switch (event.key) {
          case "a":
            setCarX((prev) => Math.max(ROAD_X, prev - CAR_SIZE));
            break;
          case "d":
            setCarX((prev) => Math.min(ROAD_X + ROAD_WIDTH * CELL_SIZE, prev + CAR_SIZE));
            break;
          case "w":
            setCarY((prev) => Math.max(0, prev - CAR_SIZE));
            break;
          case "s":
            setCarY((prev) => Math.min(canvasRef.current!.height - CELL_SIZE, prev + CELL_SIZE));
            break;
        }
      }
    };

    const update = (deltaTime: number) => {
      if (gameOver) return;
      console.log("Current direction:", direction);
      const normalizedRoadSpeed = ROAD_SPEED * (deltaTime / 16);

      roadOffset.current += normalizedRoadSpeed;
      setDistance((prev) => prev + normalizedRoadSpeed);

      if (roadOffset.current >= CELL_SIZE) {
        roadOffset.current = 0;
        generateObstacle();
        generateRoadLine();
      }

      // для ручного управления
      document.addEventListener("keydown", handleKeyDown);

      let targetX = carX;
      let targetY = carY;

      switch (direction) {
        case "Left":
          targetX = Math.max(ROAD_X, carX - CAR_SIZE);
          break;
        case "Right":
          targetX = Math.min(ROAD_X + ROAD_WIDTH * CELL_SIZE, carX + CAR_SIZE);
          break;
        case "Forward":
          targetY = Math.max(0, carY - CAR_SIZE);
          break;
        case "Backward":
          targetY = Math.min(canvas.height - CELL_SIZE, carY + CAR_SIZE);
          break;
        case "None":
          break;
        default:
          break;
      }

      // плавное перемещение к target
      const normalizedCarSpeed = CAR_SPEED * (deltaTime / 16);
      setCarX((prev) => prev + (targetX - prev) * SMOOTHNESS * normalizedCarSpeed);
      setCarY((prev) => prev + (targetY - prev) * SMOOTHNESS * normalizedCarSpeed);

      obstacles.current.forEach((obstacle) => {
        obstacle.y += ROAD_SPEED;
      });
      roadLine.current.forEach((block) => {
        block.y += ROAD_SPEED;
      });

      obstacles.current = obstacles.current.filter((obstacle) => obstacle.y < canvas.height);
      roadLine.current = roadLine.current.filter((block) => block.y < canvas.height);

      checkCollision();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(ROAD_X - CELL_SIZE/2, 0, CELL_SIZE, canvas.height);
      ctx.fillRect(ROAD_X + ROAD_WIDTH * CELL_SIZE, 0, CELL_SIZE/2, canvas.height);

      ctx.fillStyle = "gray";
      ctx.fillRect(ROAD_X, 0, ROAD_WIDTH * CELL_SIZE, canvas.height);

      ctx.fillStyle = "white";
      roadLine.current.forEach((block) => {
        ctx.fillRect(ROAD_X + (ROAD_WIDTH / 2) * CELL_SIZE - CELL_SIZE / 8, block.y, CELL_SIZE / 4, CELL_SIZE / 2.5);
      });
      
      // повреждения с каждым столкновением
      let currentCarImage = carImagesRef.current[0]
      if (collisions > 0) {
         currentCarImage = carImagesRef.current[collisions-1];
      }
      if (isImagesLoaded) {
        ctx.drawImage(currentCarImage, carX, carY, CAR_SIZE, CAR_SIZE);
      } else {
        ctx.fillStyle = "blue";
        ctx.fillRect(carX, carY, CAR_SIZE, CAR_SIZE);
      }

      obstacles.current.forEach((obstacle) => {
      if (wallImgRef.current) {
        ctx.drawImage(wallImgRef.current, obstacle.x, obstacle.y, CELL_SIZE, CELL_SIZE)
      } else {
        ctx.fillStyle = "red";
        ctx.fillRect(obstacle.x, obstacle.y, CELL_SIZE, CELL_SIZE);
      }
      });
    };

    // main
    let animationFrameId: number;
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      update(deltaTime);
      draw();
      if (!gameOver && gameStarted && !gamePaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    if (gameStarted && !gamePaused) {
      animationFrameId = requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        gameLoop(timestamp);
      });
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [gameOver, gameStarted, gamePaused, direction, carX, carY, ROAD_X, CELL_SIZE, CAR_SIZE, ROAD_SPEED, isImagesLoaded]);

  useImperativeHandle(props.ref, () => ({
    startGame: () => {
      setGameStarted(true);
      setGamePaused(false);
    },
    pauseGame: () => {
      setGamePaused((prev) => !prev);
    },
    resetGame: () => {
      setGameStarted(false);
      setGamePaused(false);
      setGameOver(false);
      setCollisions(0);
      setDistance(0);
      obstacles.current = [];
      roadOffset.current = 0;
      roadLine.current = [];
    },
  }));

  return (
    <div className={styles.game}>
      <div className={styles.wrapper}>
        <div className={styles.gameHeader}>Real Groove</div>
        <hr></hr>
        <div className={styles.distance}>Distance: {Math.round(distance / 10)}m</div>
        <div className={styles.collisions}>Life: {(collisions <= 5 ? (5-collisions) : 0)/5*100}%</div>
      </div>

      <canvas ref={canvasRef} className={styles.road} />
    </div>
  );
};

export default CanvasGame;
