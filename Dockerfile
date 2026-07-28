# ====== DEPENDENCIES STAGE ======
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
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

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules

EXPOSE 8080

CMD ["npm", "run", "start"]
