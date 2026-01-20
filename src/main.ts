/*
-- Simple Api Example

-- Singleton Time class for managing requestAnimationFrame.

const world = new World();

const player: Entity = world.create();
const enemy: Entity = world.create();

player.add('position', {x: 1, y: 1, z: 1}); -- case sensitive
enemy.add({ isEnemy: true, name: 'skeleton', position: {x:1, y: 2, z: 1}, health: 100 }) -- multiple comp
world.addComponent(player, 'position', {x: 1, y: 1, z: 1})

player.remove('position')

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
