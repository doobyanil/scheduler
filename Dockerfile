# Multi-stage build for Academic Calendar Organizer
# This Dockerfile builds both frontend and backend

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Stage 3: Production Image
FROM node:18-alpine
WORKDIR /app

# Install serve for frontend static files
RUN npm install -g serve

# Copy backend
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node src/server.js &' >> /app/start.sh && \
    echo 'cd /app/frontend && serve -s dist -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 5000 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start both services
CMD ["/app/start.sh"]
