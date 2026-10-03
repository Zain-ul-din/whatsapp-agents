import Exa from 'exa-js';
import { tool } from 'ai';
import z from 'zod';
import { encode } from '@toon-format/toon';

export const webSearch = tool({
  description: 'Search web',
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async ({ query }) => {
    const exa = new Exa(process.env.EXA_API_KEY);

    const result = await exa.search(query, {
      contents: { highlights: true }
    });

    return encode(
      result.results.map((result) => {
        return result;
      })
    );
  }
});
