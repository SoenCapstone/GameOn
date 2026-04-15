# 🏅 Game-On

GameOn is a mobile platform that keeps amateur sports leagues organized by combining roster management, smart substitutions, secure payments, scheduling, and team chat into one experience. This repo contains the Expo/React Native client and the Spring Boot microservices that power it.

## Table of Contents

- [📘 Project Summary](#project-summary)
- [🚀 Deployment](#deployment)
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
  - [🖥️ Dashboard (Next.js)](#dashboard-nextjs)
- [🧪 Testing and Quality](#testing-and-quality)



<a id="project-summary"></a>
## 📘 Project Summary

GameOn targets last-minute player absences, complex scheduling, messy payments, and scattered communication. Unlike point-solution apps, GameOn unifies roster management, real-time substitutions, attendance-aware payments, scheduling and messaging while remaining sport-agnostic through customizable templates. The goal is to make organizing and playing in leagues easier for organizers, coaches, and players.

<a id="deployment"></a>
## 🚀 Deployment

- **Backend**
  - Deployed using AWS at this [URL](http://3.217.27.164:8222/).
  - The database already includes a developer test account, you can either use that account or create new account/s to test the app's features.
- **Frontend**
  - Deployed using Expo Application Services (EAS).
  - QR codes and a TestFlight link are provided in the [Release Demos](#release-demos) table.
  - The app is built to run natively in the iOS Simulator or on a physical device, and it uses native modules that are not included in Expo Go.
  - Expo Go fallbacks are included to make the app easier to run without building locally, but they are not the intended experience.
  - For the optimal experience, build and run the app as a native build.

<a id="release-demos"></a>
## 🎬 Release Demos

> [!WARNING]
> Because of the upgrade to SDK 55, the App Store version of Expo Go will no longer work for running the app. If you are testing on your personal iPhone, you must install the new Expo Go 55 client via TestFlight:
> https://testflight.apple.com/join/GZJxxfUU
>
> If you are testing in the iOS simulator, you do not need to do anything extra.

| Release # | Link to Demo | Deployment | TestFlight (iOS) |
|-----------|--------------|-------------|------------------|
| Release 1 | [Demo 1](https://drive.google.com/file/d/1EH74M7fyrOtF4cqQyQ78-SJTe6lQ6VJN/view?usp=sharing) | | |
| Release 2 | [Demo 2](https://drive.google.com/file/d/1dzTUCtvsP7LVbuaq4ib6seauiT9_x8m3/view?usp=sharing) | <a href="https://expo.dev/projects/bc7d1a0a-aeeb-448f-ad90-be62fe6633bf/updates/637628de-1d86-4e83-9959-41fbdf953471"><img src="https://qr.expo.dev/eas-update?projectId=bc7d1a0a-aeeb-448f-ad90-be62fe6633bf&groupId=637628de-1d86-4e83-9959-41fbdf953471" width="250px" /></a> | |
| Release 3 | [Demo 3](https://drive.google.com/file/d/1t2Cd0Hrs29hAXUwXJiBIwidTJ_4aDbw1/view?usp=sharing) | <a href="https://expo.dev/projects/bc7d1a0a-aeeb-448f-ad90-be62fe6633bf/updates/9ce14551-7ae6-4ec4-8b73-d4183f4902e6"><img src="https://qr.expo.dev/eas-update?projectId=bc7d1a0a-aeeb-448f-ad90-be62fe6633bf&groupId=9ce14551-7ae6-4ec4-8b73-d4183f4902e6" width="250px" /></a> | [Expo Go v55 TestFlight](https://testflight.apple.com/join/GZJxxfUU) |

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

- **Frontend** – `Frontend`: Expo Router, React Native, Clerk auth, Stripe payments, Jest for tests.
- **Dashboard** – `Dashboard`: Next.js web app for admin/analytics views.
- **Backend** – `Backend`: Spring Boot microservices
  - `go-config-server` centralizes YAML configs.
  - `go-discovery-service` (Eureka).
  - `go-api-gateway` (Spring Cloud Gateway).
  - Domain services: `go-user-service`, `go-team-service`, `go-league-service`, `go-messaging-service`.
- **Database** – Local Postgres via `docker-compose.yml`.
- **Shared library** – `Backend/common` Maven module.
  
<a id="prerequisites"></a>
## ⚙️ Prerequisites

- Node.js 24.x and npm 11.x (Expo tooling requires npm 10+).
- Java 17, Maven 3.9+ (or each module’s `mvnw` wrapper).
- Docker Desktop / Docker Engine 24+ for Postgres.
- Expo CLI (`npm install -g expo-cli`) plus Xcode simulators for native testing.

<a id="configuration"></a>
## 🧩 Configuration

There are separate env files for each app/runtime:

| File | Used for | Notes |
|---|---|---|
| `.env` in the repo root | `docker compose up --build` for the backend stack | Based on `.env.example` |
| `Frontend/.env` | Expo mobile app | Based on `Frontend/.env.example` |
| `Backend/<service>/.env` | Optional for manual backend runs | Use this when starting Spring services individually |
| `Dashboard/.env` | Next.js dashboard | Based on `Dashboard/.env.example` |

1. Copy the root template and edit the values:
   ```bash
   cp .env.example .env
   ```
2. Copy the frontend template:
   ```bash
   cp Frontend/.env.example Frontend/.env
   ```
3. Copy the dashboard template:
   ```bash
   cp Dashboard/.env.example Dashboard/.env.local
   ```
4. If you run backend services manually instead of via Docker Compose, provide the required backend variables via per-service `.env` files inside the relevant `Backend/...` service directories.

Key variables and where they are used:

| Variable | Where | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Frontend | Points to the API Gateway (`http://localhost:8222` locally) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key from the Clerk dashboard |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe publishable key for in-app payments |
| `EXPO_PUBLIC_LOG_LEVEL` | Frontend | Log verbosity (`info`, `debug`, `error`) |
| `EXPO_PUBLIC_DEV_LOGIN_EMAIL`, `EXPO_PUBLIC_DEV_LOGIN_PASSWORD` | Frontend | Dev shortcut credentials for quick login during development |
| `CLERK_URL` | Root `.env` or manual backend service envs | Clerk JWKS endpoint for backend JWT verification |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | Root `.env` or manual backend service envs | S3 credentials for backend logo/image uploads |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Root `.env` or manual backend service envs | Stripe keys for backend payment processing and webhook validation |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Dashboard | Clerk configuration for the admin dashboard |
| `DATABASE_URL`, `DATABASE_SSL` | Dashboard | Direct database connection used by the dashboard |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Dashboard | Email delivery for dashboard-triggered workflows |

<a id="setup"></a>
## 🪄 Setup

1. **Install backend dependencies**
   ```bash
   cd Backend/common && mvn install
   # repeat per microservice when needed
   cd ../go-user-service && mvn clean package
   cd ../go-team-service && mvn clean package
   cd ../go-league-service && mvn clean package
   cd ../go-messaging-service && mvn clean package
   ```
2. **Install frontend dependencies**
   ```bash
   cd Frontend
   npm install
   ```
3. **Install dashboard dependencies**
   ```bash
   cd Dashboard
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

**Option A – Docker Compose (recommended):** builds and starts all backend services in one command:

```bash
docker compose up --build
```

**Option B – manual (one terminal per service):**

```bash
# Config Server (reads ./Backend/go-config-server/src/main/resources/configurations)
cd Backend/go-config-server && mvn spring-boot:run

# Discovery/Eureka
cd Backend/go-discovery-service && mvn spring-boot:run

# Domain services
cd Backend/go-user-service && mvn spring-boot:run
cd Backend/go-team-service && mvn spring-boot:run
cd Backend/go-league-service && mvn spring-boot:run
cd Backend/go-messaging-service && mvn spring-boot:run

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


<a id="dashboard-nextjs"></a>
### 4. 🖥️ Dashboard (Next.js)

```bash
cd Dashboard
npm run dev
```

Opens at `http://localhost:3000`. The dashboard connects directly to the database, so make sure the environment variables are set as shown in `Dashboard/.env.example`.

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

- **E2E (Maestro)** – Requires the [Maestro CLI](https://maestro.mobile.dev/) and a running simulator/device with the app installed. From the repo root:
  ```bash
  # Run all flows
  maestro test e2e/run-all-tests.yaml

  # Run individual suites
  maestro test e2e/league-services-tests.yaml
  maestro test e2e/matches-tests.yaml
  maestro test e2e/messaging-services-tests.yaml
  maestro test e2e/payments-tests.yaml
  maestro test e2e/teams-tests.yaml
  ```
