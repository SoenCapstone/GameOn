
<h2>Testing Plan and Continuous Integration for GameOn</h2>
<h3><strong>Overview</strong></h3>
<p>GameOn is developed using a <strong>microservices architecture</strong>, consisting of multiple backend services written in <strong>Go</strong> (e.g., <code inline="">go-user-service</code>, <code inline="">go-team-service</code>, and a <strong>Spring Boot API Gateway</strong> that handles routing, authentication, and inter-service communication. The frontend mobile app is built using <strong>React Native</strong>.<br>
This document outlines the testing and continuous integration (CI) strategy adopted by the GameOn team to ensure <strong>reliable functionality, maintainable code, and consistent deployment</strong> across all services.</p>
<hr>
<h3><strong>Testing Strategy</strong></h3>
<p>GameOn’s testing approach is multi-layered, covering <strong>unit</strong>, <strong>integration</strong>, <strong>end-to-end</strong>, and <strong>user acceptance</strong> levels. Each test layer focuses on specific aspects of the system, and all are automated through <strong>GitHub Actions</strong>.</p>
<h4><strong>1. Unit Testing</strong></h4>
<p>Unit testing ensures that each function or component behaves as expected in isolation.</p>
<ul>
<li>
<p><strong>Backend (Go microservices):</strong><br>
Uses Go’s built-in <code inline="">testing</code> package and the <code inline="">Testify</code> framework for assertions and mocks.<br>
Each service includes unit tests for handlers, repositories, and core logic.<br>
</li>
<li>
<p><strong>API Gateway (Spring Boot):</strong><br>
JUnit 5 and Mockito are used to test controller routes, authentication filters, and service integrations.<br>
These tests ensure the gateway properly validates tokens and routes requests to the correct microservice.</p>
</li>
<li>
<p><strong>Frontend (React Native):</strong><br>
Uses <strong>Jest</strong> and <strong>React Testing Library</strong> to test individual components, hooks, and utility functions.<br>
</li>
</ul>
<p><strong>Goal:</strong> Maintain a minimum of <strong>80% test coverage</strong> across all services. Code below this threshold will not be merged into <code inline="">main</code>.</p>
<hr>
<h4><strong>2. Integration Testing</strong></h4>
<p>Integration testing focuses on verifying communication between components and services.</p>
<ul>
<li>
<p><strong>Microservice Interactions:</strong><br>
Conducted using <strong>Docker Compose</strong> test environments to simulate real inter-service communication via REST APIs through the API Gateway.</p>
</li>
<li>
<p><strong>Database Integration:</strong><br>
Each service runs integration tests against a temporary database (PostgreSQL) initialized with <strong>Flyway</strong> migrations to ensure consistent schemas and data across environments.</p>
</li>
<li>
<p><strong>Authentication Integration:</strong><br>
Integration tests validate <strong>Keycloak</strong> authentication and authorization, ensuring endpoints correctly handle valid and invalid JWT tokens.</p>
</li>
</ul>
<p><strong>Goal:</strong> Confirm that all services communicate seamlessly and securely under production-like configurations.</p>
<hr>
<h4><strong>3. End-to-End (E2E) Testing</strong></h4>
<p>End-to-end testing validates complete workflows from a user’s perspective, covering both frontend and backend.</p>
<ul>
<li>
<p><strong>Tool:</strong> <strong>Cypress</strong> (for mobile web builds and automated UI testing).</p>
</li>

</ul>
<p><strong>Goal:</strong> Guarantee that all primary user flows perform correctly across the integrated system.</p>
<hr>
<h4><strong>4. User Acceptance Testing (UAT)</strong></h4>
<p>UAT ensures that the system meets user expectations and functional requirements.</p>
<ul>
<li>
<p><strong>Approach:</strong><br>
Conducted during each iteration’s pre-release phase with non-developer participants (e.g., testers or classmates) to simulate real-world use.</p>
</li>
<li>
<p><strong>Focus:</strong><br>
Validating usability, navigation, and end-user satisfaction.</p>
</li>
</ul>
<p>Feedback from UAT sessions is used to improve user experience and address usability issues before release.</p>
<hr>
<h4><strong>5. Load and Performance Testing</strong></h4>
<p>To ensure system scalability and responsiveness under high usage:</p>
<ul>
<li>
<p><strong>Tool:</strong> <strong>JMeter</strong> (for backend load simulation).</p>
</li>
<li>
<p><strong>Goal:</strong><br>
Simulate concurrent users (e.g., multiple players joining events simultaneously) and analyze latency, throughput, and resource utilization.</p>
</li>
</ul>
<hr>
<h3><strong>Testing Coverage and Quality Gates</strong></h3>
<ul>
<li>
<p>Minimum <strong>80% coverage</strong> required for all services (backend, gateway, frontend).</p>
</li>
<li>
<p>Coverage and code quality are tracked through <strong>SonarCloud</strong>.</p>
</li>
<li>
<p><strong>Quality gates</strong> in CI prevent merging if coverage or lint checks fail.</p>
</li>
<li>
<p><strong>Static analysis</strong> detects code smells, vulnerabilities, and maintainability issues early in development.</p>
</li>
</ul>
<hr>
<h3><strong>Continuous Integration (CI) and Deployment</strong></h3>
<h4><strong>1. CI Workflow (GitHub Actions)</strong></h4>
<p>All repositories are integrated with <strong>GitHub Actions</strong>, which automatically execute tests and quality checks on every pull request or push to <code inline="">main</code>.</p>
<p><strong>Stages in the Workflow:</strong></p>
<ol>
<li>
<p><strong>Linting and Static Analysis:</strong></p>
<ul>
<li>
<p>Runs <code inline="">lint</code> for frontend code.</p>
</li>
<li>
<p>Runs <strong>SonarCloud</strong> analysis for all repositories.</p>
</li>
</ul>
</li>
<li>
<p><strong>Unit and Integration Tests:</strong></p>
<ul>
<li>
<p>Executes Go tests with coverage reports.</p>
</li>
<li>
<p>Runs JUnit tests for the API Gateway.</p>
</li>
<li>
<p>Executes Jest tests for frontend components.</p>
</li>
</ul>
</li>
<li>
<p><strong>End-to-End Testing:</strong></p>
<ul>
<li>
<p>Cypress tests run automatically on PRs to validate main user flows.</p>
</li>
</ul>
</li>
<li>
<p><strong>Quality Gate Validation:</strong></p>
<ul>
<li>
<p>CI enforces test and coverage thresholds before merge.</p>
</li>
</ul>
</li>
<li>
<p><strong>Containerization and Deployment:</strong></p>
<ul>
<li>
<p>Each service builds its Docker image.</p>
</li>
<li>
<p>CI pipeline deploys to a <strong>staging environment</strong> for verification.</p>
</li>
<li>
<p>Upon approval, a production deployment is triggered.</p>
</li>
</ul>
</li>
</ol>
<hr>
<h3><strong>Code Review and Approval Process</strong></h3>
<p>All code contributions follow a structured <strong>pull request (PR)</strong> process:</p>
<ul>
<li>
<p>Developers create feature branches and open PRs to <code inline="">main</code>.</p>
</li>
<li>
<p>GitHub Actions automatically run all tests and static analysis checks.</p>
</li>
<li>
<p>Each PR requires at least <strong>one reviewer approval</strong> before merging.</p>
</li>
<li>
<p>CI prevents merging if any test fails or quality gates are unmet.</p>
</li>
</ul>
<p>This ensures that all merged code is reviewed, tested, and compliant with GameOn’s coding standards.</p>
<hr>