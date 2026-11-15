import { EventEmitter, eventEmitter } from '../../systems/eventEmitter.js';

describe('EventEmitter System', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test('registers and emits events with arguments', () => {
    const fn = jest.fn();
    emitter.on('testEvent', fn);
    emitter.emit('testEvent', 123, 'hello');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(123, 'hello');
  });

  test('supports multiple handlers for the same event', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    emitter.on('multi', fn1);
    emitter.on('multi', fn2);
    emitter.emit('multi', 'arg');
    expect(fn1).toHaveBeenCalledWith('arg');
    expect(fn2).toHaveBeenCalledWith('arg');
  });

  test('a throwing handler does not prevent subsequent handlers from running', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const throwingFn = jest.fn(() => {
      throw new Error('Boom');
    });
    const succeedingFn = jest.fn();

    emitter.on('failSafe', throwingFn);
    emitter.on('failSafe', succeedingFn);

    emitter.emit('failSafe');

    expect(throwingFn).toHaveBeenCalled();
    expect(succeedingFn).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('off removes a handler', () => {
    const fn = jest.fn();
    emitter.on('testOff', fn);
    emitter.off('testOff', fn);
    emitter.emit('testOff');
    expect(fn).not.toHaveBeenCalled();
  });

  test('singleton eventEmitter instance exists and works', () => {
    const fn = jest.fn();
    eventEmitter.on('singletonTest', fn);
    eventEmitter.emit('singletonTest', 42);
    expect(fn).toHaveBeenCalledWith(42);
    eventEmitter.off('singletonTest', fn);
  });
});
