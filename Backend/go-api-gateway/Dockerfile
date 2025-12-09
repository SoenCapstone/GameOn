# Build Stage
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY ../pom.xml ./
RUN mvn -q -e dependency:go-offline
COPY ../src ./src
RUN mvn -q -DskipTests package
#Run stage
FROM eclipse-temurin:17-jre
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
COPY --from=build --chown=root:root --chmod=0444 /app/target/*.jar /app/app.jar
USER app
EXPOSE 7070
ENTRYPOINT ["java","-jar","/app/app.jar"]