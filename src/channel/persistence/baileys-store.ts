import makeWASocket, { proto, WAMessageKey } from '@whiskeysockets/baileys';
import DataBase from 'better-sqlite3';

const path = `${process.cwd()}/stores/baileys.db`;
const db = new DataBase(path);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    jid TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (jid, id)
  )
`);

const columns = db.pragma('table_info(messages)') as { name: string }[];
for (const column of ['created_at', 'updated_at']) {
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE messages ADD COLUMN ${column} INTEGER NOT NULL DEFAULT 0`);
  }
}

function messageTime(msg: proto.IWebMessageInfo): number {
  const value = Number(msg.messageTimestamp?.toString());
  return Number.isFinite(value) && value > 0 ? value : 0;
}

const legacyRows = db.prepare('SELECT jid, id, data FROM messages WHERE created_at = 0').all() as {
  jid: string;
  id: string;
  data: string;
}[];
const backfill = db.prepare(
  'UPDATE messages SET created_at = ?, updated_at = ? WHERE jid = ? AND id = ?'
);
db.transaction(() => {
  for (const row of legacyRows) {
    const timestamp = messageTime(JSON.parse(row.data) as proto.IWebMessageInfo);
    backfill.run(timestamp, Math.floor(Date.now() / 1000), row.jid, row.id);
  }
})();

const insertMsg = db.prepare(`
  INSERT INTO messages (jid, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(jid, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);
const getMsg = db.prepare('SELECT data FROM messages WHERE jid = ? AND id = ?');

const listMessages = db.prepare(`
  SELECT * FROM messages
  WHERE jid = ? AND (created_at < ? OR (created_at = ? AND id < ?))
  ORDER BY created_at DESC, id DESC
  LIMIT ?
`);
db.exec(
  'CREATE INDEX IF NOT EXISTS messages_jid_created_id ON messages(jid, created_at DESC, id DESC)'
);

db.exec(`
  CREATE TABLE IF NOT EXISTS processed_messages (
    jid TEXT NOT NULL,
    id TEXT NOT NULL,
    PRIMARY KEY (jid, id)
  )
`);
const markProcessed = db.prepare(
  'INSERT OR IGNORE INTO processed_messages (jid, id) VALUES (?, ?)'
);

export function claimMessage(msg: proto.IWebMessageInfo): boolean {
  if (!msg.key) return false;
  const { remoteJid, id } = msg.key;
  return !!remoteJid && !!id && markProcessed.run(remoteJid, id).changes > 0;
}

export function getMessage(key: WAMessageKey): proto.IWebMessageInfo | undefined {
  const row = getMsg.get(key.remoteJid, key.id) as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as proto.IWebMessageInfo) : undefined;
}

export function loadMessages(
  jid: string,
  before: { createdAt: number; id: string },
  count: number
) {
  const rows = listMessages.all(jid, before.createdAt, before.createdAt, before.id, count) as {
    data: string;
    jid: string;
    id: string;
    created_at: number;
    updated_at: number;
  }[];
  return rows
    .map((r) => {
      const data = JSON.parse(r.data) as proto.IWebMessageInfo;
      return { ...r, data: data };
    })
    .reverse();
}

function saveMessage(msg: proto.IWebMessageInfo) {
  if (!msg || !msg.key) return;
  if (msg.key.remoteJid && msg.key.id && msg.message) {
    insertMsg.run(
      msg.key.remoteJid,
      msg.key.id,
      JSON.stringify(msg),
      messageTime(msg),
      Math.floor(Date.now() / 1000)
    );
  }
}

export function usePersistMessages(socket: ReturnType<typeof makeWASocket>) {
  socket.ev.process((events) => {
    // populate message store
    if (events['messages.upsert']) {
      for (const msg of events['messages.upsert'].messages) {
        saveMessage(msg);
      }
    }

    // Apply message updates (status changes, reactions, poll votes)
    if (events['messages.update']) {
      for (const { key, update } of events['messages.update']) {
        const existing = getMessage(key);
        if (existing) {
          saveMessage({
            ...existing,
            ...update,
            key: existing.key,
            message: update.message ? { ...existing.message, ...update.message } : existing.message
          });
        }
      }
    }

    // History sync
    if (events['messaging-history.set']) {
      for (const msg of events['messaging-history.set'].messages) {
        if (msg.key.id) {
          saveMessage(msg);
        }
      }
    }
  });
}

// Appendix:
// https://baileys.wiki/concepts/data-store#data-store
