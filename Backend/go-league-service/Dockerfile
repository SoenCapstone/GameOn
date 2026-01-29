# ================================
# Build Stage
# ================================
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copy shared module (common)
COPY common ./common

# Copy league service module
COPY go-league-service ./go-league-service

# Install shared module & build league service
# -DskipTests skips test execution
# -Dmaven.test.skip=true skips test compilation too
RUN mvn -f common/pom.xml clean install -Dmaven.test.skip=true -q \
    && mvn -f go-league-service/pom.xml clean package -Dmaven.test.skip=true -q

# ================================
# Runtime Stage
# ================================
FROM eclipse-temurin:21-jre-alpine

# Create non-root user
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# Copy final fat jar from build stage
COPY --from=build --chown=app:app /app/go-league-service/target/*.jar /app/app.jar

USER app

EXPOSE 8093

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
