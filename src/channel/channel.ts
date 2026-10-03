export type ChannelMessage = {
  senderId: string;
  content: string;
};

export type ChannelRespondPayload = {
  recipientId: string;
  content: string;
};

export abstract class Channel<
  Options extends {} = {},
  Events extends { [K in keyof Events]: unknown[] } = {}
> {
  protected options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  abstract on<K extends keyof Events>(event: K, callback: (...args: Events[K]) => void): this;

  // TODO: send channel metadata along side it
  abstract onMessage(callback: (msg: ChannelMessage) => void): this;

  // TODO: send channel metadata along side it
  abstract respond(payload: ChannelRespondPayload): Promise<this>;
}
