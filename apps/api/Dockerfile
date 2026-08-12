FROM node:24-alpine
WORKDIR /app

RUN corepack enable

# Copy service files in apps/api directory context
COPY package.json ./
RUN corepack pnpm install --no-frozen-lockfile

COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json ./

EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["npx", "tsx", "src/server.ts"]
