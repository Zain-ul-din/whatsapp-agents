import Exa from 'exa-js';
import { tool } from 'ai';
import z from 'zod';
import { encode } from '@toon-format/toon';
import { piiGuard } from '../../guard';

export const webSearch = tool({
  description: 'Search web',
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async ({ query }) => {
    // Search queries leave our system, so they must never carry personal data
    if (piiGuard.containsPii(query)) {
      return 'Search blocked: the query contains personal data. Search with general terms only.';
    }

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
