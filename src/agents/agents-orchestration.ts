import { streamText } from 'ai';

import { Channel } from '../channel/channel';
import { openai } from './providers/openai-subscription';
import { encode } from '@toon-format/toon';

export function agentsOrchestration(channel: Channel) {
  channel.onMessage(async (message) => {
    const previousMessages = [...channel.getMessages(message.senderId), message];
    console.log(JSON.stringify(previousMessages, null, 2));

    const res = streamText({
      model: openai('gpt-6-sol'),
      prompt: encode(previousMessages),
      providerOptions: {
        openai: {
          store: false,
          instructions: 'You are a WhatsApp helpful assistant.'
        }
      }
    });

    let text = '';
    for await (const chunk of res.textStream) text += chunk;

    if (message.channel == 'WhatsAppBaileys') {
      await channel.respond({
        recipientId: message.senderId,
        content: text,
        baileysMsg: message.waMsg
      });
    }
  });
}
