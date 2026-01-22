# Build Stage
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom and common module
COPY common/pom.xml ./common/
COPY common/src ./common/src

# Copy config server pom and source
COPY go-config-server/pom.xml ./
COPY go-config-server/src ./src

# Build the application
RUN mvn clean package -DskipTests -q

# Runtime Stage
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build --chown=app:app /app/target/*.jar /app/app.jar

USER app
EXPOSE 8888
ENTRYPOINT ["java","-jar","/app/app.jar"]