FROM node:20-bullseye-slim

# Install g++ to compile C++ binaries
RUN apt-get update && apt-get install -y g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Build the C++ binaries and the Vite frontend
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
