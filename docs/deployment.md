# Deployment

## Docker

Build the image:

```bash
docker build -t whatsapp-agents .
```

Run it with your `.env` and persistent volumes for the WhatsApp session, the message store and the agent instructions:

```bash
docker run -it --name whatsapp-agents \
  --env-file .env \
  -v "$PWD/auth_info_baileys:/usr/src/app/auth_info_baileys" \
  -v "$PWD/stores:/usr/src/app/stores" \
  -v "$PWD/agents:/usr/src/app/agents" \
  whatsapp-agents
```

On the first run, scan the QR code printed in the logs (`docker logs -f whatsapp-agents`).
