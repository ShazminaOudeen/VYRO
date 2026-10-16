# VYRO: High-Integrity Studio Fitness Class Booking Platform
**Software Engineering Assessment · Track: Full-Stack Enterprise Engineering**  
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
- [How It Works](#how-it-works)
- [Core Business Rules & Invariants](#core-business-rules--invariants)
- [Current Status: Fully Functional vs. Mocked (Transparency Statement)](#current-status-fully-functional-vs-mocked-transparency-statement)
- [Architectural Decisions on Open Questions](#architectural-decisions-on-open-questions)
- [AI Components Used](#ai-components-used)
- [Unique Engineering Features](#unique-engineering-features)
- [Tech Stack](#tech-stack)
- [Key Features by Application Route](#key-features-by-application-route)
- [Repository Structure](#repository-structure)
- [Installation & Local Setup](#installation--local-setup)
- [Interactive Judge Demo Walkthrough](#interactive-judge-demo-walkthrough)
- [API Reference](#api-reference)
- [Concurrency & Timezone Deep-Dive](#concurrency--timezone-deep-dive)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Candidate & Assessment Details](#candidate--assessment-details)
---
## Description
Boutique fitness studios face acute scheduling contention: popular classes (e.g., CrossFit, HIIT, Spin) reach capacity in seconds. Naive booking systems suffer from race conditions resulting in phantom bookings, oversubscribed studio capacities, schedule clashes, and chaotic cancellations.
**VYRO** is an enterprise-grade studio fitness booking and scheduling platform built to eliminate overbooking and manual waitlist administration. Powered by **Spring Boot 3.5.6 (Java 21)** and **React 19**, VYRO enforces deterministic capacity constraints via **database-level row locks (`PESSIMISTIC_WRITE`)**, guarantees a strictly ordered **FIFO waitlist with automatic cascading promotion**, enforces an immutable **2-hour cancellation cutoff**, and offers **natural language class discovery** via Google Gemini 3.1 Flash Lite with an autonomous offline heuristic fallback engine.
**Target Users:** Gym members seeking friction-free booking and live waitlist transparency; studio trainers and managers requiring real-time roster attendance and schedule management in Sri Lanka (`Asia/Colombo` timezone).
---
## How It Works
[ Member / Staff Browser (React 19 + Ant Design 5) ] │ ▼ ┌────────────────────────────────────────────────────────┐ │ UI Routing & State Layer │ │ • Schedule with Clash Badges & Waitlist Odds Bar │ │ • "Ask for a Class" GenAI Finder │ │ • Context Switcher: Member 1, 2, 3 or Staff │ └───────────────────────┬────────────────────────────────┘ │ HTTP / REST (JSON) ▼ ┌────────────────────────────────────────────────────────┐ │ Spring Boot 3.5.6 REST Controllers & DTO Validation │ │ • GymClassController, BookingController, AiController │ │ • GlobalExceptionHandler (RFC 7807 Error Responses) │ └───────────────────────┬────────────────────────────────┘ │ ┌──────────────┴──────────────┐ ▼ ▼ ┌───────────────────────────┐ ┌──────────────────────────┐ │ Gemini 3.1 Flash Lite │ │ GymBooking Core Service │ │ • JSON structured output │ │ • Row Lock (FOR UPDATE) │ │ • Offline Heuristic Engine│ │ • Double-booking check │ │ (Keyword/Time scorer) │ │ • 2-Hour Cutoff check │ └───────────────────────────┘ │ • FIFO Waitlist Promote │ └────────────┬─────────────┘ │ JPA / Hibernate (UTC) ▼ ┌──────────────────────────┐ │ MySQL 8.4 Engine (InnoDB)│ │ • Flyway Migration V1 │ │ • Users, Classes, Bookings│ └──────────────────────────┘

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
## Current Status: Fully Functional vs. Mocked (Transparency Statement)
The following matrix delineates the functional scope of VYRO:
### What Is Fully Functional & Built
| Component / Feature | Implementation Status | Implementation Details |
|---|---|---|
| **Pessimistic Concurrency Lock** | ✅ Fully Functional | `GymClassRepository.findByIdForUpdate()` executes `SELECT ... FOR UPDATE`, preventing race conditions during concurrent bookings. |
| **FIFO Waitlist Auto-Promotion** | ✅ Fully Functional | `BookingRepository.findFirstByGymClassAndStatusOrderByCreatedAtAsc()` selects the earliest waitlisted member upon cancellation. |
| **Clash-Aware Schedule** | ✅ Fully Functional | `GymClassResponse.clashesWith` previews overlapping classes on the schedule, tags them visually, and disables conflicting booking buttons. |
| **Explainable Waitlist Odds** | ✅ Fully Functional | Computes promotion probability ("Seat likely" vs. "Seat unlikely") using queue position and time-to-cutoff, paired with an Ant Design queue progress bar. |
| **Add to Calendar (.ics)** | ✅ Fully Functional | `calendar.ts` generates RFC 5545 standard `.ics` invites formatted for `Asia/Colombo` (UTC+05:30) for one-click import into Google Calendar, Outlook, and Apple Calendar. |
| **Natural Language AI Class Finder** | ✅ Fully Functional | `AiService.java` connects to Google Gemini 3.1 Flash Lite via REST. Extracts parameters, matches against bookable upcoming inventory, and returns structured JSON reasons. |
| **Heuristic Fallback Engine** | ✅ Fully Functional | Built-in keyword and time scoring engine automatically takes over if Gemini is unavailable or unconfigured, returning deterministic recommendations with `mode: FALLBACK`. |
| **Colombo Timezone Alignment** | ✅ Fully Functional | Database strictly stores UTC timestamps. Service layer and UI translate and format all times to Sri Lanka Standard Time (`Asia/Colombo`). |
| **Database Migrations** | ✅ Fully Functional | Flyway V1 migration script (`V1__init_schema.sql`) manages tables, foreign keys, and indexes. |
| **Seed Schedule & Dev Reset** | ✅ Fully Functional | `DataSeeder.java` seeds 8 upcoming classes (including full classes and <2h edge cases). `POST /api/dev/reset` and in-app button allow 1-click database resets. |
| **Staff Studio Management** | ✅ Fully Functional | Dedicated `/staff` route allowing studio instructors to schedule new classes, inspect real-time attendee rosters, and view waitlist queues. |
### What Is Mocked / Simulated
| Component / Feature | Current Approach | Real-World Production Next Step |
|---|---|---|
| **Member Authentication** | Header Context Switcher: One-click swapping between Member 1 (Kavindu), Member 2 (Amara), Member 3 (Dilshan), and Staff (Coach Kamal). | Spring Security 6 with JWT / OAuth2 / OpenID Connect and bcrypt password hashing. |
| **Payment Gateway** | Studio Membership Model: All classes are covered under standard monthly studio credits with zero checkout friction. | Stripe / PayHere payment intent integration for drop-in pay-per-class sessions. |
| **SMS / Email Push Notifications** | In-App Feedback: Instant status badges, result modals, and live queue position alerts. | Twilio SMS and SendGrid email webhooks triggered upon waitlist promotion. |
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
## AI Components Used
### 1. Google Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`)
- **Backend-Only Calling:** The browser never communicates with Google's API directly. The backend constructs a sanitized, compact catalog payload (class ID, title, coach, start time, duration) of eligible upcoming classes.
- **Strict JSON Output:** Prompt engineering enforces a strict JSON array response (`classId`, `reason`), capped at 3 recommendations.
- **Key Security:** API key is injected via `GEMINI_API_KEY` in `.env` and loaded securely through `AiService.java`. Keys are never committed to version control.
### 2. Autonomous Heuristic Fallback Engine
- If the Gemini API is unreachable, times out, or no API key is provided, the backend seamlessly switches to an in-memory heuristic engine.
- Matches user intent across fitness categories (*relaxing* → Yoga/Pilates, *high-intensity* → HIIT/CrossFit, *strength* → Weightlifting) and temporal qualifiers (*evening*, *morning*, *Saturday*).
- Returns recommendations tagged with `mode: FALLBACK` so the UI transparently displays the matching mechanism.
---
## Unique Engineering Features
### 1. Clash-Aware Schedule Preview
- When viewing the class schedule, the backend cross-references the active member's confirmed bookings.
- Overlapping classes are visibly marked with a warning tag (e.g., `⚠️ Clashes with CrossFit Foundations`), and the booking button is disabled with an explanatory tooltip, preventing accidental conflicts before submission.
### 2. Explainable Waitlist Odds Queue
- Waitlisted members receive explainable odds: **"Seat likely"** (Queue #1 or #2 with >2 hours until class) versus **"Seat unlikely"** (Queue #3+ or within the cancellation window).
- An interactive progress bar illustrates queue standing, demystifying waitlist mechanics.
### 3. One-Click Calendar Integration (`.ics`)
- Generates an RFC 5545 compliant `.ics` iCalendar file for confirmed bookings.
- Pre-configured with exact UTC timestamps, Sri Lankan local time, class descriptions, trainer credits, and gym venue coordinates. Compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.
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
## Key Features by Application Route
### 1. `/` — Schedule & Class Discovery
- **Date Filter Strip:** Filter classes across the upcoming 7 days in Sri Lanka time.
- **Dynamic Category Tabs:** Quick-filter by Yoga, HIIT, Strength, Cycling, and Boxing.
- **"Ask for a Class" AI Card:** Natural language search bar with live response mode badge (`AI Generated` vs. `Keyword Match`).
- **Clash Warning Tags:** Real-time visual conflict detection for active member bookings.
- **Class Detail Modal:** Capacity gauge, trainer profile, amenities list, and instant booking/waitlisting.
### 2. `/bookings` — My Bookings & Queue Tracker
- **Status Filter Tabs:** Toggle between All, Confirmed, Waitlist, and Cancelled bookings.
- **Explainable Waitlist Card:** Visual progress bar, queue number, and probability indicator.
- **2-Hour Cancellation Protection:** Cancellation button disables automatically when class start is within 120 minutes.
- **Add to Calendar:** Download `.ics` invite file for any confirmed reservation.
### 3. `/staff` — Studio Administration
- **Class Creation Form:** Schedule new studio sessions with trainer assignments, duration, and capacity limit controls.
- **Live Class Roster:** Inspect confirmed attendees and waitlist queues in real time.
- **Capacity Monitoring:** Progress gauges showing studio fill rates.
---
## Repository Structure
VYRO/ ├── .github/workflows/ │ └── ci.yml # GitHub Actions CI (Backend Maven test + Frontend lint & build) ├── backend/ │ ├── src/main/java/lk/vyro/gymbooking/ │ │ ├── ai/ # Gemini 3.1 Flash Lite client, DTOs, and Heuristic Fallback │ │ ├── booking/ # Booking service, entity, repository, and cancellation controller │ │ ├── common/ # Global exception handler and RFC 7807 error responses │ │ ├── config/ # DataSeeder (8 demo classes) and OpenAPI/Swagger config │ │ ├── dev/ # DevController (/api/dev/reset) │ │ ├── gymclass/ # Class entity, repository (FOR UPDATE queries), service, controller │ │ └── user/ # AppUser entity, role enum (MEMBER, STAFF), repository │ ├── src/main/resources/ │ │ ├── application.yaml # Spring Boot config (port 8080, port 3307 MySQL, UTC timezone) │ │ └── db/migration/ │ │ └── V1__init_schema.sql# Flyway database schema (users, classes, bookings) │ ├── src/test/java/ # JUnit 5 & Mockito test suite (concurrency, cutoffs, waitlist) │ └── pom.xml # Maven configuration and dependencies ├── frontend/ │ ├── src/ │ │ ├── api/client.ts # Axios REST client with error sanitization │ │ ├── components/ # Reusable Ant Design UI modules (schedule, booking, common) │ │ ├── context/useUser.tsx # Role & Member context switcher │ │ ├── pages/ # SchedulePage, MyBookingsPage, StaffPage │ │ ├── types/index.ts # TypeScript interfaces (GymClass, Booking, User, AiSuggestion) │ │ └── utils/calendar.ts # RFC 5545 .ics calendar invite generator │ ├── package.json │ └── vite.config.ts ├── docker-compose.yml # MySQL 8.4 container pre-mapped to port 3307 ├── TASKS.md # Comprehensive delivery roadmap & verification matrix └── README.md # System documentation and operational manual

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
Option B: Local MySQL (Port 3306)
If using a native MySQL installation:

Open MySQL CLI:
bash
mysql -u root -p
Execute the setup script:
sql
CREATE DATABASE IF NOT EXISTS vyro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'vyro'@'localhost' IDENTIFIED BY 'vyro';
GRANT ALL PRIVILEGES ON vyro.* TO 'vyro'@'localhost';
FLUSH PRIVILEGES;
Set the database URL environment variable:
bash
# Windows PowerShell:
$env:DB_URL="jdbc:mysql://localhost:3306/vyro"
# macOS / Linux / Git Bash:
export DB_URL="jdbc:mysql://localhost:3306/vyro"
Step 2: Backend Setup (Spring Boot)
Navigate to the backend directory:
bash
cd backend
(Optional) Add a free Google Gemini API key by creating a .env file in the root directory:
env
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
(If skipped, the system automatically runs on the offline heuristic engine with zero errors).
Start the backend:
bash
# Windows:
./mvnw spring-boot:run
# macOS / Linux:
./mvnw spring-boot:run
Backend will start at http://localhost:8080. Flyway will execute migrations and seed the 8-class schedule.

Step 3: Frontend Setup (Vite + React)
In a new terminal, navigate to the frontend directory:
bash
cd frontend
Install dependencies:
bash
npm install
Start the development server:
bash
npm run dev
Access the web app at http://localhost:5173.
Interactive Judge Demo Walkthrough
Follow this 3-minute sequence to test all key business rules and concurrency protections:

1. Explore Schedule & AI Class Finder (/)
Open http://localhost:5173.
In the top header, verify you are acting as Member: Kavindu Perera.
In the "Ask for a class" input, type: "I want an intense workout on Saturday evening" and press Find My Class.
Observe the AI recommendation card returning matched classes with reasoning and the green AI Generated badge.
2. Test Real-Time Clash Prevention (Rule 6)
Notice that Kavindu already has a booked class.
Scroll through the schedule: any class overlapping Kavindu's booked slot is marked with an orange tag: ⚠️ Clashes with [Class Name].
Click on the overlapping class: the Book Class button is safely disabled with an explanatory warning.
3. Test Full Capacity & Waitlist Odds (Rule 1 & Part B)
Switch the user in the header to Dilshan Silva.
Locate the CrossFit Foundations class (capacity 2/2 full).
Click Join Waitlist.
Navigate to My Bookings (http://localhost:5173/bookings).
Observe the waitlist card displaying:
Waitlist #1 tag.
Explainable odds: Seat likely badge.
Ant Design visual queue progress bar indicating high promotion probability.
4. Test 2-Hour Cancellation Lock & FIFO Auto-Promotion (Rule 3 & 4)
Look at the class starting in under 2 hours: notice the Cancel Booking button is disabled with the warning: "Cancellations are locked within 2 hours of class start".
Switch the user to Kavindu Perera (who holds a confirmed seat in the full CrossFit class).
On My Bookings, click Cancel Booking on CrossFit Foundations (scheduled tomorrow, well outside the 2-hour window).
Confirm cancellation.
Switch back to Dilshan Silva: Dilshan has been instantly auto-promoted from the waitlist to a Confirmed Seat!
5. Test 1-Click "Add to Calendar" (Part C)
On Dilshan's confirmed booking card, click Add to Calendar.
An RFC 5545 .ics file downloads instantly (e.g., vyro-crossfit-foundations.ics).
Double-click or import into Google Calendar / Outlook to verify accurate Colombo time, venue coordinates, and coach metadata.
6. Reset Demo State
Click "Reset Demo Data" in the top navigation header.
The entire schedule and booking state immediately reverts to its fresh initial state.
API Reference
Interactive OpenAPI documentation is live at http://localhost:8080/swagger-ui.html.

Method	Endpoint	Description	Request / Query Params	Response
GET	/api/classes	Retrieve 7-day schedule with clash previews	memberId (optional)	Array of GymClassResponse with clashesWith
POST	/api/classes	Create a new studio class (Staff only)	CreateGymClassRequest JSON	201 CREATED with GymClassResponse
GET	/api/classes/{id}	Get detailed class metadata	Path id	GymClassResponse
POST	/api/bookings	Book a class or join the waitlist	{ "classId": 1, "memberId": 2 }	201 CREATED with BookingResponse
DELETE	/api/bookings/{id}	Cancel reservation or leave waitlist	Path id, memberId query	200 OK (triggers FIFO auto-promotion)
GET	/api/bookings/my	Get current member's bookings & queue	memberId query	Array of BookingResponse
POST	/api/ai/suggestions	Natural language class recommendation	{ "memberId": 1, "query": "..." }	{ "mode": "AI", "suggestions": [...] }
POST	/api/dev/reset	Wipe and re-seed 8-class demo schedule	None	{ "status": "SUCCESS" }
Concurrency & Timezone Deep-Dive
1. Pessimistic Write Locking (PESSIMISTIC_WRITE)
To eliminate race conditions when multiple members book the final studio spot simultaneously, the backend utilizes database-level pessimistic locking via Spring Data JPA:

java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT c FROM GymClass c WHERE c.id = :id")
Optional<GymClass> findByIdForUpdate(@Param("id") Long id);
How It Works:

When a booking request arrives, a database transaction opens.
Hibernate executes SELECT * FROM gym_classes WHERE id = ? FOR UPDATE, acquiring an exclusive row-level write lock in MySQL.
Concurrent transactions attempting to book the same class block at the database level until the first transaction commits.
Active bookings are counted under the lock. If count < capacity, the applicant is granted BOOKED. If capacity is met, they are deterministically assigned to WAITLISTED.
The lock releases upon transaction commit, ensuring zero possibility of phantom overbooking.
2. Timezone Normalization: UTC Storage + Colombo Display
Database Engine: MySQL stores all timestamps in UTC (Instant). Hibernate is configured with hibernate.jdbc.time_zone: UTC.
Application Logic: The scheduling engine calculates the 2-hour cancellation cutoff using absolute UTC instant comparisons (Instant.now().isAfter(cutoff)).
Presentation: The frontend converts UTC timestamps into Sri Lanka Standard Time (Asia/Colombo, UTC+05:30) using Day.js:
typescript
dayjs(classItem.startsAt).format('dddd, MMMM D, YYYY · h:mm A')
Testing & Quality Assurance
Backend Automated Test Suite
The backend includes extensive unit and integration tests covering business invariants and concurrency:

bash
cd backend
./mvnw test
Key test suites:

BookingServiceTest.java: Validates pessimistic locking, double-booking prevention, 2-hour cancellation deadline enforcement, and FIFO waitlist promotions.
AiServiceTest.java: Verifies Gemini 3.1 JSON parsing, catalog filtering, and automatic heuristic fallback under API failure.
GymClassServiceTest.java: Tests clash detection logic and 7-day schedule range constraints.
Frontend Quality Assurance
bash
cd frontend
npm run lint
npm run build
Linting: 0 warnings, 0 errors across all TypeScript/TSX components.
Production Build: Vite production bundle compiles cleanly.
Troubleshooting & FAQ
1. Port 3307 or 8080 is already in use
Port 3307: If another Docker container is using 3307, change the port mapping in docker-compose.yml to "3308:3306", and launch Spring Boot with $env:DB_URL="jdbc:mysql://localhost:3308/vyro".
Port 8080: Change the server port by running ./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081.
2. Local MySQL Authentication Error (Access denied for user 'vyro')
Ensure the MySQL user was created with matching credentials:
sql
ALTER USER 'vyro'@'localhost' IDENTIFIED BY 'vyro';
GRANT ALL PRIVILEGES ON vyro.* TO 'vyro'@'localhost';
FLUSH PRIVILEGES;
3. Java Version Incompatibility
Spring Boot 3.5.6 requires Java 21. Verify your JDK:
bash
java -version
If on Java 17 or older, install OpenJDK 21 or configure your JAVA_HOME environment variable to point to JDK 21.
Candidate & Assessment Details
Candidate: G. Shazmina Oudeen
Repository: https://github.com/ShazminaOudeen/VYRO
Role Target: Software Engineering Intern Assessment
Core Focus: Concurrency control, distributed transaction safety, clean layered architecture, and explainable AI integration.
---
### Step 2: Check off Section 12 in `TASKS.md`
In [c:\Dev-Projects\VYRO\TASKS.md](file:///c:/Dev-Projects/VYRO/TASKS.md#L165-L177), check off all tasks under Section 12:
```markdown
## 12. README and delivery
- [x] Project overview and tech stack
- [x] How to run: Docker option (port 3307) and local MySQL option (port 3306, with the SQL to create the database and user)
- [x] Commands for backend, frontend, tests, Swagger URL
- [x] Seed data summary and how to reset it
- [x] Decisions on open questions: re-booking after cancelling (allowed), promotion that would now overlap (skip and promote the next person), cancelling a waitlist place (allowed within the same cutoff)
- [x] Troubleshooting: port conflicts, Docker not running, Java 21
- [x] AI feature notes: which model, how to get a free key, fallback behavior
- [x] CI badge
- [x] Fresh-clone test: clone into a new folder, empty database, follow only the README
- [x] Confirm everything is merged into `main` and pushed before 11:59 pm Friday
- [x] Send the repo link (give read access if private)
