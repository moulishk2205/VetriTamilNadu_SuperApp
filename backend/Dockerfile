# ---------- build stage ----------
# Node 22 LTS (supported to April 2027). Node 20 reached end of life in April 2026.
FROM node:22-alpine AS build
WORKDIR /app
# Prisma needs openssl at generate time
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ---------- runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package*.json ./
# Prod deps only. The Prisma CLI is a production dependency (needed for
# `prisma migrate deploy` at boot). No TypeScript runtime (ts-node/tsx) is installed — the seed
# runs as compiled JS, so the ts-node config crash is structurally impossible.
RUN npm ci --omit=dev && npm cache clean --force
# Schema first, then generate the client against it in-image (deterministic).
COPY prisma ./prisma
RUN npx prisma generate
# Compiled app + compiled seed (dist/main.js and dist/prisma/seed.js).
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/storage && chown node:node /app/storage
# Run as the image's unprivileged `node` user. App files stay root-owned and
# read-only to the process; only the storage directory is writable.
USER node
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
