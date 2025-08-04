# Strapi Dockerfile

FROM strapi/base:18-alpine

# Set working directory
WORKDIR /opt/app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 1338

# Start the application
CMD ["npm", "run", "start"]
