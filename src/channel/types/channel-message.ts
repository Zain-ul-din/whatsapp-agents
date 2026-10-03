import { proto, WAMessage } from '@whiskeysockets/baileys';
import { ChannelName } from './channel-name';

type ChannelBase = {
  id: string;
  senderId: string;
  content: string;
  channel: ChannelName;
};

export type ChannelMessage =
  | (ChannelBase & {
      channel: 'WhatsAppBaileys';
      waMsg?: proto.IWebMessageInfo;
    })
  | (ChannelBase & {
      channel: 'WhatsAppOfficial';
    });
