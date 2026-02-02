# Build Stage
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom and common module
COPY common/pom.xml ./common/
COPY common/src ./common/src

# Copy api gateway pom and source
COPY go-api-gateway/pom.xml ./
COPY go-api-gateway/src ./src

# Build the application
RUN mvn clean package -DskipTests -q


# Runtime Stage
FROM eclipse-temurin:17-jre-jammy

# Create non-root user
RUN groupadd --system app \
 && useradd  --system --gid app --create-home --home-dir /home/app app

WORKDIR /app

# Copy the built JAR as root, read-only (no write perms)
COPY --from=build --chown=root:root --chmod=444 /app/target/*.jar /app/app.jar

USER app
EXPOSE 8222
ENTRYPOINT ["java","-jar","/app/app.jar"]