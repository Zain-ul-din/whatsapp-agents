import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PiiGuard } from '../../src/guard/pii-guard';
import { PiiDetector } from '../../src/guard/types';
import { PiiVault } from '../../src/guard/vault';

const chatA = '923001111111@s.whatsapp.net';
const chatB = '923002222222@s.whatsapp.net';

/** Stand-in for the model service: tags any capitalised word in `names` as PERSON. */
const fakeModel =
  (names: string[]): PiiDetector =>
  async (texts) =>
    texts.map((text) =>
      names.flatMap((name) => {
        const start = text.indexOf(name);
        return start < 0 ? [] : [{ start, end: start + name.length, label: 'PERSON' }];
      })
    );

describe('PiiGuard', () => {
  let dbPath: string;
  let key: Buffer;
  let vault: PiiVault;

  beforeEach(() => {
    dbPath = join(mkdtempSync(join(tmpdir(), 'pii-')), 'vault.db');
    key = randomBytes(32);
    vault = new PiiVault({ dbPath, masterKey: key });
  });
  afterEach(() => vault.close());

  it('replaces personal data and restores it in the reply', async () => {
    const guard = new PiiGuard(vault);
    const [encoded] = await guard.encodeTexts(chatA, ['call me on 0300 1234567']);
    expect(encoded).toBe('call me on [PHONE_1]');
    expect(guard.decode(chatA, 'Noted, we will call [PHONE_1].')).toBe(
      'Noted, we will call 0300 1234567.'
    );
  });

  it('gives each distinct value its own token and never reassigns one', async () => {
    const guard = new PiiGuard(vault, { modelDetector: fakeModel(['Ahmed', 'Bilal']) });
    const [first] = await guard.encodeTexts(chatA, ['Ahmed here']);
    const [second] = await guard.encodeTexts(chatA, ['Bilal and Ahmed']);
    expect(first).toBe('[PERSON_1] here');
    expect(second).toBe('[PERSON_2] and [PERSON_1]');
    expect(guard.decode(chatA, '[PERSON_1], [PERSON_2]')).toBe('Ahmed, Bilal');
  });

  it('treats different spellings of one phone number as the same value', async () => {
    const guard = new PiiGuard(vault);
    const encoded = await guard.encodeTexts(chatA, ['0300 1234567', '+92 300 1234567']);
    expect(encoded).toEqual(['[PHONE_1]', '[PHONE_1]']);
  });

  it('keeps chats isolated', async () => {
    const guard = new PiiGuard(vault);
    await guard.encodeTexts(chatA, ['call me on 0300 1234567']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Chat B never issued PHONE_1, so it must not resolve chat A's number
    expect(guard.decode(chatB, 'call [PHONE_1]')).toBe('call [PHONE_1]');
    // Chat B's own first phone gets its own PHONE_1, mapped to its own value
    await guard.encodeTexts(chatB, ['mine is 0321 7654321']);
    expect(guard.decode(chatB, '[PHONE_1]')).toBe('0321 7654321');
    expect(guard.decode(chatA, '[PHONE_1]')).toBe('0300 1234567');
    warn.mockRestore();
  });

  it('leaves invented placeholders untouched', () => {
    const guard = new PiiGuard(vault);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(guard.decode(chatA, 'email [EMAIL_9]')).toBe('email [EMAIL_9]');
    warn.mockRestore();
  });

  it('stores values encrypted and survives a restart with the same key', async () => {
    const guard = new PiiGuard(vault);
    await guard.encodeTexts(chatA, ['ali.khan@example.com']);
    vault.close();

    expect(readFileSync(dbPath).includes('ali.khan@example.com')).toBe(false);

    vault = new PiiVault({ dbPath, masterKey: key });
    expect(new PiiGuard(vault).decode(chatA, '[EMAIL_1]')).toBe('ali.khan@example.com');
  });

  it('prefers validated pattern matches over model guesses', async () => {
    const overlapping: PiiDetector = async (texts) =>
      texts.map(() => [{ start: 0, end: 12, label: 'PERSON' }]);
    const guard = new PiiGuard(vault, { modelDetector: overlapping });
    const [encoded] = await guard.encodeTexts(chatA, ['0300 1234567']);
    expect(encoded).toBe('[PHONE_1]');
  });

  it('falls back to patterns when the model service is down', async () => {
    const down: PiiDetector = async () => {
      throw new Error('connection refused');
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const guard = new PiiGuard(vault, { modelDetector: down });
    const [encoded] = await guard.encodeTexts(chatA, ['Ahmed, 0300 1234567']);
    expect(encoded).toBe('Ahmed, [PHONE_1]');
    warn.mockRestore();
  });

  it('reuses encoded history instead of re-scanning it', async () => {
    const model = vi.fn(fakeModel(['Ahmed']));
    const guard = new PiiGuard(vault, { modelDetector: model });
    const history = [{ id: 'm1', content: 'I am Ahmed' }];

    await guard.encodeMessages(chatA, history);
    const encoded = await guard.encodeMessages(chatA, [
      ...history,
      { id: 'm2', content: 'still Ahmed' }
    ]);

    expect(encoded).toEqual(['I am [PERSON_1]', 'still [PERSON_1]']);
    expect(model).toHaveBeenLastCalledWith(['still Ahmed']);
  });

  it('flags personal data and placeholders in tool input', () => {
    const guard = new PiiGuard(vault);
    expect(guard.containsPii('rice mills in Lahore')).toBe(false);
    expect(guard.containsPii('who owns 0300 1234567')).toBe(true);
    expect(guard.containsPii('[PERSON_1] company')).toBe(true);
  });
});
