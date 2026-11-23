import { existsSync, readFileSync, mkdirSync } from 'node:fs';

const root = `${process.cwd()}/agents`;
const instructionsPath = `${root}/instructions.md`;
const fallbackInstructions =
  'You are a helpful assistant replying on WhatsApp. Keep replies short.';

if (!existsSync(root)) mkdirSync(root);

export function systemInstructions() {
  if (!existsSync(instructionsPath)) return fallbackInstructions;
  return readFileSync(instructionsPath, 'utf8');
}
