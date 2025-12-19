
# Build stage

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (use package-lock if present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source
COPY . .

# Build-time environment variables (only VITE_ vars are exposed to Vite)
ARG VITE_API_URL
ARG VITE_ANALYTICS_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ANALYTICS_KEY=${VITE_ANALYTICS_KEY}

# Create Vite production env file so values are baked into the build
RUN printf 'VITE_API_URL=%s\nVITE_ANALYTICS_KEY=%s\n' "${VITE_API_URL:-}" "${VITE_ANALYTICS_KEY:-}" > .env.production

# Build app
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Use a minimal custom config (overrides default)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

