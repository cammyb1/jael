import type World from "./World";

function createEntityWithComponents(world: World, name: string) {
  const entity = world.create();

  entity.add("name", name);
  entity.add("health", { value: 100 });
  if (name.includes("2")) {
    entity.add("isLucky", true);
  }
  world.addComponent(entity, "isEntity", true);
}

export function executeStressTest(world: World, amount: number) {
  const prevTime = performance.now();
  console.log(`Creating ${amount} entites -----`);
  for (let eid = 0; eid < amount; eid++) {
    createEntityWithComponents(world, `Entity_${eid}`);
  }
  console.log("Entities created in ", performance.now() - prevTime, "ms.");
}
