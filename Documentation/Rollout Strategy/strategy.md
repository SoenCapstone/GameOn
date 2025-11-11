## a. Security

The rollout plan focuses on keeping all user data, tokens, and system information safe during deployment.

All important credentials (like API keys, database URLs, and Clerk tokens) are stored securely using environment files and **GitHub Secrets**.  
The system uses **HTTPS** to make sure all communication between the app and the backend is protected.  
**Clerk** manages user authentication and ensures only verified users can log in and stay connected securely.  
**Role-based access control (RBAC)** is used to control who can do what in the app (for example, Admin, Coach, Player).  
The **API Gateway**, built with Spring Boot, handles all requests from the app and checks permissions before allowing access to any of the **Go microservices**.  
Each service runs inside its own **Docker container** to keep things separate and safe.  
We also use **Dependabot** and **CodeQL** in GitHub to automatically find and alert us about security issues or vulnerable dependencies.

**Main Risk:**  
There was a risk of exposing credentials or mismanaging authentication when switching from Keycloak to Clerk.

**Mitigation:**  
We fixed this by moving all tokens and secrets into secure GitHub storage and refactoring the authentication flow early in the project.  
The API Gateway now verifies every request, and Clerk handles authentication end-to-end, reducing the risk of token leaks or insecure sessions.

## b. Performance

The goal is to make sure GameOn runs smoothly and quickly for all users.

The app uses **Docker Compose** to run all microservices in a stable and consistent way across different setups.  
**JMeter** is used to test how the system performs with many users at once.  
The **API Gateway** helps reduce response time by routing requests efficiently and avoiding repeated calls.  
Each **Go service** is designed to be fast and lightweight.  
On the frontend, **React Native/Expo** uses lazy loading and optimized builds so the app opens faster and runs better.  
**GitHub Actions** runs automated tests (unit, integration, and end-to-end) every time new code is pushed.  
**SonarCloud** checks performance, code quality, and test coverage before anything is merged.

**Benchmark Target:**  
The platform should handle around **100 users at the same time**, with API response times under **500 ms** during tests.

## c. Deployment Plan

Deployment is done step by step to make sure everything works correctly before the public release.  
Our project uses **GitHub** as the main platform for version control, testing, and integration.  
Every new feature or change goes through a clean and organized process to keep the project stable.

### **Deployment Workflow**

**1. Branch Creation**  
Each developer works on a separate feature branch (for example, `feature/role-manager` or `fix/login-bug`).  
This keeps the `main` branch stable and prevents unfinished code from being merged too early.

**2. Pull Request (PR)**  
When a feature is ready, the developer opens a Pull Request (PR) to merge into `main`.  
PRs must include a clear description, link to their issue, and screenshots or testing notes when needed.

**3. Automated Checks**  
**GitHub Actions** automatically runs all tests and code quality checks:

- Unit and integration tests for Go and Spring Boot
- Frontend tests (Jest, Cypress)
- Static analysis and security scans with SonarCloud and CodeQL

If any test fails, the merge is blocked until the issue is fixed.

**4. Code Review & Approval**  
Every PR must be reviewed and approved by at least one teammate before merging.  
This ensures code consistency, better readability, and shared understanding.

**5. Merge to Main**  
Once approved, the PR is merged into the `main` branch.  
**GitHub Actions** runs one last test suite to confirm that the main build still passes.

## Release Plans

Each release stage serves a specific purpose and helps validate the system step by step before the final rollout:

**1. Release to Stakeholder (at each sign-off)**  
After each major milestone, a build is shared with project stakeholders or supervisors for approval.  
This helps ensure that key requirements are met and that progress aligns with the project goals.

**2. Release to Family and Friends**  
A small informal release shared with close testers, classmates, or friends.  
This stage focuses on collecting quick feedback on usability, layout, and user flow before opening testing to a larger group.

**3. Alpha Release (trusted testers)**  
A limited release given to stakeholders’ trusted testers or internal users.  
The goal is to verify functionality, catch major bugs, and confirm that authentication, navigation, and key features work as expected.

**4. Beta Release (early users)**  
A wider release shared with selected external users to test performance and reliability under more realistic usage.  
Feedback from this phase helps improve stability, polish the UI, and optimize performance.

**5. Full Release**  
The final version of GameOn, incorporating all feedback and final fixes.  
This build is used for presentation, grading, and public demonstration as the stable, production-ready release.

### Monitoring After Release

After merging to main, logs and test results are monitored through **GitHub Actions** and **Docker Compose logs**.  
The team verifies that all services run correctly after each release and ensures that no errors occur during execution.

### Rollback Plan

If a deployment introduces a problem or fails tests:

- The branch is reverted to the previous working commit using Git history.
- The issue is fixed in a new branch and resubmitted through a PR.
- The main branch stays stable since all merges must pass testing and review before deployment.

## Deployment and Release Diagram
