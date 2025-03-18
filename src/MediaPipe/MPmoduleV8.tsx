/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";
import styles from "./MPstyle.module.css";

const MPStart = ({ setHandPosition }: { setHandPosition: (position: string) => void }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onFrameResults);

    let camera: Camera | null = null;
    if (webcamRef.current?.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current!.video! });
        },
      });
      camera.start();
    }

    return () => {
      camera?.stop();
      hands.close();
    };
  }, []);

  const onFrameResults = (results: any) => {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    canvasCtx.scale(-1, 1); // отзеркаливаем по горизонтали
    canvasCtx.translate(-canvasRef.current.width, 0);

    // отображение кадра с веб-камеры
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]; // первая обнаруженная
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "white" });
      drawLandmarks(canvasCtx, landmarks, { color: "white", fillColor: "rgb(12, 124, 0)" });

      // определяем зону где рука
      const position = getHandPosition(landmarks, canvasRef.current.width, canvasRef.current.height);
      setHandPosition(position);

      fillZone(canvasCtx, position, canvasRef.current.width, canvasRef.current.height);

      canvasCtx.restore();
      canvasCtx.save();
      canvasCtx.fillStyle = "white";
      canvasCtx.font = "18px arial";
      canvasCtx.fillText(`D: ${position}`, 20, 50);
      canvasCtx.restore();
    }

    drawZoneBorders(canvasCtx, canvasRef.current.width, canvasRef.current.height);

    canvasCtx.restore();
  };

  const getHandPosition = (landmarks: any, canvasWidth: number, canvasHeight: number): string => {
    const wrist = landmarks[0];
    const x = wrist.x * canvasWidth;
    const y = wrist.y * canvasHeight;

    // границы зон
    const topZone = { x1: canvasWidth * 0.25, y1: 0, x2: canvasWidth * 0.75, y2: canvasHeight * 0.28 };
    const bottomZone = { x1: canvasWidth * 0.25, y1: canvasHeight * 0.72, x2: canvasWidth * 0.75, y2: canvasHeight };
    const leftZone = { x1: 0, y1: canvasHeight * 0.28, x2: canvasWidth * 0.35, y2: canvasHeight * 0.72 };
    const rightZone = { x1: canvasWidth * 0.65, y1: canvasHeight * 0.28, x2: canvasWidth, y2: canvasHeight * 0.72 };

    if (x >= topZone.x1 && x <= topZone.x2 && y >= topZone.y1 && y <= topZone.y2) {
      return "Forward";
    } else if (x >= bottomZone.x1 && x <= bottomZone.x2 && y >= bottomZone.y1 && y <= bottomZone.y2) {
      return "Backward";
    } else if (x >= leftZone.x1 && x <= leftZone.x2 && y >= leftZone.y1 && y <= leftZone.y2) {
      return "Right"; // Зеркалим, поэтому возвращаем здесь right
    } else if (x >= rightZone.x1 && x <= rightZone.x2 && y >= rightZone.y1 && y <= rightZone.y2) {
      return "Left"; // и наоборот
    } else {
      return "None";
    }
  };

  const fillZone = (ctx: CanvasRenderingContext2D, position: string, width: number, height: number) => {
    let fillColor = "rgba(255, 0, 0, 0.3)";

    switch (position) {
      case "Forward":
        fillColor = "rgba(255, 0, 0, 0.3)";
        break;
      case "Backward":
        fillColor = "rgba(0, 255, 0, 0.3)";
        break;
      case "Left":
        fillColor = "rgba(0, 0, 255, 0.3)"; // здесь неважно кто правый кто левый
        break;
      case "Right":
        fillColor = "rgba(255, 255, 0, 0.3)";
        break;
      default:
        return;
    }

    ctx.fillStyle = fillColor;

    // Заливка
    switch (position) {
      case "Forward":
        ctx.fillRect(width * 0.25, 0, width * 0.5, height * 0.28);
        break;
      case "Backward":
        ctx.fillRect(width * 0.25, height * 0.72, width * 0.5, height * 0.28);
        break;
      case "Right": //а вот здесь важно
        ctx.fillRect(0, height * 0.28, width * 0.35, height * 0.44);
        break;
      case "Left":
        ctx.fillRect(width * 0.65, height * 0.28, width * 0.35, height * 0.44);
        break;
    }
  };

  const drawZoneBorders = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "#ffab03c9";
    ctx.lineWidth = 1;

    ctx.strokeRect(width * 0.25, 0, width * 0.5, height * 0.28);
    ctx.strokeRect(width * 0.25, height * 0.72, width * 0.5, height * 0.28);
    ctx.strokeRect(0, height * 0.28, width * 0.35, height * 0.44);
    ctx.strokeRect(width * 0.65, height * 0.28, width * 0.35, height * 0.44);
  };

  return (
    <div>
      <canvas ref={canvasRef} width={580} height={400} className={styles.webcam1} />
      {/* , transform: "scaleX(-1)" */}
      <Webcam
        audio={false}
        mirrored={true}
        ref={webcamRef}
        width={580}
        height={400}
        style={{ display: "none" }} // видео отображается на canvas
      />
    </div>
  );
};

export default MPStart;
