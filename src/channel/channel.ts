export abstract class Channel<Options, Events extends { [K in keyof Events]: unknown[] }> {
  protected options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  abstract on<K extends keyof Events>(event: K, callback: (...args: Events[K]) => void): this;
}
