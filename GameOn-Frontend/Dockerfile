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
COPY tsconfig.json .
COPY README.md .
RUN groupadd -r nonroot && useradd -m -r -g nonroot nonroot && chown -R nonroot:nonroot /app
USER nonroot
EXPOSE 8081 19000 19001 19002
CMD ["npm","start"]

