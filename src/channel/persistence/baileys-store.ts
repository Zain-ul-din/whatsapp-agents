import makeWASocket, { proto, WAMessageKey } from '@whiskeysockets/baileys';
import DataBase from 'better-sqlite3';

const path = `${process.cwd()}/stores/baileys.db`;
const db = new DataBase(path);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    jid TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (jid, id)
  )
`);

const insertMsg = db.prepare('INSERT OR REPLACE INTO messages (jid, id, data) VALUES (?, ?, ?)');
const getMsg = db.prepare('SELECT data FROM messages WHERE jid = ? AND id = ?');

const listMessages = db.prepare(`
  SELECT * FROM messages
  WHERE jid = ?
  ORDER BY rowid DESC
  LIMIT ?
`);

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

export function loadMessages(jid: string, count: number) {
  const rows = listMessages.all(jid, count) as {
    data: string;
    jid: string;
    id: string;
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
    insertMsg.run(msg.key.remoteJid, msg.key.id, JSON.stringify(msg));
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
