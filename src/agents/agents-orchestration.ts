import { generateText, streamText } from 'ai';

import { Channel } from '../channel/channel';
import { openai } from './providers/openai-subscription';

export function agentsOrchestration(channel: Channel) {
  channel.onMessage(async (message) => {
    console.log('got new message: ', message);
    const res = streamText({
      model: openai('gpt-6-sol'),
      prompt: message.content,
      providerOptions: {
        openai: {
          store: false,
          instructions: 'You are a helpful assistant.'
        }
      }
    });

    let text = '';
    for await (const chunk of res.textStream) text += chunk;

    await channel.respond({
      recipientId: message.senderId,
      content: text
    });
  });
}
