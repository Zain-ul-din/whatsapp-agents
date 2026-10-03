import {
  makeWASocket,
  AuthenticationState,
  BaileysEventMap,
  DisconnectReason
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { Channel } from './channel';
import { EventEmitter } from 'node:events';

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

  private static readonly customEvents: readonly CustomEventKeys[] = [
    'connection.qrcode',
    'connection.succeeded',
    'connection.closed'
  ];

  constructor(options: WhatsAppChannelOptions) {
    super(options);
    this.socket = makeWASocket({ auth: this.options.auth });
    this.ev = new EventEmitter<CustomEventMap>();
  }

  override on<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): this {
    if (WhatsAppChannel.customEvents.includes(event as CustomEventKeys)) {
      this.ev.on(
        event as CustomEventKeys,
        callback as (...args: CustomEventMap[CustomEventKeys]) => void
      );
    } else {
      this.socket.ev.on(
        event as keyof BaileysEventMap,
        callback as (data: BaileysEventMap[keyof BaileysEventMap]) => void
      );
    }
    return this;
  }

  async connect(retries = 0) {
    this.socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) this.ev.emit('connection.qrcode', qr);

      if (connection === 'close') {
        const closedStatusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = closedStatusCode !== DisconnectReason.loggedOut && retries < 3;
        if (shouldReconnect) this.connect(retries + 1); // TODO: fix retries
        else this.ev.emit('connection.closed', closedStatusCode);
      } else if (connection === 'open') {
        this.ev.emit('connection.succeeded');
      }
    });
  }
}
