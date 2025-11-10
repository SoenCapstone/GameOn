## IDE and Editors
* IntelliJ IDEA is used for backend development, providing advanced support for Java, Spring Boot, and Maven. It also helps run and debug microservices directly during local development.
* Visual Studio Code (VS Code) is used for frontend development with React Native, offering linting, formatting, and debugging tools optimized for JavaScript and TypeScript.

***
## Build and Dependency Management
* Maven is used in all Spring Boot services to manage dependencies, lifecycle phases, and build artifacts. Each microservice has its own pom.xml, ensuring modular version control and dependency isolation.
* Maven is used in all Spring Boot services to manage dependencies, lifecycle phases, and build artifacts. Each microservice has its own pom.xml, ensuring modular version control and dependency isolation.

***
## Version Control and CI/CD
* Git & GitHub host the project’s repositories and documentation (including this wiki). All contributions follow standard Git branching strategies with pull requests and peer review.
* GitHub Actions provides CI/CD pipelines for automated builds, testing, and deployments, improving consistency and reducing manual errors.
* SonarQube is integrated for static code analysis, ensuring code quality, detecting vulnerabilities, and maintaining a clean maintainability index across all services.

***
## Containerization and Local Development
* Docker is used to run the PostgreSQL database locally, ensuring consistency between developer environments.
* The project uses a simple Docker Compose file that provisions a Postgres container with persistent volumes and exposed ports for the backend services to connect.
* Local development mirrors production-like conditions while remaining lightweight for individual contributors.

***
## Version Summary
Java 17

Spring Boot 3.5.6

Node.js 18

React / React Native 19 / 0.81.4

PostgreSQL 15

Maven / npm Latest Build 

Docker Latest stable Containerization for local DB