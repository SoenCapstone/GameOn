# Build Stage
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the common module
COPY common ./common

# Copy the user service module
COPY go-user-service ./go-user-service

# 1) Build & install common into the local Maven repo
# 2) Build the user service which now can resolve com.game.on:common
RUN mvn -f common/pom.xml clean install -DskipTests -q \
    && mvn -f go-user-service/pom.xml clean package -DskipTests -q

# Runtime Stage
FROM eclipse-temurin:21-jre-jammy

RUN groupadd --system app \
 && useradd  --system --gid app --create-home --home-dir /home/app app

 
RUN mkdir -p /app && chown -R app:app /app

WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build --chown=root:root --chmod=444 /app/go-user-service/target/*.jar /app/app.jar

USER app
EXPOSE 8090
ENTRYPOINT ["java","-jar","/app/app.jar"]
