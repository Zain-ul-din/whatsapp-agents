import { proto } from '@whiskeysockets/baileys';

export type ChannelRespondPayload = {
  recipientId: string;
  content: string;
  baileysMsg?: proto.IWebMessageInfo;
};
