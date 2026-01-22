FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the frontend
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", "mock-server.js"]
