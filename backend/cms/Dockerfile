# Strapi Dockerfile

FROM node:18-alpine

# Set working directory
WORKDIR /opt/app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install Strapi globally and then install dependencies
RUN npm install -g @strapi/strapi@latest && npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 1338

# Start the application
CMD ["npm", "run", "start"]
