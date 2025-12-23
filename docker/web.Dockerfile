# Stage 1: Build the Web App
FROM docker.io/denoland/deno:2.6.1 AS builder

WORKDIR /app

# Copy monorepo
COPY . .

# Install dependencies (caches them in the image)
RUN deno install

# Build the web application
WORKDIR /app/apps/web
RUN deno task build

# Build the admin application
WORKDIR /app/apps/admin
RUN deno task build

# Stage 2: Serve with Nginx
FROM docker.io/nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Copy admin assets to /admin subdirectory
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html/admin

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
