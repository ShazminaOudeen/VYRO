# VYRO — Studio Fitness Class Booking Platform

[![CI](https://github.com/ShazminaOudeen/VYRO/actions/workflows/ci.yml/badge.svg)](https://github.com/ShazminaOudeen/VYRO/actions)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign)
![MySQL](https://img.shields.io/badge/MySQL-8.4-informational?logo=mysql)
![Flyway](https://img.shields.io/badge/Flyway-Migrations-red?logo=flyway)

> High-integrity, concurrency-safe fitness class scheduling and reservation system built with Spring Boot 3.5.6, Java 21, React 19, and MySQL 8.4.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend ["React 19 + TypeScript + Ant Design"]
        UI[Schedule / My Bookings / Staff Portal]
        UserSwitcher[Context User Switcher]
        APIClient[Axios API Client]
        UI --> UserSwitcher
        UI --> APIClient
    end

    subgraph Backend ["Spring Boot 3.5.6 REST API"]
        Controller[Controllers: /api/classes, /api/bookings, /api/dev]
        Locking["Pessimistic Locking (SELECT FOR UPDATE)"]
        Service["BookingService (ACID Transactions)"]
        Controller --> Service
        Service --> Locking
    end

    subgraph Database ["MySQL 8.4 & Flyway"]
        Flyway[Flyway Schema Migrations]
        Tables[app_users / gym_classes / bookings]
        Flyway --> Tables
        Locking --> Tables
    end

    APIClient -->|REST + JSON / X-User-Id| Controller
