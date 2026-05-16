FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

RUN npm ci --only=production

# Copy built files (if building locally)
COPY dist ./dist

# Copy source for tsx development
COPY package.json ./

EXPOSE 8080

CMD ["node", "dist/index.js"]