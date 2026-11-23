import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';
import DataBase from 'better-sqlite3';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js/max';

/**
 * Persistent, per-chat map between placeholders and real values.
 *
 * - Every lookup is scoped by chat id, so one chat can never resolve another chat's token.
 * - Rows are append-only: a token, once issued, always means the same value in that chat.
 * - Values are encrypted at rest (AES-256-GCM); lookups use a keyed hash, never the raw value.
 */
export class PiiVault {
  private db: DataBase.Database;
  private encKey: Buffer;
  private hashKey: Buffer;
  private defaultCountry: CountryCode;

  constructor(options: { dbPath: string; masterKey: Buffer; defaultCountry?: CountryCode }) {
    this.defaultCountry = options.defaultCountry ?? 'PK';
    if (options.masterKey.length !== 32) throw new Error('PII vault key must be 32 bytes');
    this.encKey = Buffer.from(hkdfSync('sha256', options.masterKey, '', 'pii-vault:enc', 32));
    this.hashKey = Buffer.from(hkdfSync('sha256', options.masterKey, '', 'pii-vault:hash', 32));

    this.db = new DataBase(options.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pii_tokens (
        chat_id TEXT NOT NULL,
        token TEXT NOT NULL,
        label TEXT NOT NULL,
        value_hash TEXT NOT NULL,
        value_enc TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (chat_id, token),
        UNIQUE (chat_id, label, value_hash)
      );
      CREATE TABLE IF NOT EXISTS pii_encoded_messages (
        chat_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        encoded TEXT NOT NULL,
        PRIMARY KEY (chat_id, message_id)
      );
    `);
  }

  /** Returns the existing token for this value in this chat, or issues the next one. */
  tokenFor(chatId: string, label: string, value: string): string {
    const valueHash = this.hash(`${label}:${normalize(label, value, this.defaultCountry)}`);
    return this.db.transaction(() => {
      const existing = this.db
        .prepare('SELECT token FROM pii_tokens WHERE chat_id = ? AND label = ? AND value_hash = ?')
        .get(chatId, label, valueHash) as { token: string } | undefined;
      if (existing) return existing.token;

      const { count } = this.db
        .prepare('SELECT COUNT(*) AS count FROM pii_tokens WHERE chat_id = ? AND label = ?')
        .get(chatId, label) as { count: number };
      const token = `${label}_${count + 1}`;
      this.db
        .prepare(
          'INSERT INTO pii_tokens (chat_id, token, label, value_hash, value_enc, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(chatId, token, label, valueHash, this.encrypt(value), Math.floor(Date.now() / 1000));
      return token;
    })();
  }

  /** Resolves a token for this chat only; undefined if this chat never issued it. */
  valueFor(chatId: string, token: string): string | undefined {
    const row = this.db
      .prepare('SELECT value_enc FROM pii_tokens WHERE chat_id = ? AND token = ?')
      .get(chatId, token) as { value_enc: string } | undefined;
    return row ? this.decrypt(row.value_enc) : undefined;
  }

  getEncodedMessage(chatId: string, messageId: string, content: string): string | undefined {
    const row = this.db
      .prepare(
        'SELECT encoded FROM pii_encoded_messages WHERE chat_id = ? AND message_id = ? AND content_hash = ?'
      )
      .get(chatId, messageId, this.hash(content)) as { encoded: string } | undefined;
    return row?.encoded;
  }

  setEncodedMessage(chatId: string, messageId: string, content: string, encoded: string) {
    this.db
      .prepare(
        `INSERT INTO pii_encoded_messages (chat_id, message_id, content_hash, encoded) VALUES (?, ?, ?, ?)
         ON CONFLICT(chat_id, message_id) DO UPDATE SET content_hash = excluded.content_hash, encoded = excluded.encoded`
      )
      .run(chatId, messageId, this.hash(content), encoded);
  }

  /** Removes everything stored for a chat ("delete my data"). */
  forgetChat(chatId: string) {
    this.db.prepare('DELETE FROM pii_tokens WHERE chat_id = ?').run(chatId);
    this.db.prepare('DELETE FROM pii_encoded_messages WHERE chat_id = ?').run(chatId);
  }

  close() {
    this.db.close();
  }

  private hash(value: string): string {
    return createHmac('sha256', this.hashKey).update(value).digest('base64');
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
  }

  private decrypt(payload: string): string {
    const raw = Buffer.from(payload, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.encKey, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  }
}

/** Different spellings of the same value should share one token. */
function normalize(label: string, value: string, defaultCountry: CountryCode): string {
  switch (label) {
    case 'PHONE': {
      const phone = parsePhoneNumberFromString(value, defaultCountry);
      return phone ? phone.number : value.replace(/[^0-9+]/g, '');
    }
    case 'CARD':
    case 'CNIC':
    case 'IBAN':
    case 'BANK_ACCOUNT':
      return value.replace(/[^0-9A-Za-z+]/g, '').toUpperCase();
    default:
      return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }
}
