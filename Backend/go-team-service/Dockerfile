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
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build --chown=app:app /app/go-team-service/target/*.jar /app/app.jar

USER app
EXPOSE 8092
ENTRYPOINT ["java","-jar","/app/app.jar"]
