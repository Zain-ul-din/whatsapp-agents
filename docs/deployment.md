# Deployment

## Docker Compose (recommended)

Runs the bot and the PII detection service together:

```bash
docker compose up -d --build
docker compose logs -f bot   # scan the QR code on first run
```

The WhatsApp session, message store, PII vault and agent instructions are kept in `auth_info_baileys/`, `stores/` and `agents/` on the host.

## Bot only

```bash
docker build -t whatsapp-agents .
docker run -it --env-file .env \
  -v "$PWD/auth_info_baileys:/usr/src/app/auth_info_baileys" \
  -v "$PWD/stores:/usr/src/app/stores" \
  -v "$PWD/agents:/usr/src/app/agents" \
  whatsapp-agents
```

Without `PII_DETECTOR_URL`, the PII guard still runs, using pattern matching only (phone numbers, emails, CNICs, cards, IBANs, passwords and OTPs). Names and addresses need the detection service.

## Back up the vault key

Placeholders are decrypted with `PII_VAULT_KEY`, or the key in `stores/pii-vault.key` if that's unset. If you lose the key, earlier placeholders can no longer be restored.
