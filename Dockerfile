FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# RUN npm install --production
# Skipped npm install because mock-server.js uses only native modules (http, fs, path)
# This avoids installing heavy frontend dependencies for the backend container.

COPY . .

# Create data directory for volume
RUN mkdir -p /app/data

# Exposure port
EXPOSE 3001

# Start command
CMD ["node", "mock-server.js"]
