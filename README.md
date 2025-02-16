# squirrellm

Lightweight Openrouter Chat Client. 

> **Work in Progress. Expect errors.**

## Preparation
1. [Clerk](https://clerk.com) : `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for authentication
2. [Openrouter](https://openrouter.ai) API Key
3. [Turso](https://turso.tech) (optional)

## Run
```bash
cp .env.example .env
cp docker-compose.yml.example docker-compose.yml
docker compose up -d
```
> Do not forget to set your .env file

## Development
```bash
cp .env.example .env
bun install
bun dev
```
