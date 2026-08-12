FROM node:24-alpine
WORKDIR /app

# Enable corepack for pnpm support
RUN corepack enable

# Copy workspace configuration and dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies across workspace
RUN corepack pnpm install

WORKDIR /app/apps/api
EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["npx", "tsx", "src/server.ts"]
