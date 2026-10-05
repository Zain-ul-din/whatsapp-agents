import { ChannelMessage } from '../channel/types/channel-message';

export class MessagingQueue<T = ChannelMessage> {
  messages: T[];

  constructor() {
    this.messages = [];
  }

  enqueue(message: T) {
    this.messages.push(message);
  }

  dequeue() {
    return this.messages.shift();
  }

  isEmpty() {
    return this.messages.length === 0;
  }

  peek() {
    return this.messages[0];
  }

  size() {
    return this.messages.length;
  }
}
