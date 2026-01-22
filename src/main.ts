import type { System } from "./core/SystemManager";
import { Time } from "./core/Time";
import World from "./core/World";

const world = new World();

const player = world.create();
const enemy = world.create();
const enemy2 = world.create();

player.add("name", "player");
player.add("position", { x: 1, y: 0 });
player.add("health", { value: 100 });

enemy.add("name", "enemy");
enemy.add("health", { value: 200 });
enemy.add("position", { x: 1, y: 0 });
enemy.add("name", "enemy2");
enemy2.add("health", { value: 200 });

const posEntities = world.include("position", "name");
const healthEntities = world.include("health");
const namedEntities = world.include("name");

function logSystem(): System {
  return {
    priority: 0,
    update() {
      setTimeout(() => {
        for (let entity of namedEntities.entities) {
          const pos = entity.get("position");
          const name = entity.get("name");
          const health = entity.get("health");

          console.log(
            `name: ${name}, pos: [${pos.x}, ${pos.y}], health: ${health.value || 0}`,
          );
        }
      }, 100);
    },
  };
}

function moveSystem(): System {
  return {
    priority: 1,
    update() {
      for (let entity of posEntities.entities) {
        const pos = entity.get("position");
        pos.x += Time.delta;
      }
    },
  };
}

function poisonSystem(): System {
  let poisonDmg = 0.5;

  return {
    priority: 1,
    update() {
      for (let entity of healthEntities.entities) {
        const health = entity.get("health");
        health.value -= poisonDmg;
        if (health.value <= 0) {
          health.value = 0;
          world.destroy(entity);
        }
      }
    },
  };
}

world.addSystem(moveSystem());
world.addSystem(logSystem());
world.addSystem(poisonSystem());

Time.start();
Time.on("update", () => {
  world.update();
});
