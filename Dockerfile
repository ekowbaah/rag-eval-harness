FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
COPY examples ./examples
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
USER node
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/examples ./examples
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["examples/support-v1.json", "--min", "groundedness=0.9"]
