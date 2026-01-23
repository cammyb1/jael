// Basic sparse Set implementation
export class SparseSet<V> {
  denseValues: V[] = [];
  sparse: Map<V, number> = new Map();

  [Symbol.iterator]() {
    let index = this.values.length;

    const result = {
      value: undefined as V,
      done: false,
    };

    return {
      next: () => {
        result.value = this.values[--index];
        result.done = index < 0;
        return result;
      },
    };
  }

  get values(): V[] {
    return this.denseValues;
  }

  first(): V {
    return this.denseValues[0];
  }

  add(item: V) {
    if (this.has(item)) return;
    this.denseValues.push(item);
    this.sparse.set(item, this.denseValues.length - 1);
  }

  indexOf(item: V): number {
    if (!this.sparse.get(item)) return -1;
    return this.sparse.get(item)!;
  }

  remove(item: V) {
    if (!this.has(item)) return;
    const index = this.sparse.get(item)!;

    this.sparse.delete(item);

    const lastV = this.denseValues[this.denseValues.length - 1];

    if (lastV !== item) {
      this.denseValues[index] = lastV;
      this.sparse.set(lastV, index);
    }

    this.denseValues.pop();
  }

  forEach(predicate: (item: V) => void) {
    for (let item of this) {
      predicate(item);
    }
  }

  size(): number {
    return this.denseValues.length;
  }

  clear() {
    for (let item of this) {
      this.remove(item);
    }
  }

  has(item: V): boolean {
    return this.sparse.has(item);
  }
}
