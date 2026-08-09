FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# fluent-ffmpeg needs the ffmpeg executable at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .
RUN mkdir -p session tmp

EXPOSE 3000

CMD ["npm", "start"]