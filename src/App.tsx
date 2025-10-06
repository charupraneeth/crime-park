import { useRef, useEffect } from "react";
import kaboom from "kaboom";
import parkBg from "./assets/park.png";
import criminalSprite from "./assets/criminal.png";
import flowerSprite from "./assets/flower.png";
import mangoSprite from "./assets/mango.png";
import broccoliSprite from "./assets/broccoli.png";
import iceSprite from "./assets/ice.png";
import glassSprite from "./assets/glass.png";
import bgm from "./assets/bgm.mp3";

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

        k.onKeyPress("l", () => {
          loseLife();
        });

        // Add energy system
        let energy = 100; // Start with full energy
        const MAX_ENERGY = 100;

        // Create energy bar background
        const energyBarBg = k.add([
          k.rect(200, 20),
          k.pos(k.width() / 2 - 100, 20),
          k.color(k.rgb(100, 100, 100)),
          k.fixed(),
        ]);

        // Create energy bar foreground
        const energyBar = k.add([
          k.rect(200, 20),
          k.pos(k.width() / 2 - 100, 20),
          k.color(k.rgb(0, 255, 0)),
          k.fixed(),
        ]);

        // Function to update energy bar
        function updateEnergy(amount) {
          energy = k.clamp(energy + amount, 0, MAX_ENERGY);
          energyBar.width = (energy / MAX_ENERGY) * 200;

          if (energy <= 0) {
            loseLife();
            energy = MAX_ENERGY; // Restore energy after losing a life
            energyBar.width = 200;
          }
        }

        // Add these helper functions after energy bar setup
        function getRandomPosition() {
          const edge = k.rand(0, 3); // 0: top, 1: right, 2: bottom, 3: left
          let x, y;

          switch (edge) {
            case 0: // top
              x = k.rand(50, k.width() - 50);
              y = -20;
              break;
            case 1: // right
              x = k.width() + 20;
              y = k.rand(50, k.height() - 50);
              break;
            case 2: // bottom
              x = k.rand(50, k.width() - 50);
              y = k.height() + 20;
              break;
            default: // left
              x = -20;
              y = k.rand(50, k.height() - 50);
              break;
          }
          return { x, y };
        }

        // Modify the spawn system
        const activeItems = {
          powerup: 0,
          hazard: 0,
        };

        // Replace the existing spawnItem function with this updated version
        function spawnItem(type) {
          const pos = getRandomPosition();
          const config = {
            powerup: {
              mango: { sprite: "mango", energy: 20 },
              flower: { sprite: "flower", energy: 15 },
              broccoli: { sprite: "broccoli", energy: 25 },
            },
            hazard: {
              ice: { sprite: "ice", energy: -30 },
              glass: { sprite: "glass", energy: -20 },
            },
          };

          const itemType =
            type === "powerup"
              ? k.choose(["mango", "flower", "broccoli"])
              : k.choose(["ice", "glass"]);

          const itemConfig = config[type][itemType];

          // Generate random target position
          const targetX = k.rand(50, k.width() - 50);
          const targetY = k.rand(50, k.height() - 50);

          // Calculate random speed between 50 and 150
          const speed = k.rand(50, 150);

          activeItems[type]++;

          const item = k.add([
            k.sprite(itemConfig.sprite),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.scale(0.1),
            k.area(),
            type,
            { energy: itemConfig.energy },
            k.move(k.vec2(targetX - pos.x, targetY - pos.y).unit(), speed),
          ]);

          // Change direction randomly every 2-4 seconds
          function changeDirection() {
            if (!item.exists()) return; // Stop if item was destroyed

            const newTargetX = k.rand(50, k.width() - 50);
            const newTargetY = k.rand(50, k.height() - 50);
            const newSpeed = k.rand(50, 150);

            item.moveUpdate = k
              .vec2(newTargetX - item.pos.x, newTargetY - item.pos.y)
              .unit()
              .scale(newSpeed);

            k.wait(k.rand(2, 4), changeDirection);
          }

          // Start changing direction
          k.wait(k.rand(2, 4), changeDirection);

          return item;
        }

        // Update collision handlers
        criminal.onCollide("powerup", (powerup) => {
          updateEnergy(powerup.energy);
          powerup.destroy();
          activeItems.powerup--;

          // Always spawn new powerup after delay
          k.wait(k.rand(1, 2), () => {
            spawnItem("powerup");
          });
        });

        criminal.onCollide("hazard", (hazard) => {
          updateEnergy(hazard.energy);
          hazard.destroy();
          activeItems.hazard--;

          // Always spawn new hazard after delay
          k.wait(k.rand(1, 2), () => {
            spawnItem("hazard");
          });
        });

        // Initial item spawns - stagger them
        for (let i = 0; i < 3; i++) {
          k.wait(i * 0.5, () => {
            spawnItem("powerup");
          });
          k.wait(i * 0.5 + 0.25, () => {
            spawnItem("hazard");
          });
        }

        // Add gradual energy decrease over time
        k.loop(1, () => {
          updateEnergy(-2); // Decrease energy by 2 every second
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

        // Add lives system before creating the criminal
        let playerLives = 3;

        // Add lives display
        const livesLabel = k.add([
          k.text(playerLives.toString(), {
            size: 32,
            font: "arial",
          }),
          k.pos(k.width() - 50, 30),
          k.color(k.rgb(255, 50, 50)),
          k.fixed(),
        ]);

        // Add a function to handle life loss
        function loseLife() {
          console.log("Life lost!");
          if (playerLives > 0) {
            playerLives--;
            livesLabel.text = playerLives.toString();

            if (playerLives <= 0) {
              k.destroy(criminal);
              k.go("gameOver");
            }
          }
        }

        // Add game over scene
        k.scene("gameOver", () => {
          k.add([
            k.text("Game Over!", {
              size: 48,
              font: "arial",
            }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
          ]);

          // Restart game on space press
          k.onKeyPress("space", () => {
            playerLives = 3;
            k.go("main");
          });
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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1>My Kaboom React Game</h1>
      <GameCanvas />
    </div>
  );
};

export default App;
