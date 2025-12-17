# Multi-stage Dockerfile for Strapi v5 backend
# Stage 1: Build the admin panel
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the Strapi admin panel
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for running native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code and built admin panel from builder stage
COPY --from=builder /app ./

# Create uploads directory if it doesn't exist
RUN mkdir -p public/uploads

# Expose Strapi port
EXPOSE 1337

# Start Strapi in production mode
CMD ["npm", "run", "start"]

