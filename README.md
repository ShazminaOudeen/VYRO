# VYRO: Gym Class Booking Platform
**Software Engineering Assessment**  
*High-concurrency studio scheduling, pessimistic capacity locking, explainable FIFO waitlist engine, and GenAI class discovery.*

[![CI](https://github.com/ShazminaOudeen/VYRO/actions/workflows/ci.yml/badge.svg)](https://github.com/ShazminaOudeen/VYRO/actions)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign)
![MySQL](https://img.shields.io/badge/MySQL-8.4-informational?logo=mysql)
![Flyway](https://img.shields.io/badge/Flyway-Migrations-red?logo=flyway)

---

## 🌐 Local & API Services

| Service | Platform / Host | Local URL | Purpose |
|---|---|---|---|
| **Frontend Web App** | Vite + React 19 | `http://localhost:5173` | Interactive Schedule, Member Booking Hub, Waitlist Queue Tracker, Staff Studio Management |
| **Backend REST API** | Spring Boot 3.5.6 (Java 21) | `http://localhost:8080` | Concurrency-locked booking services, FIFO auto-promotion, Flyway migrations, AI router |
| **Interactive API Documentation** | Swagger / OpenAPI 3 | [`http://localhost:8080/swagger-ui.html`](http://localhost:8080/swagger-ui.html) | Live interactive schema definitions, endpoint documentation, and request/response testing |
| **Database Container** | Docker (MySQL 8.4) | `localhost:3307` | Relational storage with strict foreign keys, unique constraint guarantees, and UTC timestamps |

---

## Table of Contents

- [Description](#description)
- [System Architecture](#system-architecture)
- [Features in the System](#features-in-the-system)
- [Core Business Rules & Invariants](#core-business-rules--invariants)
- [Architectural Decisions on Open Questions](#architectural-decisions-on-open-questions)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Installation & Local Setup](#installation--local-setup)
- [API Reference](#api-reference)
- [Concurrency & Timezone Deep-Dive](#concurrency--timezone-deep-dive)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Candidate & Assessment Details](#candidate--assessment-details)

---

## Description

Boutique fitness studios face acute scheduling contention: popular classes (e.g., CrossFit, HIIT, Spin) reach capacity in seconds. Naive booking systems suffer from race conditions resulting in phantom bookings, oversubscribed studio capacities, schedule clashes, and chaotic cancellations.

**VYRO** is an enterprise-grade studio fitness booking and scheduling platform built to eliminate overbooking and manual waitlist administration. Powered by **Spring Boot 3.5.6 (Java 21)** and **React 19**, VYRO enforces deterministic capacity constraints via **database-level row locks (`PESSIMISTIC_WRITE`)**, guarantees a strictly ordered **FIFO waitlist with automatic cascading promotion**, enforces an immutable **2-hour cancellation cutoff**, and offers **natural language class discovery** via Google Gemini 3.1 Flash Lite with an autonomous offline heuristic fallback engine.

---

## System Architecture

```
[ Member / Staff Browser (React 19 + Ant Design 5) ]
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ UI Routing & State Layer                               │
│ • Schedule with Clash Badges & Waitlist Odds Bar       │
│ • "Ask for a Class" GenAI Finder                       │
│ • Context Switcher: Member 1, 2, 3 or Staff            │
└───────────────────────┬────────────────────────────────┘
                        │ HTTP / REST (JSON)
                        ▼
┌────────────────────────────────────────────────────────┐
│ Spring Boot 3.5.6 REST Controllers & DTO Validation    │
│ • GymClassController, BookingController, AiController  │
│ • GlobalExceptionHandler (RFC 7807 Error Responses)    │
└───────────────────────┬────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│ Gemini 3.1 Flash Lite     │ │ GymBooking Core Service  │
│ • JSON structured output  │ │ • Row Lock (FOR UPDATE)  │
│ • Offline Heuristic Engine│ │ • Double-booking check   │
│   (Keyword/Time scorer)   │ │ • 2-Hour Cutoff check    │
└───────────────────────────┘ │ • FIFO Waitlist Promote  │
                              └────────────┬─────────────┘
                                           │ JPA / Hibernate (UTC)
                                           ▼
                              ┌──────────────────────────┐
                              │ MySQL 8.4 Engine (InnoDB)│
                              │ • Flyway Migration V1    │
                              │ • Users,Classes,Bookings │
                              └──────────────────────────┘
```

---

## Features in the System

### 1. 7-Day Colombo Schedule with Clash Prevention
- Displays dynamic classes across the upcoming 7 days in Sri Lanka Standard Time (`Asia/Colombo`).
- Cross-references the logged-in member's active bookings in real time. Any overlapping class is prominently flagged with a warning badge (`⚠️ Clashes with [Class Name]`), and its booking button is safely disabled with an explanatory tooltip.

### 2. Concurrency-Safe Booking & Capacity Control
- Strictly enforces studio capacity using database-level pessimistic write locking (`SELECT ... FOR UPDATE`).
- Eliminates race conditions and overbooking when multiple members simultaneously attempt to book the final spot.

### 3. FIFO Waitlist Engine with Explainable Odds
- When a class reaches maximum capacity, applicants are automatically placed into a strictly ordered First-In, First-Out (FIFO) queue.
- Computes transparent, explainable waitlist odds: **"Seat likely"** (Queue #1 or #2 with >2 hours before class) vs. **"Seat unlikely"** (Queue #3+ or within the cancellation window).
- Features an Ant Design visual progress bar that displays real-time queue standing and promotion likelihood.

### 4. Automated Cascading Waitlist Promotion
- When a confirmed attendee cancels with >2 hours remaining, the system atomically promotes the next eligible waitlisted member to `BOOKED`.
- If the top waitlisted member has since booked an overlapping class, the engine safely skips them and promotes the next eligible candidate in line.

### 5. 2-Hour Cancellation Cutoff Enforcement
- Members can cancel bookings freely until exactly 120 minutes prior to class start.
- Within 2 hours, cancellations are locked to protect studio attendance and trainer schedules.

### 6. Natural Language "Ask for a Class" AI Finder
- Powered by **Google Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`).
- Members can search in plain English (e.g., *"I want a high-intensity workout on Saturday evening"*).
- The backend filters only bookable, upcoming classes, prompts Gemini for structured JSON recommendations with personalized reasoning, and returns them to the UI.
- **Autonomous Fallback Engine:** If the Gemini API key is missing or the external service is unavailable, the backend transparently switches to an in-memory keyword-and-time scoring engine (`mode: FALLBACK`), ensuring 100% uptime.

### 7. One-Click RFC 5545 Calendar Integration (`.ics`)
- Generates standard `.ics` iCalendar invites for confirmed reservations.
- Pre-populated with UTC timestamps, Sri Lankan local time, class details, trainer credits, and studio coordinates. Imports seamlessly into Google Calendar, Apple Calendar, and Microsoft Outlook.

### 8. Staff Studio Administration Portal
- Dedicated interface (`/staff`) for studio instructors and management.
- Form for scheduling new fitness classes with trainer assignments, duration, and capacity limit controls.
- Real-time studio roster view inspecting confirmed attendees and active waitlist queues.

### 9. Persona & Role Context Switcher
- Instant header switcher allowing examiners to toggle between **Member 1 (Kavindu)**, **Member 2 (Amara)**, **Member 3 (Dilshan)**, and **Staff (Coach Kamal)** without repeated logins.

### 10. 1-Click Seed Data Reset
- Seed database includes 8 realistic classes spanning the next 7 days in Colombo time, including pre-configured edge cases (a full class with waitlist and a class starting within 2 hours).
- Provides a **"Reset Demo Data"** button in the app header and an automated endpoint (`POST /api/dev/reset`) to revert to a pristine demo schedule at any time.

---

## Core Business Rules & Invariants

The system deterministically enforces six fundamental invariants across all transactions:

| # | Invariant / Business Rule | Technical Enforcement | HTTP Status on Violation |
|---|---|---|---|
| **1** | **Strict Studio Capacity** | Pessimistic write lock (`PESSIMISTIC_WRITE`) on `GymClass` record. If confirmed count < capacity, status = `BOOKED`. If full, status = `WAITLISTED`. | Handled gracefully (Auto-Waitlist) |
| **2** | **Duplicate Booking Lock** | A member cannot hold more than one active booking or waitlist entry for the same class (`userId + classId` active check). | `409 CONFLICT` (`ALREADY_BOOKED`) |
| **3** | **2-Hour Cancellation Cutoff** | Cancellations are permitted until exactly 120 minutes prior to class start. Within 2 hours, cancellations are locked to protect studio attendance. | `400 BAD_REQUEST` (`CANCELLATION_DEADLINE_EXCEEDED`) |
| **4** | **FIFO Auto-Promotion** | When an attendee cancels with >2 hours remaining, the #1 waitlisted member is atomically promoted to `BOOKED`. | Automatic in-transaction promotion |
| **5** | **Past Class Immutability** | Classes that have already started or concluded in `Asia/Colombo` time cannot be booked, cancelled, or modified. | `400 BAD_REQUEST` (`CLASS_ALREADY_STARTED`) |
| **6** | **Time Clash Prevention** | A member cannot hold two confirmed `BOOKED` reservations whose class time slots overlap (`startsAt` to `endsAt`). | `409 CONFLICT` (`OVERLAPPING_BOOKING`) |

---

## Architectural Decisions on Open Questions

During system design, three critical edge cases were formally analyzed, resolved, and encoded into the system:

1. **Re-booking After Cancelling:**
   - *Decision:* **Allowed.** If a member cancels their booking or waitlist position, they are permitted to re-book if open seats remain, or rejoin at the tail of the waitlist without penalty.
2. **Waitlist Promotion vs. Time Clashes:**
   - *Decision:* **Graceful Skip.** When a spot opens and the system inspects the #1 waitlisted member, it validates whether that member has since booked another overlapping class. If a clash exists, that member is **skipped**, and promotion automatically cascades to the next eligible waitlisted candidate.
3. **Cancelling a Waitlist Position:**
   - *Decision:* **Allowed under the 2-hour cutoff.** Members can freely leave the waitlist to release queue resources before the 2-hour mark, ensuring fairness to downstream members.

---

## Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Backend Framework** | Java 21, Spring Boot 3.5.6 | Enterprise REST API, dependency injection, transaction management |
| **Data Access & ORM** | Spring Data JPA, Hibernate 6 | Relational entity mapping, pessimistic locking queries |
| **Database & Migrations**| MySQL 8.4 (InnoDB), Flyway | ACID-compliant storage, automated version-controlled schema migrations |
| **API Documentation** | Springdoc OpenAPI 2.8.5, Swagger UI | Interactive API schema documentation and live test console |
| **Frontend Framework**| React 19, TypeScript 5, Vite | Single-page application, fast HMR, strict type safety |
| **UI Component System** | Ant Design 5 (antd), Ant Icons | High-contrast enterprise design system, modals, data tables, tags |
| **Date & Time** | Day.js (frontend), `java.time.Instant` / `ZonedDateTime` (backend) | Dual-layer timezone conversion (`Asia/Colombo` vs. UTC) |
| **Generative AI** | Google GenAI API, Gemini 3.1 Flash Lite | Natural language class recommendation engine |
| **Containerization** | Docker, Docker Compose | Reproducible MySQL 8.4 database environment |

---

## Repository Structure

```
VYRO/
├── .github/workflows/
│   └── ci.yml                     # GitHub Actions CI (Backend Maven test + Frontend lint & build)
├── backend/
│   ├── src/main/java/lk/vyro/gymbooking/
│   │   ├── ai/                    # Gemini 3.1 Flash Lite client, DTOs, and Heuristic Fallback
│   │   ├── booking/               # Booking service, entity, repository, and cancellation controller
│   │   ├── common/                # Global exception handler and RFC 7807 error responses
│   │   ├── config/                # DataSeeder (8 demo classes) and OpenAPI/Swagger config
│   │   ├── dev/                   # DevController (/api/dev/reset)
│   │   ├── gymclass/              # Class entity, repository (FOR UPDATE queries), service, controller
│   │   └── user/                  # AppUser entity, role enum (MEMBER, STAFF), repository
│   ├── src/main/resources/
│   │   ├── application.yaml       # Spring Boot config (port 8080, port 3307 MySQL, UTC timezone)
│   │   └── db/migration/
│   │       └── V1__init_schema.sql# Flyway database schema (users, classes, bookings)
│   ├── src/test/java/             # JUnit 5 & Mockito test suite (concurrency, cutoffs, waitlist)
│   └── pom.xml                    # Maven configuration and dependencies
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Axios REST client with error sanitization
│   │   ├── components/            # Reusable Ant Design UI modules (schedule, booking, common)
│   │   ├── context/useUser.tsx    # Role & Member context switcher
│   │   ├── pages/                 # SchedulePage, MyBookingsPage, StaffPage
│   │   ├── types/index.ts         # TypeScript interfaces (GymClass, Booking, User, AiSuggestion)
│   │   └── utils/calendar.ts      # RFC 5545 .ics calendar invite generator
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml             # MySQL 8.4 container pre-mapped to port 3307
├── TASKS.md                       # Comprehensive delivery roadmap & verification matrix
└── README.md                      # System documentation and operational manual
```

---

## Installation & Local Setup

### Prerequisites
- **Java 21 JDK** (verify with `java -version`)
- **Node.js 20+** and npm (verify with `node -v`)
- **Docker Desktop** (for Option A) **OR** local **MySQL 8.4 Server** (for Option B)
- **Git**

---

### Step 1: Database Setup

#### Option A: Docker Compose (Recommended)
Docker runs MySQL 8.4 isolated on port **`3307`**, avoiding port conflicts with local MySQL instances:
```bash
docker compose up -d
docker compose ps
```

#### Option B: Local MySQL (Port 3306)
If using a native MySQL installation:
1. Open MySQL CLI:
   ```bash
   mysql -u root -p
   ```
2. Execute the setup script:
   ```sql
   CREATE DATABASE IF NOT EXISTS vyro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'vyro'@'localhost' IDENTIFIED BY 'vyro';
   GRANT ALL PRIVILEGES ON vyro.* TO 'vyro'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Set the database URL environment variable:
   ```bash
   # Windows PowerShell:
   $env:DB_URL="jdbc:mysql://localhost:3306/vyro"

   # macOS / Linux / Git Bash:
   export DB_URL="jdbc:mysql://localhost:3306/vyro"
   ```

---

### Step 2: Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. *(Optional)* Add a free Google Gemini API key by creating a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_key_here
   ```
   *(If skipped, the system automatically runs on the offline heuristic engine with zero errors).*
3. Start the backend:
   ```bash
   # Windows:
   ./mvnw spring-boot:run

   # macOS / Linux:
   ./mvnw spring-boot:run
   ```
Backend will start at **`http://localhost:8080`**. Flyway will execute migrations and seed the 8-class schedule.

---

### Step 3: Frontend Setup (Vite + React)

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the web app at **`http://localhost:5173`**.

---

## API Reference

Interactive OpenAPI documentation is live at **`http://localhost:8080/swagger-ui.html`**.

| Method | Endpoint | Description | Request / Query Params | Response |
|---|---|---|---|---|
| `GET` | `/api/classes` | Retrieve 7-day schedule with clash previews | `memberId` (optional) | Array of `GymClassResponse` with `clashesWith` |
| `POST` | `/api/classes` | Create a new studio class (*Staff only*) | `CreateGymClassRequest` JSON | `201 CREATED` with `GymClassResponse` |
| `GET` | `/api/classes/{id}` | Get detailed class metadata | Path `id` | `GymClassResponse` |
| `POST` | `/api/bookings` | Book a class or join the waitlist | `{ "classId": 1, "memberId": 2 }` | `201 CREATED` with `BookingResponse` |
| `DELETE` | `/api/bookings/{id}` | Cancel reservation or leave waitlist | Path `id`, `memberId` query | `200 OK` (triggers FIFO auto-promotion) |
| `GET` | `/api/bookings/my` | Get current member's bookings & queue | `memberId` query | Array of `BookingResponse` |
| `POST` | `/api/ai/suggestions` | Natural language class recommendation | `{ "memberId": 1, "query": "..." }` | `{ "mode": "AI", "suggestions": [...] }` |
| `POST` | `/api/dev/reset` | Wipe and re-seed 8-class demo schedule | None | `{ "status": "SUCCESS" }` |

---

## Concurrency & Timezone Deep-Dive

### 1. Pessimistic Write Locking (`PESSIMISTIC_WRITE`)
To eliminate race conditions when multiple members book the final studio spot simultaneously, the backend utilizes database-level pessimistic locking via Spring Data JPA:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT c FROM GymClass c WHERE c.id = :id")
Optional<GymClass> findByIdForUpdate(@Param("id") Long id);
```

**How It Works:**
1. When a booking request arrives, a database transaction opens.
2. Hibernate executes `SELECT * FROM gym_classes WHERE id = ? FOR UPDATE`, acquiring an exclusive row-level write lock in MySQL.
3. Concurrent transactions attempting to book the same class block at the database level until the first transaction commits.
4. Active bookings are counted under the lock. If count < capacity, the applicant is granted `BOOKED`. If capacity is met, they are deterministically assigned to `WAITLISTED`.
5. The lock releases upon transaction commit, ensuring zero possibility of phantom overbooking.

### 2. Timezone Normalization: UTC Storage + Colombo Display
- **Database Engine:** MySQL stores all timestamps in UTC (`Instant`). Hibernate is configured with `hibernate.jdbc.time_zone: UTC`.
- **Application Logic:** The scheduling engine calculates the 2-hour cancellation cutoff using absolute UTC instant comparisons (`Instant.now().isAfter(cutoff)`).
- **Presentation:** The frontend converts UTC timestamps into Sri Lanka Standard Time (`Asia/Colombo`, UTC+05:30) using Day.js:
  ```typescript
  dayjs(classItem.startsAt).format('dddd, MMMM D, YYYY · h:mm A')
  ```

---

## Testing & Quality Assurance

### Backend Automated Test Suite
The backend includes extensive unit and integration tests covering business invariants and concurrency:

```bash
cd backend
./mvnw test
```

Key test suites:
- **`BookingServiceTest.java`**: Validates pessimistic locking, double-booking prevention, 2-hour cancellation deadline enforcement, and FIFO waitlist promotions.
- **`AiServiceTest.java`**: Verifies Gemini 3.1 JSON parsing, catalog filtering, and automatic heuristic fallback under API failure.
- **`GymClassServiceTest.java`**: Tests clash detection logic and 7-day schedule range constraints.

### Frontend Quality Assurance
```bash
cd frontend
npm run lint
npm run build
```
- **Linting:** 0 warnings, 0 errors across all TypeScript/TSX components.
- **Production Build:** Vite production bundle compiles cleanly.

---

## Troubleshooting & FAQ

#### 1. Port 3307 or 8080 is already in use
- **Port 3307:** If another Docker container is using 3307, change the port mapping in `docker-compose.yml` to `"3308:3306"`, and launch Spring Boot with `$env:DB_URL="jdbc:mysql://localhost:3308/vyro"`.
- **Port 8080:** Change the server port by running `./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081`.

#### 2. Local MySQL Authentication Error (`Access denied for user 'vyro'`)
- Ensure the MySQL user was created with matching credentials:
  ```sql
  ALTER USER 'vyro'@'localhost' IDENTIFIED BY 'vyro';
  GRANT ALL PRIVILEGES ON vyro.* TO 'vyro'@'localhost';
  FLUSH PRIVILEGES;
  ```

#### 3. Java Version Incompatibility
- Spring Boot 3.5.6 requires **Java 21**. Verify your JDK:
  ```bash
  java -version
  ```
  If on Java 17 or older, install OpenJDK 21 or configure your `JAVA_HOME` environment variable to point to JDK 21.

---

## Candidate & Assessment Details

- **Candidate:** G. Shazmina Oudeen
- **Repository:** [https://github.com/ShazminaOudeen/VYRO](https://github.com/ShazminaOudeen/VYRO)
- **Role Target:** Software Engineering Intern Assessment
- **Core Focus:** Concurrency control, distributed transaction safety, clean layered architecture, and explainable AI integration.
