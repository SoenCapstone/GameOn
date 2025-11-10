### • Risk #1 – Authentication System Overhaul and Integration Complexity
- **Description:**  
  Changing from Keycloak to Clerk put in place potential failures such as session handling, token verification, and user-data flow in frontend and backend. A wrong configuration could lock users out or expose data since authentication is the entry point for every feature
- **Attack / Mitigation:**  
  Prioritized the auth migration in the early stages of development to keep apart issues before other features were built. Refactored login, sign-up, and token-validation logic to use Clerk’s SDK and investigated the compatibility with Spring Boot services. 
- **Evidence:**  
  [PR #136 – Auth Rework and Clerk Integration](https://github.com/SoenCapstone/GameOn/pull/136) shows the complete refactoring of authentication, environment variable setup, and validation of secure route.

---

### • Risk #2 – Lack of API Gateway and Service Centralization

- **Description:**  
  If an API Gateway was not implemented, all the microservices (like user-service, league-service, and so on.) would have to be directly accessed by the frontend.  
  This would introduce a lot of critical risks like duplicated authentication logic in services, inconsistent routing paths, difficulty in load balancing, and exposure of internal APIs to the public.  
  The absence of a unified entry point would also make maintenance and security enforcement a lot harder as the system scaled.

- **Attack / Mitigation:**  
  To eliminate this risk, an **API Gateway** was implemented early in the backend design phase.  
  The gateway now serves as the single access point for every client requests, which provides:
  - Centralized request routing and consistent endpoint structure.  
  - Load balancing and service discovery with **Eureka**, which ensures traffic is directed only to healthy instances.  
  - Authentication and authorization enforcement at the edge, which protects internal services from direct exposure.  
  This architectural decision improved scalability, maintainability, and overall system security.

- **Evidence:**  
  [PR #75 – Added API Gateway](https://github.com/SoenCapstone/GameOn/pull/75)  
  This pull request introduced the API Gateway service, standardized backend routes (like `getAllUsers`), and configured centralized authentication and traffic control in all microservices.

---

### • Risk #3 – Security and User Data Privacy
- **Description:**  
  unstructured management of environment variables, access tokens, or API secrets could expose sensitive data (emails, teams, leagues).  
- **Attack / Mitigation:**  
  Adopted secure storage of credentials with environment files, implemented token-verification middleware, and limited API exposure to authenticated users only.  
- **Evidence:**  
  [PR #136 – Auth Rework and Clerk Integration](https://github.com/SoenCapstone/GameOn/pull/136) includes secure token handling and secret management.  

