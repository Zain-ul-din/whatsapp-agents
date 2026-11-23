import { Channel } from '../channel/channel';
import { runAgent } from './run-agent';
import { ChannelMessage, ContextMessage } from '../channel/types/channel-message';
import { MessagingQueue } from './messaging-queue';
import { piiGuard } from '../guard';

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

        try {
          // The model only ever sees placeholders; real values stay in this chat's vault
          const chatId = replyTo.senderId;
          const encoded = await piiGuard.encodeMessages(chatId, messages);
          const response = await runAgent(
            messages.map((msg, i) => ({ role: msg.role, content: encoded[i] }))
          );
          const reply = piiGuard.decode(chatId, response);

          if (replyTo.channel == 'WhatsAppBaileys') {
            await channel.respond({
              recipientId: replyTo.senderId,
              content: reply,
              baileysMsg: replyTo.waMsg
            });
          }
        } catch (err) {
          // Log the reason only: errors can carry request payloads with message content
          const reason = err instanceof Error ? err.message : String(err);
          console.error(`agent failed to process message ${replyTo.id}: ${reason}`);
        } finally {
          // Always move past this item so one failure can't block the queue
          queue.dequeue();
        }
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
