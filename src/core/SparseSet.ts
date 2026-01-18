// Simple and basic SparseSet implementation;

export default class SparseSet<T> {
  dense: T[] = [];
  sparse: Map<T, number> = new Map();

  [Symbol.iterator]() {
    let index = this.dense.length;

    const result = {
      value: undefined as T,
      done: false,
    };

    return {
      next: () => {
        result.value = this.dense[--index];
        result.done = index < 0;
        return result;
      },
    };
  }

  add(item: T) {
    if (this.has(item)) return;
    this.dense.push(item);
    this.sparse.set(item, this.dense.length - 1);
  }

  indexOf(item: T): number {
    if (!this.has(item)) return -1;
    return this.sparse.get(item)!;
  }

  remove(item: T) {
    if (!this.has(item)) return;
    const index = this.sparse.get(item)!;

    this.sparse.delete(item);

    const last = this.dense[this.dense.length - 1];

    if (last !== item) {
      this.dense[index] = last;
      this.sparse.set(last, index);
    }
    this.dense.pop();
  }

  size() {
    return this.dense.length;
  }

  clear() {
    for (let item of this) {
      this.remove(item);
    }
  }

  has(item: T) {
    return this.sparse.has(item);
  }
}
