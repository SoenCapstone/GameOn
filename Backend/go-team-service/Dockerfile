# Build Stage
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY ../pom.xml ./
RUN mvn -q -e dependency:go-offline
COPY ../src ./src
# Skip tests during docker build because some tests run Flyway against H2/Postgres and can fail during image build
RUN mvn -q -DskipTests package
#Run stage
FROM eclipse-temurin:17-jre
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
COPY --from=build --chown=root:root --chmod=0444 /app/target/*.jar /app/app.jar
USER app
EXPOSE 7070
ENTRYPOINT ["java","-jar","/app/app.jar"]
