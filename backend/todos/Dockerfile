# --- Giai đoạn 1: Build (Dùng Maven Java 21) ---
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy file cấu hình để tải thư viện trước (tận dụng Cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy code nguồn
COPY src ./src

# Build ra file .jar (Bỏ qua test để build nhanh)
RUN mvn clean package -DskipTests

# --- Giai đoạn 2: Run (Dùng JRE 21 siêu nhẹ) ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file .jar từ giai đoạn 1 sang
COPY --from=build /app/target/*.jar app.jar

# Mở cổng 8080
EXPOSE 8080

# Lệnh chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]