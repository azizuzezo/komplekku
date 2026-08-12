FROM node:24-alpine
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps

RUN corepack pnpm install --no-frozen-lockfile

WORKDIR /app/apps/api
EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["npx", "tsx", "src/server.ts"]
