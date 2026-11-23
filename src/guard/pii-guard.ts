import { CountryCode } from 'libphonenumber-js/max';
import { detectPatterns, mergeSpans } from './patterns';
import { PiiDetector, PiiSpan } from './types';
import { PiiVault } from './vault';

const PLACEHOLDER = /\[([A-Z][A-Z_]*_\d+)\]/g;

type Message = { id: string; content: string };

/**
 * Swaps personal data for per-chat placeholders before text reaches the model,
 * and swaps them back in the reply. Decoding only ever reads the same chat's map.
 */
export class PiiGuard {
  constructor(
    private vault: PiiVault,
    private options: { modelDetector?: PiiDetector; defaultCountry?: CountryCode } = {}
  ) {}

  /** Encodes chat messages, reusing earlier results so history isn't re-scanned every turn. */
  async encodeMessages(chatId: string, messages: Message[]): Promise<string[]> {
    const encoded = messages.map((m) => this.vault.getEncodedMessage(chatId, m.id, m.content));
    const pending = messages.filter((_, i) => encoded[i] === undefined);
    const fresh = await this.encodeTexts(
      chatId,
      pending.map((m) => m.content)
    );

    let next = 0;
    return messages.map((m, i) => {
      const cached = encoded[i];
      if (cached !== undefined) return cached;
      const result = fresh[next++];
      this.vault.setEncodedMessage(chatId, m.id, m.content, result);
      return result;
    });
  }

  async encodeTexts(chatId: string, texts: string[]): Promise<string[]> {
    const spans = await this.detect(texts);
    return texts.map((text, i) => this.replaceSpans(chatId, text, spans[i]));
  }

  /** Restores placeholders issued in this chat; anything else is left untouched. */
  decode(chatId: string, text: string): string {
    return text.replace(PLACEHOLDER, (match, token: string) => {
      const value = this.vault.valueFor(chatId, token);
      if (value === undefined) {
        console.warn(`pii-guard: unknown placeholder ${token} left as-is`);
        return match;
      }
      return value;
    });
  }

  /** True if text holds structured personal data or a placeholder (used to guard tool inputs). */
  containsPii(text: string): boolean {
    return (
      text.match(PLACEHOLDER) !== null ||
      detectPatterns(text, this.options.defaultCountry).length > 0
    );
  }

  private async detect(texts: string[]): Promise<PiiSpan[][]> {
    const patternSpans = texts.map((t) => detectPatterns(t, this.options.defaultCountry));
    const { modelDetector } = this.options;
    if (!modelDetector || texts.length === 0) return patternSpans;

    try {
      const modelSpans = await modelDetector(texts);
      // Pattern matches are validated, so they win over model guesses on overlap
      return patternSpans.map((spans, i) => mergeSpans(spans, modelSpans[i] ?? []));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`pii-guard: model detector unavailable, using patterns only (${reason})`);
      return patternSpans;
    }
  }

  private replaceSpans(chatId: string, text: string, spans: PiiSpan[]): string {
    let out = '';
    let cursor = 0;
    for (const span of [...spans].sort((a, b) => a.start - b.start)) {
      if (span.start < cursor) continue;
      const token = this.vault.tokenFor(chatId, span.label, text.slice(span.start, span.end));
      out += text.slice(cursor, span.start) + `[${token}]`;
      cursor = span.end;
    }
    return out + text.slice(cursor);
  }
}
