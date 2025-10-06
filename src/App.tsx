import { useRef, useEffect } from "react";
import kaboom from "kaboom";
import parkBg from "./assets/park.png";
import criminalSprite from "./assets/criminal.png";
import flowerSprite from "./assets/flower.png";
import mangoSprite from "./assets/mango.png";
import broccoliSprite from "./assets/broccoli.png";
import iceSprite from "./assets/ice.png";
import glassSprite from "./assets/glass.png";

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
      k.loadSprite("flower", flowerSprite);
      k.loadSprite("mango", mangoSprite);
      k.loadSprite("broccoli", broccoliSprite);
      k.loadSprite("ice", iceSprite);
      k.loadSprite("glass", glassSprite);

      k.scene("main", () => {
        // Remove the layers definition

        // Add background first (it will automatically be rendered behind)
        k.add([
          k.sprite("park"),
          k.pos(k.width() / 2, k.height() / 2),
          k.anchor("center"),
          k.scale(0.9),
        ]);

        k.add([
          k.sprite("flower"),
          k.pos(k.width() / 2, k.height() / 2),
          k.anchor("center"),
          k.scale(0.1),
        ]);

        k.add([
          k.sprite("mango"),
          k.pos(k.width() / 2 + 100, k.height() / 2 + 50),
          k.anchor("center"),
          k.scale(0.1),
        ]);

        k.add([
          k.sprite("broccoli"),
          k.pos(k.width() / 2 - 100, k.height() / 2 + 50),
          k.anchor("center"),
          k.scale(0.1),
        ]);

        k.add([
          k.sprite("ice"),
          k.pos(k.width() / 2, k.height() / 2 - 100),
          k.anchor("center"),
          k.scale(0.1),
        ]);

        k.add([
          k.sprite("glass"),
          k.pos(k.width() / 2 + 150, k.height() / 2 - 80),
          k.anchor("center"),
          k.scale(0.1),
        ]);

        // Create the criminal character

        const criminal = k.add([
          k.sprite("criminal"),
          k.pos(k.width() / 2, k.height() / 2),
          k.anchor("center"),
          k.scale(0.15),
          k.area(),
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

        // Add rain particle generator
        function spawnRaindrop() {
          const x = k.rand(0, k.width()); // Random x position

          const raindrop = k.add([
            k.rect(2, 10), // Rain drop shape
            k.pos(x, -10), // Start above screen
            k.color(k.rgb(190, 230, 255)), // Light blue color
            k.opacity(0.6),
            k.move(k.DOWN, k.rand(400, 600)), // Random speed
            k.rotate(10), // Slight tilt
          ]);

          // Destroy raindrop when it goes off screen
          raindrop.onUpdate(() => {
            if (raindrop.pos.y > k.height() + 20) {
              raindrop.destroy();
            }
          });
        }

        // Spawn raindrops on interval
        k.loop(0.1, () => {
          for (let i = 0; i < 3; i++) {
            // Spawn multiple drops per interval
            spawnRaindrop();
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
