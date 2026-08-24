# ====== DEPENDENCIES STAGE ======
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ====== BUILD STAGE ======
FROM node:20-alpine AS build
WORKDIR /app

ARG BACKEND_URL=http://ecommerce-api:8080
ENV BACKEND_URL=$BACKEND_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ====== RUN STAGE ======
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 8080

CMD ["node", "server.js"]
