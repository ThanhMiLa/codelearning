<h1 align="center">
  <img src="frontend/src/assets/LOGO_SINGLE.png" alt="CodeLearning logo" width="46" />
  CodeLearning
</h1>

<div align="center">
  <a href="https://www.codelearning.io.vn/" target="_blank">
    <img src="https://img.shields.io/badge/Explore_the_Platform-https://www.codelearning.io.vn/-blue?style=for-the-badge&logo=vercel&logoColor=white" alt="Explore the Platform" />
  </a>

  <br/>

  [![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg?logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
  [![Java 21](https://img.shields.io/badge/Java-21-orange.svg?logo=openjdk)](https://www.oracle.com/java/technologies/downloads/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?logo=postgresql)](https://www.postgresql.org/)
  [![Redis](https://img.shields.io/badge/Redis-7-red.svg?logo=redis)](https://redis.io/)
  [![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-orange.svg?logo=rabbitmq)](https://www.rabbitmq.com/)
  [![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)
  [![PayOS](https://img.shields.io/badge/Payment-PayOS-green.svg)](https://payos.vn/)
</div>

## Overview

CodeLearning is an e-learning and competitive programming platform that helps learners build programming skills through video-based courses and exercises. It includes an Online Judge for practicing data structures and algorithms, along with ICPC-style programming contests featuring structured rules, real-time rankings, and competitive workflows.

## Tech Stack

| Layer | Technologies and Libraries | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, TypeScript 5, Vite 6 | Single Page Application with optimized bundle splitting and fast HMR |
| **UI and Styling** | Tailwind CSS v4, Framer Motion, Lucide Icons | Responsive user interface with smooth layout animations |
| **Code Editor** | `@monaco-editor/react` | Monaco Editor integration supporting multiple languages, syntax highlighting, and themes |
| **Real-time Communication** | SockJS-client, STOMPjs | Bi-directional WebSocket channels for live progress bars and contest synchronization |
| **Networking & Localization** | Axios, i18next | Centralized API client with interceptors and English/Vietnamese localization |
| **Backend Core** | Java 21, Spring Boot 3.5.7 | Layered architecture with Spring Data JPA, Spring WebFlux, and Spring Security |
| **Primary Database** | PostgreSQL 15 | Relational persistence with row-level locking for transactions and balances |
| **Cache & Concurrency** | Redis 7 (`StringRedisTemplate`) | Atomic counters (`INCR`), short-circuit locking keys, and cache management |
| **Message Broker** | RabbitMQ 3 (`rabbitmq_delayed_message_exchange`) | Asynchronous email queues and delay-based contest lifecycle scheduling |
| **Execution Sandbox** | Judge0 API v1.13.1 Sandbox | Multi-language compilation and sandboxed execution inside isolated Docker containers |
| **Payment Gateway** | PayOS SDK (VietQR NAPAS247) | Dynamic bank transfer QR code generation, HMAC-SHA256 signature verification |
| **Email Delivery** | SendGrid v3 Dynamic Templates | Batch email delivery, retry queues, and webhook delivery telemetry |
| **Media Storage** | Cloudinary API | Cloud storage and CDN delivery for course media, attachments, and profile images |
| **Infrastructure & DevOps** | Docker, Docker Compose, NGINX | Multi-stage builds and container orchestration across development and production profiles |

## Key Features

### 1. Online Judge and Automated Code Evaluation
* **Monaco Code Editor**: Professional development environment in the browser with auto-completion, bracket matching, indentation guides, and multi-language support (C++, Java, Python, JavaScript).
* **Asynchronous Sandbox Evaluation**: Submissions are queued and evaluated without blocking backend request threads. The system reports accurate verdicts: `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Memory Limit Exceeded`, and `Compilation Error`.
* **Real-time Progress Streaming**: WebSocket STOMP pushes individual testcase execution results to the client as they finish, driving a dynamic progress indicator.
* **Short-Circuit Evaluation for Contests**: Halts judgment immediately on the first failed testcase during live contests, conserving sandbox compute resources.

### 2. Contests and Competitive Programming
* **ICPC Contest Format**: Standard competitive scoring based on solve counts, elapsed time, and submission penalties.
* **Event-Driven Lifecycle Scheduling**: Transitions contests across `UPCOMING`, `RUNNING`, and `ENDED` states using RabbitMQ Delayed Exchange without recurring database polling.
* **Live Scoreboards and Freeze Mechanism**: Real-time rank calculations with support for freezing public leaderboards during the final stages of a competition.

### 3. Course Management and E-learning
* **Hierarchical Structure**: Organizes learning content by Course, Chapter, Lesson, Video, and Quiz components.
* **Integrated Practice**: Embeds coding exercises directly alongside lecture materials, allowing students to test solutions against sample inputs instantly.
* **Progress Tracking**: Records student completion state across lessons and computes aggregate course progress.

### 4. Cart, Virtual Wallet, and Payment Integration
* **Shopping Cart & Promotions**: Multi-item cart management with voucher application and discount calculation.
* **Dynamic VietQR Integration**: Generates PayOS dynamic QR codes encoding exact order codes and amounts for direct mobile banking transfers.
* **Internal Virtual Wallet**: Manages internal credits using a double-entry ledger that records balances before and after every transaction.
* **Transaction Safety**: Protects checkout and deposit operations using PostgreSQL pessimistic locking (`SELECT FOR UPDATE`), late payment recovery (`LATE_SUCCESS`), and scheduled reconciliation jobs.

### 5. Authentication and Access Control
* **Multiple Auth Providers**: Standard email/password authentication alongside Google OAuth2 Single Sign-On (SSO).
* **Dual Bearer Token Resolver**: Reads JWT tokens from standard `Authorization: Bearer <token>` headers or secure `HttpOnly`, `SameSite` cookies to mitigate XSS risks.
* **Refresh Token Rotation (RTR)**: Invalidates spent refresh tokens in PostgreSQL (`invalidated_tokens`), preventing token replay and session hijacking.
* **Contextual Authorization**: Role-based access control (`STUDENT`, `INSTRUCTOR`, `ADMIN`) supplemented by method-level `@PreAuthorize` SpEL checks for resource ownership.

### 6. Asynchronous Bulk Email Pipeline
* **Batch Chunking**: Splits large recipient lists into batches of 500 recipients and routes them through RabbitMQ exchanges.
* **SendGrid Integration**: Injects personalized payload attributes into SendGrid Dynamic Templates.
* **Dead Letter Queue (DLQ)**: Stores failed deliveries in PostgreSQL for automated retries and logs delivery telemetry via signed SendGrid webhooks.

### 7. Automated Testcase Generation
* **Scripted Inputs and Expected Outputs**: Instructors provide an input generator script and a reference solution code.
* **Sandbox Execution**: The system executes both scripts in Judge0 to generate $N$ valid testcases and persists them directly to the database.

## System Architecture

### High-Level Architecture

### Monorepo Directory Structure

```text
codelearning-platform/
├── backend/                      # Spring Boot 3.5.7 Backend Application (Java 21)
│   ├── src/main/java/com/thanhmila/codelearning/
│   │   ├── configuration/        # Bean definitions (Redis, RabbitMQ, WebClient, PayOS, WebSocket)
│   │   ├── controller/           # REST Controllers grouped by domain
│   │   │   ├── auth/             # Authentication, token rotation, SSO endpoints
│   │   │   ├── contest/          # Contest lifecycle, problem sets, submissions, leaderboard
│   │   │   ├── course/           # Courses, chapters, lessons, video, quizzes
│   │   │   ├── oj/               # Online Judge problems, submissions, testcases
│   │   │   └── payment/          # Cart, orders, wallet, PayOS callbacks
│   │   ├── dto/                  # Data Transfer Objects (Request / Response payloads)
│   │   ├── entity/               # JPA Entities mapped to PostgreSQL
│   │   ├── exception/            # Centralized exception handlers (GlobalExceptionHandler)
│   │   ├── listener/             # RabbitMQ message consumers
│   │   ├── mapper/               # MapStruct mappers (Entity <-> DTO)
│   │   ├── repository/           # Spring Data JPA repositories (Projections, Specifications)
│   │   ├── scheduler/            # Scheduled tasks (reconciliation, token cleanup)
│   │   ├── security/             # Spring Security, custom JWT decoder, SpEL evaluators
│   │   └── service/              # Core business logic services
│   ├── Dockerfile                # Multi-stage Docker build for backend
│   ├── Dockerfile.rabbitmq       # RabbitMQ image with delayed exchange plugin
│   └── pom.xml                   # Maven dependencies and plugins
├── frontend/                     # React 19 + TypeScript + Vite Frontend Application
│   ├── src/
│   │   ├── api/                  # Axios HTTP client instances and endpoints
│   │   ├── assets/               # Static media, icons, and illustrations
│   │   ├── components/           # Shared UI components (Monaco Editor, Modals, Navbar)
│   │   ├── context/              # React Context (AuthContext, ThemeContext, CartContext)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layouts/              # Main application and administration layouts
│   │   ├── locales/              # i18n localization resources (en.json, vi.json)
│   │   ├── pages/                # Route views (Home, OJ, Courses, Contest, Cart, Admin)
│   │   ├── types/                # TypeScript interfaces and type definitions
│   │   └── utils/                # Shared helper functions
│   ├── Dockerfile                # Production NGINX container build
│   └── package.json              # Node.js dependencies and scripts
├── database/                     # Database initialization scripts
│   └── schema-only.sql           # Canonical PostgreSQL schema
├── docs/                         # Technical documentation center
│   └── architecture/             # System architecture and workflow specifications
│       ├── online_judge_workflow.md
│       ├── payment_checkout_workflow.md
│       ├── security_authorization_workflow.md
│       ├── email_pipeline_workflow.md
│       ├── contest_scheduling_workflow.md
│       └── testcase_generation_workflow.md
├── docker-compose.dev.yml        # Orchestration for development environment
├── docker-compose.prod.yml       # Orchestration for production deployment
├── judge0.conf                   # Judge0 sandbox configuration
└── README.md                     # Main repository documentation
```

## Getting Started

### Prerequisites

Ensure the following tools are installed on your environment:
* [Docker and Docker Compose](https://www.docker.com/) (Required for containerized runtime)
* [JDK 21](https://www.oracle.com/java/technologies/downloads/) (Required for local backend development)
* [Node.js 20+](https://nodejs.org/) and `npm` (Required for local frontend development)

### 1. Environment Configuration

#### Backend Configuration (`backend/.env`):
Create a `.env` file in the `backend/` directory:
```env
# SERVER CONFIG
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# POSTGRES DATABASE
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codelearning
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# REDIS CACHE
REDIS_HOST=localhost
REDIS_PORT=6379

# RABBITMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# SECURITY & JWT
JWT_SIGNER_KEY=your_super_secret_32_characters_key_here
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token

# THIRD-PARTY INTEGRATIONS
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# JUDGE0 SANDBOX (OJ)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_WEBHOOK_URL=http://your-ip-or-domain:8080/codelearning/api/v1/online-judge/webhooks/submissions
```

#### Frontend Configuration (`frontend/.env`):
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:8080/codelearning
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 2. Running with Docker Compose (Recommended)

Docker Compose is configured with service healthchecks. Infrastructure components (PostgreSQL, Redis, RabbitMQ, and Judge0) start and verify health before launching the Spring Boot backend and React frontend.

#### Development Environment:
```bash
docker compose -f docker-compose.dev.yml --profile backend --profile frontend --profile judge0 up -d
```

#### Production Environment:
```bash
docker compose -f docker-compose.prod.yml --profile backend --profile frontend --profile judge0 up -d
```

### 3. Running Locally

To run the application manually for development or debugging:

#### Step 1: Start Supporting Infrastructure
```bash
docker compose -f docker-compose.dev.yml up -d db redis rabbitmq judge0-server judge0-workers judge0-db judge0-redis
```

#### Step 2: Start the Backend
```bash
cd backend
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```
The API will be available at `http://localhost:8080/codelearning`.

#### Step 3: Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:5173`.
