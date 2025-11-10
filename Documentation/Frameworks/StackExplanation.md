The GameOn platform follows a microservices architecture built with Spring Boot (Java) on the backend, React Native (Expo) on the frontend, PostgreSQL as the main data store, and Clerk for authentication and user management.

***
## Backend — Spring Boot Microservices
The backend consists of multiple Spring Boot microservices (e.g., User Service, Team Service, Config Server) communicating through REST APIs. We chose Spring Boot 3.5.6 with Java 17 due to its:
* Scalability and modularity: Each service is independent and can be deployed or scaled separately.
* Familiarity and maturity: The development team is experienced with the Spring ecosystem, making iteration faster and debugging easier.
* Strong ecosystem: Spring Cloud provides production-ready tools for configuration, discovery, and communication between services.
* Security: Spring Security and OAuth2 integration simplify secure communication and token validation.

Each service follows a clean layered structure — controller, service, repository — ensuring separation of concerns and testability. Using Spring Data JPA, the backend abstracts database operations while maintaining strong type safety and validation.

***

## Frontend — React Native
The frontend is developed using React Native 0.81.4 with Expo SDK 54, allowing the same codebase to be deployed on both Android and iOS. React Native was chosen because:
* It enables cross-platform compatibility with a native-like performance.
* It allows for rapid UI iteration thanks to hot reloading and reusable components.
* The team had prior experience with React from previous web projects, reducing the learning curve.
* It integrates seamlessly with backend APIs via Axios and React Query for smooth data synchronization.

***

## Database — PostgreSQL
The platform uses PostgreSQL 15 as its primary relational database. PostgreSQL offers:
* ACID compliance for reliable transactions.
* Excellent support for JSON and structured data, which fits the needs of dynamic user data and configuration settings.
* Strong integration with Spring Data JPA and Flyway for schema versioning and migrations.

***

## Authentication — Clerk
Authentication is managed through Clerk, an identity-as-a-service solution. Clerk provides ready-to-use authentication components such as sign-up, sign-in, and session management for both web and mobile. It integrates securely with the backend’s OAuth2 resource server, offloading the complexity of managing tokens, password resets, and MFA while maintaining high security standards.

***

Overall, this stack was selected for its developer efficiency, scalability, maintainability, and modern ecosystem support. It also provides a strong foundation for future cloud deployment and microservice expansion.

***

## Reference

[Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)

[Spring Cloud Overview](https://spring.io/projects/spring-cloud)

[React Native Docs](https://reactnative.dev/docs/getting-started)

[Expo Documentation](https://docs.expo.dev/)

[PostgreSQL Official Docs](https://www.postgresql.org/docs/)

[Clerk Developer Docs](https://clerk.com/docs)

[Spring Security OAuth2 Guide](https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html)
