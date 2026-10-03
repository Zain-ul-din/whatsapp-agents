import { Channel } from '../channel/channel';
import { runAgent } from './run-agent';
import { MessagingQueue } from './messaging-queue';

export function agentsOrchestration(channel: Channel) {
  const queue = new MessagingQueue();

  const processMessage = async () => {
    const message = queue.peek();

    const messages = [...channel.getMessages(message.senderId)];
    if (messages.length > 0 && messages.at(-1)?.id !== message.id)
      messages.push({ ...message, role: 'user' });

    const response = await runAgent(
      messages.map((msg) => {
        return {
          role: msg.role,
          content: msg.content
        };
      })
    );

    if (message.channel == 'WhatsAppBaileys') {
      await channel.respond({
        recipientId: message.senderId,
        content: response,
        baileysMsg: message.waMsg
      });
    }

    queue.dequeue();
    if (!queue.isEmpty()) await processMessage();
  };

  channel.onMessage(async (message) => {
    if (queue.isEmpty()) process.nextTick(() => processMessage());
    queue.enqueue(message);
  });
}
