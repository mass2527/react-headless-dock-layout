export class EventEmitter {
  private _listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  emit() {
    this._listeners.forEach((listener) => {
      listener();
    });
  }
}
