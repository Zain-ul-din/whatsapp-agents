import { ChannelMessage } from '../channel/types/channel-message';

export class MessagingQueue {
  messages: ChannelMessage[];

  constructor() {
    this.messages = [];
  }

  enqueue(message: ChannelMessage) {
    const existingIdx = this.messages.findIndex((m) => {
      return m.senderId === message.senderId;
    });
    if (existingIdx !== -1) this.messages[existingIdx] = message;
    else this.messages.push(message);
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
