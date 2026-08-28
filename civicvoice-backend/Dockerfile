# Civic Voice - Backend Dockerfile (multi-stage build)
# NOTE: Render builds this with the REPO ROOT as the build context
# (because dockerfilePath points into civicvoice-backend/).
# So COPY paths are relative to the repo root.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY civicvoice-backend/pom.xml .
RUN mvn -B dependency:go-offline -q || true
COPY civicvoice-backend/src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/civicvoice-backend-1.0.0.jar app.jar
EXPOSE 8080
ENV APP_UPLOAD_DIR=/app/uploads
ENTRYPOINT ["java", "-jar", "app.jar"]
