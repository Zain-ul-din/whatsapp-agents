import z from 'zod';
import { PiiDetector, PiiSpan } from './types';

const responseSchema = z.object({
  results: z.array(
    z.array(
      z.object({
        start: z.number().int().nonnegative(),
        end: z.number().int().nonnegative(),
        label: z.string().regex(/^[A-Z_]+$/),
        score: z.number()
      })
    )
  )
});

/**
 * Client for the GLiNER detection service (names, addresses and other unstructured data).
 * Spans are checked against the original text so a bad response can't corrupt a message.
 */
export function createModelDetector(options: { url: string; timeoutMs: number }): PiiDetector {
  return async (texts) => {
    if (texts.length === 0) return [];
    const res = await fetch(`${options.url}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(options.timeoutMs)
    });
    if (!res.ok) throw new Error(`PII detector responded with ${res.status}`);

    const { results } = responseSchema.parse(await res.json());
    if (results.length !== texts.length)
      throw new Error('PII detector returned wrong result count');

    return results.map((entities, i): PiiSpan[] =>
      entities
        .filter((e) => e.end <= texts[i].length && texts[i].slice(e.start, e.end).trim() !== '')
        .map(({ start, end, label }) => ({ start, end, label }))
    );
  };
}
