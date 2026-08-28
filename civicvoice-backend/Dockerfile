# Civic Voice - Backend Dockerfile (multi-stage build)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline -q || true
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/civicvoice-backend-1.0.0.jar app.jar
EXPOSE 8080
ENV APP_UPLOAD_DIR=/app/uploads
ENTRYPOINT ["java", "-jar", "app.jar"]
