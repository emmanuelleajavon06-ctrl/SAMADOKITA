# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN apk add --no-cache postgresql-client openssl && \
    addgroup --system --gid 1001 nest && \
    adduser --system --uid 1001 nest
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER nest
EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]
