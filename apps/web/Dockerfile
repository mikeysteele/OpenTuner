# Stage 1: Build the Web App
FROM denoland/deno:2.0.0 AS builder

WORKDIR /app

# Copy monorepo
COPY . .

# Build the web application
# This assumes 'deno task build' in apps/web runs 'vite build'
WORKDIR /app/apps/web
RUN deno task build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
