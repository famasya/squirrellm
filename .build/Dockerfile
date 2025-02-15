FROM oven/bun:1.2.2-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:latest AS production
WORKDIR /app

COPY --from=0 /app/build ./build
COPY --from=0 /app/package.json ./
COPY --from=0 /app/bun.lock ./
COPY --from=0 /app/drizzle.config.ts ./
COPY --from=0 /app/drizzle ./drizzle 

# Create the data directory and SQLite file
RUN mkdir -p /app/data && touch /app/data/squirrellm.sqlite

RUN bun install --production

EXPOSE 3000

CMD ["sh", "-c", "bun run migration migrate && bun run start"]
