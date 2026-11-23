import { existsSync, readFileSync, mkdirSync } from 'node:fs';

const root = `${process.cwd()}/agents`;
const instructionsPath = `${root}/instructions.md`;
const fallbackInstructions =
  'You are a helpful assistant replying on WhatsApp. Keep replies short.';

if (!existsSync(root)) mkdirSync(root);

// Personal data is replaced before the model sees it; tell the model how to treat the placeholders
const privacyNote = `
## Personal data
Personal details in messages are replaced with placeholders like [PHONE_1] or [PERSON_1]. Treat each one as the real value: you may repeat a placeholder exactly as written and it will be shown to the customer correctly. Never guess, invent or alter placeholders, and never put them in tool calls.`;

export function systemInstructions() {
  const instructions = existsSync(instructionsPath)
    ? readFileSync(instructionsPath, 'utf8')
    : fallbackInstructions;
  return `${instructions}\n${privacyNote}`;
}
