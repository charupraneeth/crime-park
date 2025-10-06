import { useRef, useEffect } from "react";
import kaboom, { type KaboomCtx } from "kaboom";
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

  // Move scene definitions outside of useEffect
  const createScenes = (k: KaboomCtx) => {
    // Game Over scene
    k.scene("gameOver", () => {
      k.add([
        k.text("Game Over!", {
          size: 48,
          font: "arial",
        }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
      ]);

      k.onKeyPress("space", () => {
        k.go("main");
      });
    });

    // Intro scene
    k.scene("intro", () => {
      // Add background
      k.add([
        k.sprite("park"),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.scale(0.9),
      ]);

      // Add title
      k.add([
        k.text("Crime park", {
          size: 64,
          font: "arial",
        }),
        k.pos(k.width() / 2, k.height() / 3),
        k.anchor("center"),
        k.color(k.rgb(255, 255, 255)),
      ]);

      // Add instructions
      k.add([
        k.text("Collect powerups and avoid hazards!", {
          size: 32,
          font: "arial",
        }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(k.rgb(255, 255, 255)),
      ]);

      // Add start prompt
      const prompt = k.add([
        k.text("Press SPACE to start", {
          size: 32,
          font: "arial",
        }),
        k.pos(k.width() / 2, k.height() * 0.7),
        k.anchor("center"),
        k.color(k.rgb(255, 255, 255)),
        k.opacity(1),
      ]);

      // Make the prompt blink
      k.loop(0.5, () => {
        prompt.opacity = prompt.opacity === 1 ? 0 : 1;
      });

      // Start game on space press
      k.onKeyPress("space", () => {
        k.go("main");
      });
    });

    // Main scene
    k.scene("main", () => {
      const music = k.play("bgm", {
        loop: true, // Make the music loop
        volume: 0.5, // Set volume to 50%
      });

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
      k.add([
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
      function updateEnergy(amount: number) {
        energy = k.clamp(energy + amount, 0, MAX_ENERGY);
        energyBar.width = (energy / MAX_ENERGY) * 200;

        if (energy <= 0) {
          loseLife();
          energy = MAX_ENERGY; // Restore energy after losing a life
          energyBar.width = 200;
        }
      }

      // Modify the spawn system
      const activeItems = {
        powerup: 0,
        hazard: 0,
      };

      // Replace the spawnItem function with this simpler version
      function spawnItem(type: "powerup" | "hazard") {
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

        // Random starting position along screen edges
        let x, y;
        if (k.rand() < 0.5) {
          x = k.rand() < 0.5 ? 0 : k.width();
          y = k.rand(0, k.height());
        } else {
          x = k.rand(0, k.width());
          y = k.rand() < 0.5 ? 0 : k.height();
        }

        activeItems[type]++;

        return k.add([
          k.sprite(itemConfig.sprite),
          k.pos(x, y),
          k.anchor("center"),
          k.scale(0.1),
          k.area(),
          type,
          { energy: itemConfig.energy },
          {
            speed: k.rand(100, 200),
            direction: k.rand(-Math.PI, Math.PI),
            update() {
              this.move(
                Math.cos(this.direction) * this.speed,
                Math.sin(this.direction) * this.speed
              );

              // Bounce off edges
              if (this.pos.x < 0 || this.pos.x > k.width()) {
                this.direction = Math.PI - this.direction;
              }
              if (this.pos.y < 0 || this.pos.y > k.height()) {
                this.direction = -this.direction;
              }
            },
          },
        ]);
      }

      // Update collision handlers
      criminal.onCollide("powerup", (powerup) => {
        updateEnergy(powerup.energy);
        powerup.destroy();
        activeItems.powerup--;
        spawnItem("powerup"); // Spawn immediately
      });

      criminal.onCollide("hazard", (hazard) => {
        updateEnergy(hazard.energy);
        hazard.destroy();
        activeItems.hazard--;
        spawnItem("hazard"); // Spawn immediately
      });

      // Maintain item count
      k.loop(1, () => {
        while (activeItems.powerup < 3) spawnItem("powerup");
        while (activeItems.hazard < 3) spawnItem("hazard");
      });

      // Initial spawns
      for (let i = 0; i < 3; i++) {
        spawnItem("powerup");
        spawnItem("hazard");
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
            music.stop(); // Stop music before game over
            k.destroy(criminal);
            k.go("gameOver");
          }
        }
      }

      // Add cleanup function for main scene
      return () => {
        music.stop();
      };
    });

    // Blank scene for cleanup
    k.scene("blank", () => {});
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const k = kaboom({
      global: false,
      canvas: canvasRef.current,
      width: 800,
      height: 600,
      scale: 1,
    });

    // Load assets
    k.loadBean();
    k.loadSprite("criminal", criminalSprite);
    k.loadSprite("park", parkBg);
    k.loadSprite("flower", flowerSprite);
    k.loadSprite("mango", mangoSprite);
    k.loadSprite("broccoli", broccoliSprite);
    k.loadSprite("ice", iceSprite);
    k.loadSprite("glass", glassSprite);
    k.loadSound("bgm", bgm);

    // Create all scenes
    createScenes(k);

    // Start with intro scene
    k.go("intro");

    // Cleanup function
    return () => {
      k.go("blank");
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "800px", height: "600px" }} />;
};

const App = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh", // This ensures full viewport height
        backgroundColor: "#000", // Optional: adds black background
      }}
    >
      <GameCanvas />
    </div>
  );
};

export default App;
