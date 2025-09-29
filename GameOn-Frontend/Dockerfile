FROM node:20-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8081 19000 19001 19002
CMD ["npm","start"]