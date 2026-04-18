# Етап 1: Збірка SPA
FROM node:20-alpine AS builder
WORKDIR /app

# Копіюємо package files (підтримка npm, pnpm, bun)
COPY package*.json ./
COPY bun.lock* ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код і білдимо
COPY . .
RUN npm run build

# 🔍 ДІАГНОСТИКА - подивіться в логах Railway що було створено
RUN ls -la /app && echo "---" && ls -la /app/dist 2>/dev/null || echo "no dist" && ls -la /app/.output 2>/dev/null || echo "no .output"

# Етап 2: Nginx для роздачі статики
FROM nginx:alpine

# Копіюємо результат білду
COPY --from=builder /app/dist /usr/share/nginx/html

# Копіюємо template конфіга Nginx
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Railway передає порт через $PORT - envsubst підставить його
CMD ["/bin/sh", "-c", "envsubst 8080 < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
