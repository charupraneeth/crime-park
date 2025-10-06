import { useRef, useEffect } from "react";
import kaboom from "kaboom";
import parkBg from "./assets/park.png";
import criminalSprite from "./assets/criminal.png";

const GameCanvas = () => {
  const canvasRef = useRef(null);

  const SPEED = 320; // Adjusted speed for smoother movement

  useEffect(() => {
    if (canvasRef.current) {
      const k = kaboom({
        global: false,
        canvas: canvasRef.current,
        width: 800,
        height: 600,
        scale: 1,
      });

      k.loadBean();
      k.loadSprite("criminal", criminalSprite);
      k.loadSprite("park", parkBg);

      k.scene("main", () => {
        // Remove the layers definition

        // Add background first (it will automatically be rendered behind)
        k.add([
          k.sprite("park"),
          k.pos(k.width() / 2, k.height() / 2),
          k.anchor("center"),
          k.scale(0.9),
          // Remove layer property
        ]);

        const criminal = k.add([
          k.sprite("criminal"),
          k.pos(k.width() / 2, k.height() / 2),
          k.anchor("center"),
          k.scale(0.15),
          k.area(),
          // Remove layer property
        ]);

        // Create movement vector
        const movement = {
          x: 0,
          y: 0,
        };

        // Update movement vector on key down
        k.onKeyDown("up", () => {
          movement.y = -1;
        });
        k.onKeyDown("down", () => {
          movement.y = 1;
        });
        k.onKeyDown("left", () => {
          movement.x = -1;
        });
        k.onKeyDown("right", () => {
          movement.x = 1;
        });

        // Reset movement vector on key release
        k.onKeyRelease("up", () => {
          if (movement.y < 0) movement.y = 0;
        });
        k.onKeyRelease("down", () => {
          if (movement.y > 0) movement.y = 0;
        });
        k.onKeyRelease("left", () => {
          if (movement.x < 0) movement.x = 0;
        });
        k.onKeyRelease("right", () => {
          if (movement.x > 0) movement.x = 0;
        });

        // Update bean position every frame
        k.onUpdate(() => {
          criminal.move(movement.x * SPEED, movement.y * SPEED);

          // Wrap around screen edges
          const newPos = criminal.pos;

          // Wrap horizontally
          if (newPos.x < 0) {
            criminal.pos.x = k.width();
          } else if (newPos.x > k.width()) {
            criminal.pos.x = 0;
          }

          // Wrap vertically
          if (newPos.y < 0) {
            criminal.pos.y = k.height();
          } else if (newPos.y > k.height()) {
            criminal.pos.y = 0;
          }
        });
      });

      k.go("main");

      return () => {
        k.scene("blank", () => {});
        k.go("blank");
      };
    }
  }, []);

  return <canvas ref={canvasRef} style={{ width: "800px", height: "600px" }} />;
};

const App = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h1>My Kaboom React Game</h1>
      <GameCanvas />
    </div>
  );
};

export default App;
