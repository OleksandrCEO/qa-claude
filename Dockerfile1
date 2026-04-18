# Stage 1: Build the project using Bun
FROM oven/bun:1 as builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

# This helps you verify exactly where the built index.html is located.
RUN echo "=== ROOT DIRECTORY ===" && ls -la /app \
    && echo "=== DIST DIRECTORY ===" && ls -la /app/dist

# Stage 2: Serve static files via Nginx
FROM nginx:alpine

# CRITICAL FIX: Clear default Nginx placeholder files
RUN rm -rf /usr/share/nginx/html/*

# NOTE: TanStack usually outputs the client build to /dist/client
# If Railway logs show that index.html is directly in /dist, simply remove "/client" below
COPY --from=builder /app/dist/client /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
