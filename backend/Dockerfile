# ---- Base Node ----
FROM node:18-slim AS base
WORKDIR /app
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl procps

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts
COPY prisma ./prisma/
# Generate Prisma client based on production dependencies
RUN npx prisma generate

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY tsconfig.json .
COPY src ./src
# Ensure devDependencies are available for build
RUN npm install --ignore-scripts
# Generate Prisma Client before building
RUN npx prisma generate
RUN npm run build
# Prune devDependencies after build
RUN npm prune --production

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV=production
# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules
# Copy Prisma client
COPY --from=deps /app/prisma ./prisma
# Copy built application
COPY --from=builder /app/dist ./dist
# Copy package.json for `npm start`
COPY package.json .
# Copy tsconfig.json for tsconfig-paths
COPY tsconfig.json .

# Expose the port the app runs on
EXPOSE 8080

# Set the user for security
USER node

# Command to run the application
CMD ["npm", "start"]
