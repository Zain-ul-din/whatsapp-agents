import { streamText } from 'ai';
import { openai } from './providers/openai-subscription';
import { tools } from './tools/tools';

export async function runAgent(prompt: string) {
  const res = streamText({
    model: openai('gpt-6-sol'),
    prompt: prompt,
    providerOptions: {
      openai: {
        store: false,
        instructions: 'You are a WhatsApp helpful assistant.'
      }
    },
    tools: tools
  });

  let text = '';
  for await (const chunk of res.textStream) text += chunk;

  return text;
}
