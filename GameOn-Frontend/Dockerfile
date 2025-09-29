FROM node:20-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts
COPY app/ app/
COPY assets/ assets/
COPY components/ components/
COPY constants/ constants/
COPY hooks/ hooks/
COPY scripts/ scripts/

# Copy config files
COPY app.json .
COPY eslint.config.js .
COPY expo-env.d.ts .
COPY tsconfig.json .
COPY README.md .
EXPOSE 8081 19000 19001 19002
CMD ["npm","start"]