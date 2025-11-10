## Key Libraries and Frameworks

This section outlines the major backend and frontend libraries used in the **GameOn** platform, explaining their purpose and role within the system.  
Each library or framework was selected to improve scalability, maintainability, and development efficiency across all microservices and the mobile frontend.

---

## Backend Libraries

- **spring-boot-starter-web** — Provides RESTful API functionality, embedded Tomcat server, and core web capabilities for each microservice.  
- **spring-boot-starter-data-jpa** — Simplifies data persistence through Hibernate ORM, enabling CRUD operations and entity mapping with minimal boilerplate.  
- **spring-boot-starter-data-jdbc** — Used in services that require lightweight JDBC access without full JPA overhead.  
- **spring-boot-starter-validation** — Adds validation support using Java Bean Validation (JSR-380) annotations to enforce data integrity.  
- **spring-boot-starter-actuator** — Exposes monitoring endpoints for health checks, metrics, and performance tracking of microservices.  
- **spring-cloud-starter-config** — Enables centralized external configuration across all microservices using the Config Server.  
- **spring-cloud-starter-netflix-eureka-client** — Handles service registration and discovery, allowing services to dynamically locate one another.  
- **spring-cloud-starter-openfeign** — Simplifies inter-service communication through declarative REST clients.  
- **spring-boot-starter-oauth2-client** and **spring-boot-starter-oauth2-resource-server** — Provide OAuth2 client and resource server functionality for integrating with Clerk authentication.  
- **spring-dotenv (v4.0.0)** — Loads environment variables from `.env` files for flexible configuration in development and testing.  
- **flyway-core (v11.13.2)** — Manages database schema migrations and ensures version consistency across environments.  
- **Lombok (v1.18.34)** — Reduces boilerplate code by automatically generating getters, setters, constructors, and builders.  
- **PostgreSQL Driver** — Connects Spring Data JPA to the PostgreSQL database at runtime.  
- **JUnit 5 / Mockito / H2** — Support testing, mocking dependencies, and running lightweight in-memory databases for isolated test cases.

---

## Frontend Libraries

- **@clerk/clerk-expo (v2.17.3)** — Handles user authentication, registration, and session management through Clerk’s secure API.  
- **React / React Native / Expo SDK 54** — The foundation of the frontend, providing cross-platform native UI components for Android and iOS.  
- **@react-navigation/native**, **@react-navigation/bottom-tabs**, **@react-navigation/elements** — Implement navigation stacks and tab-based layouts for a consistent user flow.  
- **Axios (v1.13.1)** — Manages HTTP communication between the React Native frontend and backend microservices.  
- **@tanstack/react-query (v5.90.5)** — Handles API caching, background synchronization, and server state management for optimized performance.  
- **Formik + Yup** — Manage form state and validation logic for user input handling and error management.  
- **expo-secure-store** and **@react-native-async-storage/async-storage** — Provide local and secure storage for sensitive data such as authentication tokens.  
- **expo-linear-gradient**, **expo-glass-effect**, and **@expo/vector-icons** — Used for UI enhancements, styling, and smooth visual effects.  
- **@react-native-community/datetimepicker** and **@react-native-picker/picker** — Offer native-feeling input components for selecting dates and options.  
- **@expo/haptics** and **expo-system-ui** — Add tactile feedback and consistent theming across devices.  
- **Jest / @testing-library/react-native / @testing-library/jest-native** — Used for automated unit and integration testing of frontend components.  
- **prettier** and **eslint / eslint-config-expo** — Maintain code style consistency and enforce linting rules throughout the codebase.  

---

## Reference

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)  
- [Spring Cloud Config](https://docs.spring.io/spring-cloud-config/docs/current/reference/html/)  
- [Netflix Eureka Client](https://spring.io/projects/spring-cloud-netflix)  
- [Flyway Migration Docs](https://documentation.red-gate.com/fd)  
- [Lombok Documentation](https://projectlombok.org/)  
- [React Native Documentation](https://reactnative.dev/docs/getting-started)  
- [Expo SDK Docs](https://docs.expo.dev/)  
- [Clerk Expo Docs](https://clerk.com/docs/expo/overview)  
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)  
- [Axios GitHub Repo](https://github.com/axios/axios)  
- [Formik Documentation](https://formik.org/docs/overview)  
- [Yup Documentation](https://github.com/jquense/yup)  
- [Jest Documentation](https://jestjs.io/docs/getting-started)
