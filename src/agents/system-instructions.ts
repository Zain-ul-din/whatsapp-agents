import { existsSync, readFileSync, mkdirSync } from 'node:fs';

const root = `${process.cwd()}/agents`;
if (!existsSync(root)) mkdirSync(root);

export function systemInstructions() {
  const instructions = readFileSync(`${root}/instructions.md`, 'utf8');
  return instructions;
}
