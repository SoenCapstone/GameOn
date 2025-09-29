FROM node:20-bullseye
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
EXPOSE 8081 19000 19001 19002
CMD ["npm","start"]
