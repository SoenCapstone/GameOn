# 🏅 Game-On

GameOn is a mobile platform that keeps amateur sports leagues organized by combining roster management, smart substitutions, secure payments, scheduling, and team chat into one experience. This repo contains the Expo/React Native client and the Spring Boot microservices that power it.

## Table of Contents

- [📘 Project Summary](#project-summary)
- [🎬 Release Demos](#release-demos)
- [👥 Team Members](#team-members)
- [🏗️ Architecture Overview](#architecture-overview)
- [⚙️ Prerequisites](#prerequisites)
- [🧩 Configuration](#configuration)
- [🪄 Setup](#setup)
- [🚀 Running the Stack](#running-the-stack)
  - [🐘 Start Postgres](#start-postgres)
  - [☕ Backend Services](#backend-services)
  - [📱 Frontend (Expo)](#frontend-expo)
- [🧪 Testing and Quality](#testing-and-quality)



<a id="project-summary"></a>
## 📘 Project Summary

GameOn targets last-minute player absences, complex scheduling, messy payments, and scattered communication. Unlike point-solution apps, GameOn unifies roster management, real-time substitutions, attendance-aware payments, scheduling and messaging while remaining sport-agnostic through customizable templates. The goal is to make organizing and playing in leagues easier for organizers, coaches, and players.

<a id="deployment"></a>
## 🚀 Deployment

- **Backend**
  - Deployed using AWS at this [link](http://ec2-13-220-148-192.compute-1.amazonaws.com:8222/).
  - The database only has a developer test account, you can either use that account or create new account/s to test the app's features.
- **Frontend**
  - Deployed using Expo Application Services (EAS).
  - A QR code is provided in the [Release Demos](#release-demos) table to preview the app using Expo Go.

<a id="release-demos"></a>
## 🎬 Release Demos

| Release # | Link to Demo | Deployment |
|-----------|--------------|---------------------|
| Release 1 | [Demo 1](https://drive.google.com/file/d/1EH74M7fyrOtF4cqQyQ78-SJTe6lQ6VJN/view?usp=sharing) |                     |
| Release 2 | [Demo 2](https://drive.google.com/file/d/1dzTUCtvsP7LVbuaq4ib6seauiT9_x8m3/view?usp=sharing) | <a href="https://expo.dev/projects/bc7d1a0a-aeeb-448f-ad90-be62fe6633bf/updates/637628de-1d86-4e83-9959-41fbdf953471"><img src="https://qr.expo.dev/eas-update?projectId=bc7d1a0a-aeeb-448f-ad90-be62fe6633bf&groupId=637628de-1d86-4e83-9959-41fbdf953471" width="250px" /></a>                    |
| Release 3 |              |                     |

<a id="team-members"></a>
# 👥 Team Members

| Name              | Student ID | GitHub                                           | Email                        |
|-------------------|------------|-------------------------------------------------|------------------------------|
| Gianluca Girardi  | 40228370   | [GianlucaGirardi](https://github.com/GianlucaGirardi) | gl.girardi1@gmail.com        |
| Johnny Aldeb      | 40187248   | [Johnny-Aldeb](https://github.com/Johnny-Aldeb) | Johnny.aldeb@gmail.com       |
| Asim Rahman       | 40207553   | [AsimRahman88](https://github.com/AsimRahman88) | asimmrahm@gmail.com          |
| Mahmoud Mohamed   | 40163777   | [mavmoud](https://github.com/mavmoud)           | mahmoud@null.net             |
| Renal Wasouf      | 40190708   | [RenalWasouf](https://github.com/RenalWasouf)   | Renalwasouf@gmail.com        |
| Maria Balanjian   | 40227451   | [Mariapalan](https://github.com/Mariapalan)     | maria.balanjian@gmail.com    |
| Lara Louka        | 40227840   | [laraxl](https://github.com/laraxl)             | Laraconcordia1@gmail.com     |
| Zachariya Javeri  | 40130266   | [zachariyaJaveri](https://github.com/zachariyaJaveri) | zach.javeri@gmail.com   |
| Samuel Collette   | 40175048   | [Vaqint](https://github.com/Vaqint)             | Samuelcollette1223@hotmail.com |
| Karim El Assaad   | 40127808   | [Kayram2710](https://github.com/Kayram2710)     | karimelassaad025@gmail.com   |
| Danny Mousa       | 40226912   | [F4KER-X](https://github.com/F4KER-X)           | danny.mousa14@gmail.com      |


<a id="architecture-overview"></a>
## 🏗️ Architecture Overview

- **Frontend** – `Frontend`: Expo Router, React Native, Clerk auth, Jest for tests.
- **Backend** – `Backend`: Spring Boot microservices
  - `go-config-server` centralizes YAML configs.
  - `go-discovery-service` (Eureka).
  - `go-api-gateway` (Spring Cloud Gateway).
  - Domain services such as `go-user-service` and `go-team-service`.
- **Database** – Local Postgres via `docker-compose.yml`.
- **Shared library** – `GameOn-Backend/common` Maven module.
  
<a id="prerequisites"></a>
## ⚙️ Prerequisites

- Node.js 20.x and npm 10.x (Expo tooling requires npm 10+).
- Java 17, Maven 3.9+ (or each module’s `mvnw` wrapper).
- Docker Desktop / Docker Engine 24+ for Postgres.
- Expo CLI (`npm install -g expo-cli`) plus Android Studio and/or Xcode simulators for native testing.

<a id="configuration"></a>
## 🧩 Configuration

1. Copy the provided template and edit the values:
   ```bash
   cp .env.example .env
   ```
2. Export/copy the Expo variables into `Frontend/.env` as well (Expo only loads variables from within the app directory).
3. Keep the database credentials consistent with `docker-compose.yml`.

`EXPO_PUBLIC_API_BASE_URL` must point to the API Gateway (`http://localhost:8222` when running locally). Clerk publishable keys can be obtained from the team’s Clerk dashboard.

<a id="setup"></a>
## 🪄 Setup

1. **Install backend dependencies**
   ```bash
   cd Backend/common && mvn install
   # repeat per microservice when needed
   cd ../go-user-service && mvn clean package
   cd ../go-team-service && mvn clean package
   ```
2. **Install frontend dependencies**
   ```bash
   cd Frontend
   npm install
   ```

<a id="running-the-stack"></a>
## 🚀 Running the Stack

<a id="start-postgres"></a>
### 1. 🐘 Start Postgres

```bash
docker compose up -d db
```

Verify the container is healthy (`docker ps`) before starting the services.

<a id="backend-services"></a>
### 2. ☕ Backend services

Run each service in its own terminal from the repo root:

```bash
# Config Server (reads ./Backend/go-config-server/src/main/resources/configurations)
cd Backend/go-config-server && mvn spring-boot:run

# Discovery/Eureka
cd Backend/go-discovery-service && mvn spring-boot:run

# Domain services
cd Backend/go-user-service && mvn spring-boot:run
cd Backend/go-team-service && mvn spring-boot:run

# API Gateway
cd Backend/go-api-gateway && mvn spring-boot:run
```

Service order matters: config server ➜ discovery ➜ domain services ➜ gateway. When everything is up you can query `http://localhost:8222/api/v1/...` from the frontend or via curl.

<a id="frontend-expo"></a>
### 3. 📱 Frontend (Expo)

```bash
cd Frontend
npm run start
```

Choose an iOS/Android simulator or run the web target. Ensure the Expo env variables resolve to the running backend.

<a id="testing-and-quality"></a>
## 🧪 Testing and Quality

- **Frontend** – From `Frontend`:
  ```bash
  npm run test          # run all tests
  npm run coverage      # run tests with coverage report
  npm run format        # format code with Prettier
  ```

- **Backend** – From each service:
  ```bash
  mvnw test                
  ```

