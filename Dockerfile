FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create data directory for volume
RUN mkdir -p /app/data

# Exposure port
EXPOSE 3001

# Start command
CMD ["node", "mock-server.js"]
