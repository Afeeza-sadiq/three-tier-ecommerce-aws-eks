FROM node:20-alpine

WORKDIR /app

COPY app/backend/package*.json ./
RUN npm install --production

COPY app/backend/src ./src

ENV PORT=5000
EXPOSE 5000

USER node
CMD ["node", "src/index.js"]
