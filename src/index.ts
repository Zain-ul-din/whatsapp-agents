import 'dotenv/config';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { WhatsAppChannel } from './channel/whatsapp-channel';
import { agentsOrchestration } from './agents/agents-orchestration';
import qrcode from 'qrcode-terminal';

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const channel = new WhatsAppChannel({ auth: state, saveCreds });

  channel
    .on('connection.qrcode', (qr) => {
      qrcode.generate(qr, { small: true });
    })
    .on('connection.succeeded', () => {
      console.log('connected');
      agentsOrchestration(channel);
    })
    .on('connection.closed', (statusCode) => {
      console.log('connection closed: ', statusCode);
    })
    .on('messaging-history.set', (event) => {
      console.log('messages length: ', event.messages.length);
      for (const msg of event.messages) {
        console.log(JSON.stringify(msg, null, 2));
      }
    });

  await channel.connect();
}

main();
