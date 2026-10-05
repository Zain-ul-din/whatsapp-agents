import { Channel } from '../channel/channel';
import { runAgent } from './run-agent';
import { ChannelMessage, ContextMessage } from '../channel/types/channel-message';
import { MessagingQueue } from './messaging-queue';

type PendingMessage = { messages: ContextMessage[]; replyTo: ChannelMessage };

export function agentsOrchestration(channel: Channel) {
  const queue = new MessagingQueue<PendingMessage>();
  let processing = false;

  const processMessage = async () => {
    if (processing) return;
    processing = true;
    try {
      while (!queue.isEmpty()) {
        const pending = queue.peek();
        if (!pending) break;

        const { messages, replyTo } = pending;

        const response = await runAgent(
          messages.map((msg) => {
            return {
              role: msg.role,
              content: msg.content
            };
          })
        );

        if (replyTo.channel == 'WhatsAppBaileys') {
          await channel.respond({
            recipientId: replyTo.senderId,
            content: response,
            baileysMsg: replyTo.waMsg
          });
        }

        queue.dequeue();
      }
    } finally {
      processing = false;
    }
  };

  channel.onMessage((messages, replyTo) => {
    queue.enqueue({ messages, replyTo });
    void processMessage();
  });
}
