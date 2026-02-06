# Build Stage
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copy common module
COPY common/pom.xml ./common/
COPY common/src ./common/src

# Copy config server pom and source
COPY go-config-server/pom.xml ./
COPY go-config-server/src ./src

# Build the application
RUN mvn clean package -DskipTests -q


# Runtime Stage
FROM eclipse-temurin:17-jre-jammy

# Install curl
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system app \
 && useradd  --system --gid app --create-home --home-dir /home/app app

WORKDIR /app

# Copy the built JAR as root, read-only
COPY --from=build --chown=root:root --chmod=444 /app/target/*.jar /app/app.jar

USER app
EXPOSE 8889
ENTRYPOINT ["java","-jar","/app/app.jar"]
