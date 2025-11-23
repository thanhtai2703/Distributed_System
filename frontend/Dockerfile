# Stage 1: Build React
FROM node:18-alpine as build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy file build từ Stage 1 sang thư mục của Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# (Lưu ý: Nếu project bạn build ra thư mục 'build' thay vì 'dist' thì sửa dòng trên thành /app/build)

# Copy cấu hình nginx vừa tạo vào
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]