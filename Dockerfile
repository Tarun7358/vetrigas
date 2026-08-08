# Multi-Stage Production Dockerfile for Vetri Indane (Render Deployment)
# Stage 1: Build Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build & Run Express Backend
FROM node:20-alpine AS runner
WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

COPY backend/ ./
COPY database/ /app/database/
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Build Backend TypeScript
RUN npm run build

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
