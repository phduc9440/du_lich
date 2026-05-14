# Build stage
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Accept build arguments for Vite
ARG VITE_URL_SERVER
ARG VITE_BASE_API_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_RASA_URL

# Set environment variables for the build process
ENV VITE_URL_SERVER=$VITE_URL_SERVER
ENV VITE_BASE_API_URL=$VITE_BASE_API_URL
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_RASA_URL=$VITE_RASA_URL

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build-stage to nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Default command to start nginx
CMD ["nginx", "-g", "daemon off;"]
