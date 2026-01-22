FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the frontend
RUN npm run build

# ENV PORT=3000 (Let Platform set this)
# EXPOSE (Removed to let Platform manage ports)



CMD ["node", "mock-server.js"]


