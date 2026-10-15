# VYRO Gym Class Booking: Task Checklist

Tick each box as you finish it. Work in the order below, because later modules depend on earlier ones.

## 0. Already done

- [x] GitHub repo `VYRO` with `.gitignore`
- [x] Spring Boot 3.5.6 on Java 21, Maven wrapper
- [x] Flyway schema `V1__init.sql` (app\_users, gym\_classes, bookings)
- [x] MySQL via Docker (port 3307) and local MySQL (port 3306) both working
- [x] Vite + React + TypeScript + Ant Design + ESLint
- [x] VYRO dark and light theme with saved toggle
- [x] GitHub Actions CI workflow

## 1. Backend foundation (about 20 min)

- [x] Create branch `feature/backend-foundation`
- [x] Create entities: `AppUser`, `GymClass`, `Booking` (+ enums `Role`, `BookingStatus`)
- [x] Create repositories, including `findByIdForUpdate` with `PESSIMISTIC_WRITE`
- [x] Add `Clock` bean in Asia/Colombo (`TimeConfig`)
- [x] Add `ApiError`, `ErrorCode`, `BusinessRuleException`, `NotFoundException`
- [x] Add `GlobalExceptionHandler` (400 invalid input, 404 not found, 409 business rule, 500 unexpected)
- [x] Add `DataSeeder`: at least 3 members, 1 staff, 8 classes, one full class with a waitlist, one class starting within 2 hours
- [x] Run on an empty database and confirm the seeder log line
- [x] Commit, push, merge, CI green

## 2. Booking rules (most heavily graded)

All logic lives in `BookingService`, inside `@Transactional`, after locking the class row.

- [x] Rule 1: free seat gives BOOKED, full class gives WAITLISTED with a queue place (first come, first served)
- [x] Rule 2: no duplicate active booking (BOOKED or WAITLISTED) for the same class and member
- [x] Rule 3: cannot book a class that has already started or finished
- [x] Rule 4: cancellation refused less than 2 hours before start
- [x] Rule 5: when a BOOKED member cancels, the first eligible waitlisted member is promoted automatically (no lost or double seat)
- [x] Rule 6: no overlapping classes for a member's BOOKED classes
- [x] Rule 7: staff create-class validation: capacity 1 to 50, duration 15 to 180, start must be in the future, times in Asia/Colombo
- [x] Every rule returns a clear message and a distinct error code
- [x] Decide and document the open questions (see section 10)

## 3. REST API

- [x] `GET /api/users` (for the user switcher)
- [x] `GET /api/classes` (next 7 days, with seats left or waitlist size)
- [x] `POST /api/classes/{id}/bookings` (book)
- [x] `GET /api/members/{id}/bookings` (my bookings: upcoming BOOKED and WAITLISTED, with queue place and a `cancellable` flag plus reason)
- [x] `DELETE /api/bookings/{id}` or `POST /api/bookings/{id}/cancel` (cancel)
- [x] `POST /api/classes` (staff create class)
- [x] `GET /api/classes/{id}/roster` (seated members and waitlist in queue order)
- [x] Check the acting user's role on staff endpoints and ownership on cancel (do not rely on hidden buttons)
- [x] CORS configured from an environment variable
- [x] Use DTOs, not entities, in responses

## 4. API documentation

- [x] Add `springdoc-openapi-starter-webmvc-ui`
- [x] Document book, cancel and roster: request, a success response and at least one error response each
- [x] Add examples for 400, 404 and 409
- [x] Open `/swagger-ui.html` and check it renders


## 5. Automated tests

- [x] Use a fixed `Clock` in tests
- [x] Test: booking with a free seat, booking a full class (waitlist), queue order
- [x] Test: duplicate booking refused
- [x] Test: past class refused
- [x] Test: cancel before cutoff succeeds, after cutoff refused
- [x] Test: waitlist promotion on cancel, and skipping a member who now overlaps
- [x] Test: overlapping classes refused
- [x] Test: create-class validation (capacity, duration, past start)
- [x] Concurrency test: two parallel bookings for the last seat, only one gets BOOKED
- [x] Confirm `./mvnw verify` passes locally and in CI


## 6. Frontend: shared pieces

- [ ] API client with `axios`, base URL from `VITE_API_URL`
- [ ] Turn the server error JSON into readable messages (toast or inline)
- [ ] User switcher in the header (members and staff), saved in `localStorage`
- [ ] Routes: `/schedule`, `/my-bookings`, `/staff`
- [ ] Reusable Loading, Empty and Error components
- [ ] Dark and light mode working on every screen
- [ ] Check every screen at phone width (F12 device mode)

## 7. Frontend: member side

