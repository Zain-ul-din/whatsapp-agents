import { stepCountIs, streamText } from 'ai';
import { openai } from './providers/openai-subscription';
import { tools } from './tools/tools';
import { systemInstructions } from './system-instructions';

export async function runAgent(prompt: string) {
  const res = streamText({
    model: openai('gpt-6-sol'),
    prompt: prompt,
    providerOptions: {
      openai: {
        store: false,
        instructions: systemInstructions()
      }
    },
    tools: tools,
    stopWhen: stepCountIs(5)
  });

  let text = '';
  for await (const chunk of res.textStream) text += chunk;

  return text;
}
