FROM node:20-bullseye
RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node --chmod=0444 package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --fund=false
COPY --chown=node:node app ./app
COPY --chown=node:node assets ./assets
COPY --chown=node:node components ./components
COPY --chown=node:node constants ./constants
COPY --chown=node:node hooks ./hooks
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node app.json tsconfig.json eslint.config.js expo-env.d.ts ./
EXPOSE 8081 19000 19001 19002
CMD ["npm","start"]
