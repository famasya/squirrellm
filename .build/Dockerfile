FROM oven/bun:1.2.2-alpine
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:latest AS production
WORKDIR /app

COPY --from=0 /app/build ./build
COPY --from=0 /app/package.json ./
COPY --from=0 /app/bun.lockb ./
RUN bun install --production

EXPOSE 3000

CMD ["bun", "run", "start"]