- [ ] Schedule for the next 7 days, grouped by day
- [ ] Each class shows title, coach, start time, duration, and seats left or waitlist size
- [ ] Book button: shows straight away whether the member got a seat or joined the waitlist, plus queue place
- [ ] Server rule messages shown clearly (duplicate, started, overlap)
- [ ] My bookings page: upcoming bookings and waitlist places
- [ ] Cancel button, disabled with the reason shown when it is no longer allowed
- [ ] Loading, empty and error states on both pages

## 8. Frontend: staff side

- [ ] Create-class form: title, coach, start date and time, duration, capacity
- [ ] Client-side hints for validation, with the server message as the final word
- [ ] Class list with a link to each roster
- [ ] Roster page: members with a seat, and the waitlist in queue order
- [ ] Loading, empty and error states

## 9. Bonus items (each one done well counts)

- [ ] Docker Compose for MySQL (done), and extend to the whole app if time allows
- [ ] GitHub Actions: build and test (done), make it green
- [ ] ESLint (done), add Prettier or Spotless
- [ ] Maven wrapper (done)
- [ ] Reset-to-seed-data endpoint or script (for example `POST /api/dev/reset`, enabled only in a dev profile)
- [ ] CI status badge in the README

## 10. Optional AI feature: "Ask for a class"

Only start this once sections 1 to 8 are finished and tested.

**Backend**

- [ ] Endpoint `POST /api/ai/suggestions` with the member's plain-words request
- [ ] Load only classes that exist in the next 7 days, are not started, and the member could still book
- [ ] Send the model a compact list (id, title, coach, start time, duration) and the request; ask for JSON with up to 3 `{classId, reason}` items
- [ ] Use a free model only: Gemini free tier, Groq, OpenRouter free models, or Ollama locally. Never pay.
- [ ] The backend calls the model; the browser never does. Keep the API key in an environment variable, never in git
- [ ] Parse the JSON safely. Drop any `classId` that is not in the list you sent, drop duplicates, cap at 3
- [ ] If the model is unavailable, times out, returns bad JSON or returns nothing, fall back to keyword and time matching (for example: relaxing = yoga, pilates, stretch; hard = HIIT, boxing, strength; Saturday morning, after 6 pm, this week)
- [ ] Response includes a `mode` field (`AI` or `FALLBACK`) so the UI can show which one answered

**Frontend**

- [ ] "Ask for a class" box on the member screen
- [ ] Show up to 3 results, each with a one-line reason and a Book button
- [ ] Show a clear badge for the answering mode (AI or Keyword match)
- [ ] Loading and empty states ("No matching classes, try different words")

**Be ready to explain in the viva**

- [ ] What you send to the model
- [ ] How you turn its answer into classes
- [ ] What your code does when the answer is wrong or empty

## 11. Unique feature idea: "Clash-aware schedule + Waitlist odds"

Goal: make the app feel smarter than a plain booking list, using data you already have, with no extra services. It also shows off rules 1, 5 and 6.

**Part A: Clash preview on the schedule**

- [ ] When a member views the schedule, mark classes that overlap one of their BOOKED classes with a small "Clashes with Spin Cycle" tag
- [ ] Disable the Book button for those classes and show the reason, while the backend still enforces rule 6
- [ ] Backend returns a `clashesWith` field per class for the current member

**Part B: Waitlist odds**

- [ ] For a waitlisted booking, show "You are #2. Seat likely" or "Seat unlikely" based on position, the time left, and how many members ahead
- [ ] Keep the formula simple and explainable (for example: position 1 or 2 with more than 2 hours left is likely)
- [ ] Show a progress-style queue indicator on My bookings

**Part C (stretch): Add to calendar**

- [ ] "Add to calendar" button on each booking that downloads an `.ics` file (Asia/Colombo time)

## 12. README and delivery

- [ ] Project overview and tech stack
- [ ] How to run: Docker option (port 3307) and local MySQL option (port 3306, with the SQL to create the database and user)
- [ ] Commands for backend, frontend, tests, Swagger URL
- [ ] Seed data summary and how to reset it
- [ ] Decisions on open questions: re-booking after cancelling (allowed), promotion that would now overlap (skip and promote the next person), cancelling a waitlist place (allowed within the same cutoff)
- [ ] Troubleshooting: port conflicts, Docker not running, Java 21
- [ ] AI feature notes: which model, how to get a free key, fallback behavior
- [ ] CI badge
- [ ] Fresh-clone test: clone into a new folder, empty database, follow only the README
- [ ] Confirm everything is merged into `main` and pushed before 11:59 pm Friday
- [ ] Send the repo link (give read access if private)

## 13. Viva preparation

- [ ] Start Docker Desktop (or local MySQL) before the call, and restart the laptop beforehand
- [ ] Java 21, Node, MySQL and Git all work in a fresh Git Bash
- [ ] Close all AI tools and editor assistants for the live change
- [ ] Practise explaining: UTC storage with Colombo display, the row lock, waitlist ordering, promotion, error shape
- [ ] Practise one small live change, for example changing the cutoff from 2 hours to 3 hours or limiting members to 3 bookings per day

