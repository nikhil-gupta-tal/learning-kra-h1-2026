FROM node:22-bookworm-slim

WORKDIR /app

RUN npm install --global pnpm@12.3.4

RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . ./
RUN pnpm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "pnpm run migration:run && pnpm run seed && exec pnpm run start:prod"]
