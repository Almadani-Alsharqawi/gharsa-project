# Stage 1: Build the admin panel
FROM node:18-alpine AS builder

WORKDIR /app

# تمرير المتغيرات أثناء البناء (ضروري جداً لحل مشكلة الكوكيز)
ARG STRAPI_URL=https://strapi.gharsa.ly
ARG STRAPI_ADMIN_URL=https://strapi.gharsa.ly/admin
ARG STRAPI_PROXY=true
ENV STRAPI_URL=$STRAPI_URL
ENV STRAPI_ADMIN_URL=$STRAPI_ADMIN_URL
ENV STRAPI_PROXY=$STRAPI_PROXY
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./

# تنصيب الإضافات الخاصة بالإنتاج
RUN npm ci --only=production && npm cache clean --force

# نسخ الملفات من مرحلة البناء
COPY --from=builder /app ./

RUN mkdir -p public/uploads

EXPOSE 1337

CMD ["npm", "run", "start"]
