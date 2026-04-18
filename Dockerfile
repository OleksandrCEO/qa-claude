FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY bun.lock* ./
RUN npm install
COPY . .
RUN npm run build

# 🔍 Дивимося що насправді в dist
RUN echo "=== dist/ contents ===" && ls -la /app/dist && \
    echo "=== dist/client/ if exists ===" && ls -la /app/dist/client 2>/dev/null || echo "no dist/client" && \
    echo "=== looking for index.html ===" && find /app/dist -name "index.html"

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
