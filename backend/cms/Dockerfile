# Strapi Dockerfile (production)

FROM node:18-alpine

WORKDIR /opt/app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 1338
CMD ["npm", "run", "start"]
