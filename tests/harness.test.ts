import 'dotenv/config';
import { runAgent } from '../src/agents/run-agent';

const prompt = process.argv[2];

async function test() {
  const text = await runAgent(prompt);
  console.log(text);
}

test();
