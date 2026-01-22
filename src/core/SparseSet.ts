// Basic sparse Set implementation
export class SparseSet<V> {
  denseValues: V[] = [];
  sparse: Map<V, number> = new Map();

  *[Symbol.iterator](): Generator<V> {
    for (let i = this.denseValues.length; i >= 0; --i) {
      yield this.denseValues[i];
    }
  }

  get values(): V[] {
    return this.denseValues;
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

  size() {
    return this.denseValues.length;
  }

  clear() {
    for (let item of this) {
      this.remove(item);
    }
  }

  has(item: V) {
    return this.sparse.has(item);
  }
}
