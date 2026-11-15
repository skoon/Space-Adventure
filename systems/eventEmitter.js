// systems/eventEmitter.js
/** Simple event emitter for internal game events */
export class EventEmitter {
  constructor() {
    this.handlers = {};
  }
  /** Register a handler for an event */
  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }
  /** Remove a handler for an event */
  off(event, handler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }
  /** Emit an event with optional arguments */
  emit(event, ...args) {
    const list = this.handlers[event] || [];
    list.forEach(h => {
      try { h(...args); } catch (e) { console.error('Event handler error', e); }
    });
  }
}

export const eventEmitter = new EventEmitter();
