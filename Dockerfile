FROM node:20-alpine

# Toolchain for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ \
  && corepack enable

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY tsconfig.json ./
COPY src ./src

# Persist WhatsApp auth, the message store and agent instructions across restarts
VOLUME ["/usr/src/app/auth_info_baileys", "/usr/src/app/stores", "/usr/src/app/agents"]

CMD ["pnpm", "start"]
