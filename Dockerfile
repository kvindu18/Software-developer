FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev=false
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node","server/index.js"]
