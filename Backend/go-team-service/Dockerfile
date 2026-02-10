# Build Stage
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copy modules
COPY common ./common
COPY go-user-service ./go-user-service
COPY go-team-service ./go-team-service

# 1) Build & install common into local Maven repo
# 2) Build & install go-user-service (so team-service can depend on it)
# 3) Build go-team-service
RUN mvn -f common/pom.xml clean install -DskipTests -q \
    && mvn -f go-user-service/pom.xml clean install -DskipTests -q \
    && mvn -f go-team-service/pom.xml clean package -DskipTests -q

# Runtime Stage
FROM eclipse-temurin:21-jre-jammy

# Install curl
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
 
RUN groupadd --system app \
 && useradd  --system --gid app --create-home --home-dir /home/app app
 
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build --chown=root:root --chmod=444 /app/go-team-service/target/*.jar /app/app.jar

USER app
EXPOSE 8094
ENTRYPOINT ["java","-jar","/app/app.jar"]
