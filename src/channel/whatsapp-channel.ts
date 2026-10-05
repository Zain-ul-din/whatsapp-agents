import {
  makeWASocket,
  AuthenticationState,
  BaileysEventMap,
  DisconnectReason,
  WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { Channel } from './channel';
import { EventEmitter } from 'node:events';
import { ChannelMessage, ContextMessage } from './types/channel-message';
import { ChannelName } from './types/channel-name';
import { ChannelRespondPayload } from './types/channel-respond-payload';
import { claimMessage, loadMessages, usePersistMessages } from './persistence/baileys-store';

type WhatsAppChannelOptions = {
  auth: AuthenticationState;
  saveCreds: () => Promise<void>;
};

type CustomEventMap = {
  'connection.qrcode': [qrcode: string];
  'connection.succeeded': [];
  'connection.closed': [statusCode: number];
};
type CustomEventKeys = keyof CustomEventMap;

type EventMap = CustomEventMap & { [K in keyof BaileysEventMap]: [data: BaileysEventMap[K]] };

export class WhatsAppChannel extends Channel<WhatsAppChannelOptions, EventMap> {
  private socket: ReturnType<typeof makeWASocket>;
  private ev: EventEmitter<CustomEventMap>;
  private socketListeners: Array<(socket: ReturnType<typeof makeWASocket>) => void> = [];
  private connected = false;
  private buffers = new Map<string, ChannelMessage[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private static throttleDelay: number = 2_000;

  private readonly ignoreJIDs = ['@g.us', '@broadcast', '@newsletter'];

  channelName: ChannelName = 'WhatsAppBaileys';

  private static readonly customEvents: readonly CustomEventKeys[] = [
    'connection.qrcode',
    'connection.succeeded',
    'connection.closed'
  ];

  constructor(options: WhatsAppChannelOptions) {
    super(options);
    this.socket = this.makeSocket();
    this.ev = new EventEmitter<CustomEventMap>();
  }

  override on<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): this {
    if (WhatsAppChannel.customEvents.includes(event as CustomEventKeys)) {
      this.ev.on(
        event as CustomEventKeys,
        callback as (...args: CustomEventMap[CustomEventKeys]) => void
      );
    } else {
      const attach = (socket: ReturnType<typeof makeWASocket>) => {
        socket.ev.on(
          event as keyof BaileysEventMap,
          callback as (data: BaileysEventMap[keyof BaileysEventMap]) => void
        );
      };
      this.socketListeners.push(attach);
      attach(this.socket);
    }
    return this;
  }

  override onMessage(
    callback: (messages: ContextMessage[], replyTo: ChannelMessage) => void
  ): this {
    const filterMessages = (msgs: WAMessage[]) => {
      const filteredMessages: ChannelMessage[] = [];
      for (const m of msgs) {
        if (m.key.fromMe) continue;
        const text = m.message?.conversation ?? m.message?.extendedTextMessage?.text;
        if (!text || !m.key.remoteJid || !m.key.id) continue;
        if (this.ignoreJIDs.some((id) => m.key.remoteJid?.endsWith(id))) continue;
        if (!claimMessage(m)) continue;
        filteredMessages.push({
          id: m.key.id,
          content: text,
          senderId: m.key.remoteJid,
          channel: 'WhatsAppBaileys',
          waMsg: m
        });
      }
      return filteredMessages;
    };

    const handleNewMessages = (messages: WAMessage[]) => {
      for (const message of filterMessages(messages)) {
        const jid = message.senderId;
        const buffer = this.buffers.get(jid) ?? [];
        buffer.push(message);
        const timer = this.timers.get(jid);
        this.buffers.set(jid, buffer);
        if (timer) clearTimeout(timer);

        const timeout = setTimeout(() => {
          this.timers.delete(jid);
          this.buffers.delete(jid);

          const ordered = buffer.sort((a, b) => {
            const aTime =
              Number(a.channel === 'WhatsAppBaileys' && a.waMsg?.messageTimestamp?.toString()) || 0;
            const bTime =
              Number(b.channel === 'WhatsAppBaileys' && b.waMsg?.messageTimestamp?.toString()) || 0;
            return aTime - bTime || a.id.localeCompare(b.id);
          });

          const first = ordered[0];
          const timestamp =
            Number(
              first.channel === 'WhatsAppBaileys' && first.waMsg?.messageTimestamp?.toString()
            ) || 0;
          const bufferedIds = new Set(ordered.map((m) => m.id));
          const history: ContextMessage[] = loadMessages(
            jid,
            { createdAt: timestamp, id: first.id },
            100
          )
            .filter((m) => !bufferedIds.has(m.id))
            .flatMap((m): ContextMessage[] => {
              const text =
                m.data.message?.conversation ?? m.data.message?.extendedTextMessage?.text;
              return text
                ? [
                    {
                      id: m.id,
                      senderId: jid,
                      channel: 'WhatsAppBaileys',
                      content: text,
                      role: m.data.key?.fromMe ? 'assistant' : 'user'
                    }
                  ]
                : [];
            });
          callback(
            [...history, ...ordered.map((m): ContextMessage => ({ ...m, role: 'user' }))],
            ordered[ordered.length - 1]
          );
        }, WhatsAppChannel.throttleDelay);

        this.timers.set(jid, timeout);
      }
    };

    this.on('messages.upsert', (event) => {
      if (event.type === 'notify') handleNewMessages(event.messages);
    });

    return this;
  }

  override async respond(payload: ChannelRespondPayload) {
    await this.socket.sendMessage(
      payload.recipientId,
      { text: payload.content },
      {
        quoted: payload.baileysMsg as WAMessage
      }
    );
    return this;
  }

  // override getMessages(senderId: string) {
  //   const dbMessages = loadMessages(senderId, 100);
  //   const channelMessages: (ChannelMessage & {
  //     role: 'user' | 'assistant';
  //   })[] = [];

  //   this.socket.fetchMessageHistory(50,  { id: "",   remoteJid: "" }, 0);

  //   for (const m of dbMessages) {
  //     if (!m.data.message) continue;
  //     const text = m.data.message.conversation ?? m.data.message.extendedTextMessage?.text;
  //     if (this.ignoreJIDs.find((id) => m.jid.endsWith(id))) continue;
  //     if (!text) continue;

  //     channelMessages.push({
  //       id: m.id,
  //       senderId: m.jid,
  //       channel: 'WhatsAppBaileys',
  //       content: text,
  //       role: m.data.key?.fromMe ? 'assistant' : 'user'
  //     });
  //   }

  //   return channelMessages;
  // }

  async connect(): Promise<this> {
    if (this.connected) return this;
    this.connected = true;
    try {
      await new Promise<void>((resolve, reject) => {
        this.attachConnectionListeners(this.socket, resolve, reject);
      });
    } catch (error) {
      this.connected = false;
      throw error;
    }
    return this;
  }

  makeSocket(): ReturnType<typeof makeWASocket> {
    const socket = makeWASocket({ auth: this.options.auth, syncFullHistory: true });
    usePersistMessages(socket);
    return socket;
  }

  private attachConnectionListeners(
    socket: ReturnType<typeof makeWASocket>,
    resolve: () => void,
    reject: (reason: Error) => void
  ): void {
    socket.ev.on('creds.update', this.options.saveCreds);

    socket.ev.on('connection.update', (update) => {
      if (socket !== this.socket) return;
      const { connection, lastDisconnect, qr } = update;
      if (qr) this.ev.emit('connection.qrcode', qr);

      if (connection === 'close') {
        const closedStatusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        if (closedStatusCode === DisconnectReason.loggedOut) {
          this.connected = false;
          this.ev.emit('connection.closed', closedStatusCode);
          reject(new Error(`WhatsApp connection closed: ${closedStatusCode}`));
          return;
        }

        this.socket = this.makeSocket();
        for (const attach of this.socketListeners) attach(this.socket);
        this.attachConnectionListeners(this.socket, resolve, reject);
      } else if (connection === 'open') {
        this.ev.emit('connection.succeeded');
        resolve();
      }
    });
  }
}
