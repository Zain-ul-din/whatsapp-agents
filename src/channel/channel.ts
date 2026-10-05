import { ChannelMessage, ContextMessage } from './types/channel-message';
import { ChannelName } from './types/channel-name';
import { ChannelRespondPayload } from './types/channel-respond-payload';

export abstract class Channel<
  Options extends {} = {},
  Events extends { [K in keyof Events]: unknown[] } = {}
> {
  protected options: Options;
  abstract readonly channelName: ChannelName;

  constructor(options: Options) {
    this.options = options;
  }

  abstract on<K extends keyof Events>(event: K, callback: (...args: Events[K]) => void): this;

  // TODO: send channel metadata along side it
  abstract onMessage(callback: (messages: ContextMessage[], replyTo: ChannelMessage) => void): this;

  // TODO: send channel metadata along side it
  abstract respond(payload: ChannelRespondPayload): Promise<this>;
}
