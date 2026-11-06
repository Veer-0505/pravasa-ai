# Multi-stage Dockerfile for Pravasa AI
# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy backend source & data
COPY server/ ./server/

# Copy built frontend from Stage 1
COPY --from=client-builder /app/client/dist ./client/dist

# Ensure uploads directory exists
RUN mkdir -p server/uploads/photos server/uploads/videos

EXPOSE 5000

WORKDIR /app/server
CMD ["node", "index.js"]

