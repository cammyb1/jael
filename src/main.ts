/*
-- Simple Api Example

-- Singleton Time class for managing requestAnimationFrame.

const world = new World();

const player: Entity = world.create();
const enemy: Entity = world.create();

player.add('position', {x: 1, y: 1, z: 1}); -- case sensitive
enemy.add({ isEnemy: true, name: 'skeleton', position: {x:1, y: 2, z: 1}, health: 100 }) -- multiple comp
world.addComponent(player, 'rotation', {x: 1, y: 1, z: 1})

player.remove('rotation')

const pos = player.get('position')

const query = world.query.in(['position']).out('name')

console.log(query.entities) -- Player & Enemy

function moveSystem() : System {
  const {entities} = query;

  return {
    enter(){
      console.log('System entered.')
      const player2 = world.create();
      player2.add('position', {x: 1, y: 1})

      console.log(entities) -- Player & Player2 & Enemy
    }
    update(){
      const delta= Time.delta;

    }    
    exit(){
      console.log('System exited.')
    }
  }
}

world.addSystem(moveSystem)

world.destroy(enemy);


-- Make full performance test with multiple entities and watch how it perform.

*/

import type { System } from "./core/SystemManager";
import { Time } from "./core/Time";
import World from "./core/World";

const world = new World();

const player = world.create();
const enemy = world.create();
const enemy2 = world.create();

player.add("name", "player");
player.add("position", { x: 1, y: 0 });
player.add("health", 100);

enemy.add("name", "enemy");
enemy.add("health", 200);
enemy.add("position", { x: 1, y: 0 });
enemy.add("name", "enemy2");
enemy2.add("health", 200);

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
            `name: ${name}, pos: [${pos.x}, ${pos.y}], health: ${health || 0}`,
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
        health -= poisonDmg;
      }
    },
  };
}

world.addSystem(moveSystem());
world.addSystem(logSystem());

Time.start();
Time.on("update", () => {
  world.update();
});
