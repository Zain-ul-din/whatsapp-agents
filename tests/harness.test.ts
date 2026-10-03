import 'dotenv/config';
import { runAgent } from '../src/agents/run-agent';

const prompt = process.argv[2];

async function test() {
  const text = await runAgent([
    {
      role: 'user',
      content: prompt
    }
  ]);
  console.log(text);
}

test();
