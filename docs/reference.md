# SproutSense Project Dossier

This document is the main writing base for the full SproutSense submission. It is intentionally detailed so that it can be expanded into a 60+ page report, a synopsis, a presentation deck, speaker notes, and a user-guide appendix without needing to rediscover the project structure.

The text is grounded in the current repository, especially the architecture, frontend, backend, firmware, onboarding, operations, and styling documentation.

## 1. Project Identity

### 1.1 Title

SproutSense: An IoT-Based Smart Plant Monitoring and Automated Irrigation System with Dual ESP32 Architecture, Web Dashboard, and AI-Assisted Disease Detection

### 1.2 Project Type

SproutSense is a full-stack IoT and web application project. It combines embedded sensing, cloud-backed persistence, browser-based monitoring, automated irrigation, and AI-assisted analysis for plant health management.

### 1.3 Core Idea

The main idea behind SproutSense is simple: plants need continuous observation, but manual observation is slow, inconsistent, and difficult to scale. SproutSense solves this by collecting soil and environmental readings from an ESP32 sensor controller, forwarding the data to a backend API, storing it in MongoDB, and exposing the information through a real-time web dashboard. A separate ESP32-CAM module is used for camera-based plant disease workflows so that image capture and classification do not interfere with the sensor controller.

### 1.4 One-Sentence Summary

SproutSense turns plant monitoring into a connected system where sensor data, watering controls, analytics, and administrative management all work together in one dashboard.

### 1.5 Official Project Links

- GitHub repository: https://github.com/AV-iot-ai/SproutSense
- Live website: https://sproutsenseiot.netlify.app/

## 2. Executive Summary

SproutSense is an IoT platform designed to support automated plant care and remote monitoring. It uses a dual-device model, with one ESP32 acting as a sensor and irrigation controller and another ESP32-CAM handling disease-image capture. The backend is built with Node.js and Express and stores domain data in MongoDB. The frontend is a React and Vite web application that presents live telemetry, historical trends, alerts, controls, AI recommendations, authentication flows, and admin utilities.

The platform is organized around real-world workflow rather than isolated technical features. Public pages introduce the project, authenticated dashboard views present live and historical data, viewer roles get restricted access, and admins manage users, device keys, configuration, and logs. The styling system uses a plant-inspired visual language built on green, teal, and dark-glass surfaces with light-mode support. Together, these layers create a complete system that can be explained from hardware wiring all the way to cloud deployment and browser UI.

## 3. Abstract

SproutSense is an integrated smart agriculture system that monitors plant health, automates watering, and provides analytics through a web-based interface. The system combines an ESP32 sensor module, an ESP32-CAM disease module, a Node.js backend, MongoDB storage, and a React dashboard. The sensor module reads soil moisture, temperature, humidity, light, and flow-related values, while the camera module captures leaf images for disease-oriented workflows. The backend validates and stores readings, manages authentication and permissions, exposes REST endpoints, and broadcasts updates through WebSocket. The frontend presents live data, charts, alerts, AI recommendations, configuration controls, and administrative tools. The result is a practical IoT platform that connects edge devices and browser-based monitoring into a single plant-care experience.

## 4. Problem Statement

### 4.1 Why the Project Exists

Plant care is often performed manually. That creates several recurring problems:

- watering happens too early or too late
- soil moisture and environmental changes are not tracked continuously
- disease symptoms are noticed only after visible damage appears
- historical patterns are difficult to review
- multi-user environments need permissions, auditability, and control

### 4.2 Operational Need

The project was built to provide continuous monitoring and safer control. A plant owner, student, researcher, or operator should be able to see current readings, review trends, and trigger watering only when necessary. The system also needs a clear separation between hardware sensing, backend logic, and browser visualization so that each layer can be maintained independently.

### 4.3 Problem Addressed by SproutSense

SproutSense addresses these issues by combining:

- live telemetry from sensors
- remote irrigation control
- historical analytics
- camera-based disease workflows
- role-based access control
- a visually clear dashboard and public website

## 5. Project Objectives

### 5.1 Primary Objectives

1. Monitor plant health parameters continuously.
2. Automate irrigation when soil conditions are below the target range.
3. Present live and historical data in a browser dashboard.
4. Support plant disease detection workflows through an ESP32-CAM module.
5. Allow administrators to manage users, permissions, and device settings.

### 5.2 Secondary Objectives

1. Provide a public-facing website that explains the project.
2. Keep the hardware and software stack modular.
3. Use WebSocket for near-real-time updates.
4. Store operational data in MongoDB for trend analysis.
5. Offer a polished interface with a coherent plant-themed design system.

### 5.3 Success Criteria

The project is successful if the system can:

- collect readings reliably
- store and display the readings correctly
- show alerts and analytics in the dashboard
- perform watering actions safely
- handle authentication and permission checks
- support deployment on Render and Netlify

## 6. Scope

### 6.1 In Scope

- public website pages
- login, registration, and password recovery pages
- sensor dashboard and analytics views
- watering controls and alerts
- AI-assisted chat and recommendation UI
- admin panel and viewer panel
- ESP32 sensor controller firmware
- ESP32-CAM disease capture firmware
- backend APIs, database models, middleware, and WebSocket service
- deployment and environment configuration

### 6.2 Out of Scope

- native mobile app development
- custom PCB design
- enterprise-scale analytics or machine-learning training pipelines
- formal hardware manufacturing documentation
- full security certification or penetration testing

### 6.3 Practical Boundaries

The project is intended as a production-style academic prototype. It demonstrates architecture, integration, and usability, but it is not claiming medical, agricultural certification, or field-level precision under all environmental conditions.

## 7. System Overview

### 7.1 High-Level Structure

SproutSense is organized into four main layers:

1. Edge devices
2. Backend service
3. Database and integrations
4. Frontend web application

### 7.2 Edge Devices

The hardware side uses two separate modules:

- ESP32-SENSOR for soil and environmental readings plus irrigation control
- ESP32-CAM for camera capture and disease-oriented inference workflows

### 7.3 Backend Service

The backend is a Node.js and Express application that exposes APIs for authentication, users, roles, sensors, watering, configuration, public pages, AI features, and device endpoints. It validates data, applies security controls, and serves as the central orchestrator for hardware and UI behavior.

### 7.4 Database and Integrations

MongoDB stores readings, logs, configuration, roles, permissions, device state, and AI-related usage records. The backend also integrates with services such as WebSocket, email, weather, and generative AI where enabled.

### 7.5 Frontend Application

The React application provides public routes, authentication routes, protected dashboard views, viewer pages, and admin views. It consumes REST data for snapshots and history, uses WebSocket for live state updates, and uses a visual design system based on plant colors and glassmorphism.

## 8. Architecture Detail

### 8.1 Dual ESP32 Architecture

SproutSense uses a split-device model to reduce complexity and improve stability. The sensor controller handles environmental telemetry and irrigation logic. The camera module handles image capture and disease-related events. Separating these responsibilities helps avoid overloading a single board and makes troubleshooting easier.

### 8.2 Data Flow

The operational data path is:

1. Sensors read values from the physical environment.
2. The ESP32-SENSOR firmware packages readings into JSON.
3. The firmware sends the payload to the backend API.
4. The backend validates and stores the values in MongoDB.
5. The backend broadcasts updates through WebSocket.
6. The React app updates live dashboard cards and charts.
7. The AI and analytics views consume the same historical data.

### 8.3 Responsibilities by Layer

#### Frontend

- rendering the user interface
- handling route protection and role-aware views
- showing real-time state and historical charts
- displaying public pages and admin tools

#### Backend

- enforcing authentication and permissions
- validating input data
- persisting readings and logs
- coordinating watering and AI workflows
- exposing REST and health endpoints

#### Firmware

- reading sensors
- controlling relay and pump output
- sending data to the API
- maintaining device-specific logic and safety checks

#### Database

- storing readings, users, roles, logs, and configs
- supporting analytics and history queries
- keeping operational state available across sessions

### 8.4 Deployment Topology

- Backend on Render
- Frontend on Netlify
- MongoDB on Atlas

This deployment model matches the repository’s documented separation of concerns and keeps the API, dashboard, and database independently configurable.

### 8.5 Architecture Explained End-to-End

This subsection can be used in viva and report chapters when asked to explain the full architecture in plain language.

#### 8.5.1 Edge Layer (Device Layer)

SproutSense uses two hardware nodes with separate duties:

- ESP32-SENSOR: reads moisture, DHT22 values, light, and flow; controls relay output for pump and optional buzzer
- ESP32-CAM: captures plant images and sends disease-detection payloads

Why split devices:

- avoids overloading a single board
- protects sensor-loop timing from camera-heavy tasks
- simplifies debugging and replacement

#### 8.5.2 Ingestion Layer (API Entry)

Each device sends HTTP JSON payloads to backend device-facing endpoints. The backend verifies device identity, validates required fields, and rejects malformed or unauthorized payloads.

Key behavior:

- input validation prevents bad sensor and disease records
- request handling is separated by route groups
- error responses are centralized for consistency

#### 8.5.3 Core Service Layer (Business Logic)

After ingestion, controllers and services apply project rules:

- normalize and store telemetry
- track device status and heartbeat state
- process disease detections and confidence
- enforce watering logic and safety boundaries
- apply RBAC checks for user-triggered operations

This is the layer that connects raw hardware events to user-visible actions.

#### 8.5.4 Data Layer (MongoDB)

MongoDB acts as the system memory. It stores:

- sensor time-series data
- watering logs
- disease detection records
- user, role, and permission entities
- configuration and admin logs

Because data is persisted, the dashboard can show trends and not just current snapshots.

#### 8.5.5 Realtime Layer (WebSocket)

When new readings or AI events arrive, backend WebSocket broadcasts updates to connected dashboard clients. This reduces stale UI state and supports near-real-time cards, alerts, and charts.

#### 8.5.6 Presentation Layer (React Dashboard)

The frontend consumes both REST and WebSocket:

- REST provides initial and historical datasets
- WebSocket pushes live updates
- route guards enforce auth and role permissions
- admin and viewer experiences are separated by access level

#### 8.5.7 Security Layer Across All Tiers

Security is not a single middleware. It is cross-layer:

- JWT session handling for users
- role/permission checks before protected actions
- device identity checks for firmware posts
- CORS and rate limiting at API boundary
- centralized error handling and audit-style logs

#### 8.5.8 Full Operational Sequence

1. ESP32-SENSOR samples physical values.
2. Firmware sends structured JSON to backend.
3. Backend validates and stores telemetry.
4. Backend emits WebSocket update.
5. Dashboard refreshes cards/charts.
6. User triggers watering action (if permitted).
7. Backend applies control rule and logs event.
8. ESP32-CAM sends disease result.
9. Backend stores detection and emits alerts/insights.
10. Admin reviews logs, users, and configuration from the control panel.

## 9. Website and Frontend Application

### 9.1 Frontend Purpose

The website is the primary human interface for the system. It communicates the project publicly, supports authentication for users, presents live data to operators, and provides administrative controls for privileged users.

### 9.2 Route Structure

The app uses a route-based structure with several groups:

#### Public routes

- /
- /about
- /features
- /plant-library
- /demo
- /contact

#### Authentication routes

- /login
- /register
- /forgot-password
- /reset-password
- /verify-email
- /verify-pending
- /access-denied

#### Protected dashboard routes

- /home
- /sensors
- /analytics
- /alerts
- /controls
- /ai
- /insights
- /esp32
- /settings

#### Viewer routes

- /viewer/dashboard
- /viewer/analytics
- /viewer/reports

#### Admin route

- /admin

#### Preview routes

- /preview/dashboard
- /preview/analytics
- /reports-preview

### 9.3 Layout Model

The application uses a common layout for dashboard experiences. Sidebar navigation and the top navbar are separated into reusable components. This keeps the main page logic focused on the content area while allowing consistent navigation, branding, and role-dependent visibility.

### 9.4 State and Data Flow

The frontend combines several input sources:

- REST API calls for initial snapshots and historical data
- WebSocket messages for live updates
- local UI state for theme, sidebar behavior, and controls
- mock data support for development or demo mode

The root app also polls for periodic data, including sensor updates every 5 seconds and disease detections every 60 seconds. This gives the UI a dependable refresh pattern even when a live socket feed is delayed.

### 9.5 Theme and Motion

The interface includes:

- a dark and light theme toggle
- an animated Aurora background layer
- page transition motion
- glassmorphism card surfaces
- responsive layout behavior for desktop and mobile

### 9.6 Public Website Experience

The public side of the website exists to explain the project before login. It should communicate:

- what the system does
- why it matters
- how the hardware and software work together
- what features are available
- how the dashboard looks and feels

### 9.7 Dashboard Experience

Once authenticated, users should see:

- overview cards
- live sensor cards
- analytical charts
- alerts and notifications
- watering controls
- AI recommendations
- system status and settings

### 9.8 Admin Experience

Admin views focus on governance and operational control. The admin area covers user and role management, device keys, logs, raw data, configuration, UI settings, and mock-data controls.

### 9.9 Viewer Experience

Viewer users have limited visibility. They can inspect allowed dashboards and reports but do not receive the same control permissions as admin or full user roles.

## 10. Backend API and Services

### 10.1 Backend Purpose

The backend is the central coordination layer for the whole system. It receives incoming sensor data, manages user sessions and permissions, stores operational data, supports AI flows, and exposes the information used by the frontend.

### 10.2 Technical Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT-based authentication
- WebSocket support
- helmet, cors, compression, morgan, and rate limiting

### 10.3 Server Entry Points

The backend has a clear startup path:

- app.js configures middleware and routes
- server.js starts the HTTP server and WebSocket server
- database connection is established at boot
- RBAC seeding is triggered on startup
- cron tasks create sensor snapshots

### 10.4 API Route Groups

The documented route groups are:

- /api/auth
- /api/users
- /api/roles
- /api/device
- /api/public
- /api/sensors
- /api/water
- /api/config
- /api/ai

### 10.5 Health and Status Endpoints

The backend also exposes operational checks such as:

- root API check
- /healthz
- /api summary route

These endpoints are used for startup verification and deployment validation.

### 10.6 Security Middleware

The backend includes the following protection layers:

- authentication token parsing and verification
- account-state checks
- permission enforcement
- device authentication for hardware requests
- rate limiting on the API namespace
- centralized error handling

### 10.7 Configuration and Environment Control

The backend relies on environment variables for connection and deployment behavior. The key values include MongoDB URI, port, node environment, and allowed frontend origin. Production startup validates required variables before booting the server.

### 10.8 WebSocket Layer

The backend also opens a WebSocket server for live updates. This supports real-time dashboard behavior and reduces the need for constant polling. The server responds to ping/pong behavior and broadcasts connection state so the frontend can stay synchronized.

### 10.9 Scheduled Tasks

The backend includes scheduled sensor snapshot behavior so that the telemetry history remains useful even when readings are sparse. This supports graph continuity and trend visibility.

## 11. Database Design

### 11.1 Database Role

MongoDB stores the project’s operational history and structured application data. The database is essential for analytics, permissions, auth flows, and device management.

### 11.2 Core Models

The current structure includes models such as:

- User
- Role
- Permission
- RolePermission
- AuthToken
- SensorReading
- WateringLog
- DeviceStatus
- DiseaseDetection
- SystemConfig
- AIUsageQuota
- PreRegisteredDevice
- UserDevice
- AdminLog

### 11.3 Main Data Categories

#### Identity and Access

Users, roles, permissions, and tokens define who can access what.

#### Sensor Telemetry

Sensor readings capture moisture, temperature, humidity, light, and flow-related values.

#### Watering Activity

Watering logs document start, stop, and runtime behavior.

#### Device State

Device status records help the dashboard understand whether the sensor system is online and healthy.

#### AI and Disease

Disease detections and AI usage records track image-driven workflows and quotas.

#### Configuration and Audit

System config and admin logs support governance and operational traceability.

### 11.4 Why the Database Matters

Without persistence, the dashboard would only show current values. MongoDB makes it possible to:

- review trends
- compare readings over time
- inspect watering history
- audit role and configuration changes
- support analytics and reporting

## 12. Authentication, Roles, and Permissions

### 12.1 Role Model

The main roles are:

- admin
- user
- viewer

### 12.2 Permission Idea

Permissions are finer-grained than roles. That means a role does not simply unlock the whole app; instead, a role maps to explicit capabilities such as dashboard reading, watering control, AI chat, and configuration access.

### 12.3 Typical Access Pattern

- admins can manage users, configuration, logs, and device keys
- users can operate the dashboard and watering controls where allowed
- viewers can inspect limited dashboards and reports

### 12.4 Supported Authentication Flows

- register
- email verification
- login
- logout
- token refresh
- forgot password
- reset password

### 12.6 User Registration Flow (Step-by-Step)

Use this exact sequence in the report and demo explanation.

1. Open the public website: https://sproutsenseiot.netlify.app/
2. Click Register and fill name, email, and password.
3. Submit form to backend auth register endpoint.
4. Backend validates payload and password policy.
5. User account is created with default role mapping.
6. Verification token flow is generated for email confirmation.
7. User opens verification link or verification page.
8. Account state changes from pending to verified.
9. User logs in from the login page.
10. Backend issues auth tokens and frontend stores session state.
11. Route guards unlock protected dashboard pages based on permissions.

### 12.7 Registration Failure Cases and User Guidance

Common registration/login blockers to mention in viva:

- email already exists: user should login or reset password
- weak password: user must satisfy password policy
- unverified account: user must complete email verification first
- expired token: user requests a new verification or reset link
- wrong frontend/backend URL setup in local mode: verify VITE and API env values

### 12.5 Why RBAC Matters

The project is not only about displaying data. It is also about controlling who can modify the system. RBAC prevents viewers from operating pumps, protects settings from accidental changes, and gives admins a safer management surface.

## 13. Firmware and Hardware Implementation

### 13.1 Firmware Strategy

The firmware layer is split into two modules to match the system architecture:

- ESP32-SENSOR for sensing and irrigation control
- ESP32-CAM for image capture and disease workflows

### 13.2 ESP32-SENSOR Responsibilities

The sensor controller reads the physical environment and decides when irrigation should occur. It handles:

- soil moisture
- temperature
- humidity
- light
- flow rate
- manual button input
- relay and pump control
- optional buzzer alert

### 13.3 ESP32-CAM Responsibilities

The camera module is used for leaf imaging and disease-oriented event capture. It avoids mixing camera-heavy processing with the sensor controller’s timing-sensitive reading cycle.

### 13.4 Sensor List

The current wiring and configuration notes reference these inputs:

- soil moisture sensor
- DHT22 temperature and humidity sensor
- LDR light sensor
- YFS401 (YF-S401) flow sensor

### 13.5 Control Outputs

The sensor board also manages:

- push button input for local pump toggling
- relay output for pump control
- optional buzzer output for audible alerts

### 13.6 Firmware Communication

Firmware sends JSON payloads to the backend API. It must keep field names synchronized with the backend payload expectations so readings, timestamps, and device metadata remain compatible.

### 13.7 Safety Notes

The system documentation emphasizes several safety and stability rules:

- use ADC1 pins for analog sensors
- avoid ADC2 for Wi-Fi stability
- power the pump from an external supply
- keep a common ground across devices
- ensure the relay logic is wired safely

### 13.8 Firmware Upload Workflow

The typical firmware workflow is:

1. open the module in the Arduino environment
2. select the correct ESP32 board and port
3. set Wi-Fi credentials and backend URL values
4. verify device IDs and timezone settings
5. compile and upload
6. monitor serial output
7. confirm backend ingestion and dashboard updates

### 13.9 Documented Pin Mapping

The current configuration reference uses the following mapping:

| Signal | Pin | Purpose |
|---|---:|---|
| Soil moisture AO | GPIO 35 | Soil moisture input |
| LDR (digital) | GPIO 32 | Light input (digital) |
| DHT22 DATA | GPIO 13 | Temperature and humidity |
| Flow pulse | GPIO 26 | Water flow pulses |
| Relay IN1 | GPIO 14 | Pump relay control |
| Buzzer | GPIO 27 | Optional audible alert |

### 13.10 Thresholds and Operating Values

The documented thresholds include:

- soil moisture trigger around 30 percent
- soil moisture target around 70 percent
- temperature comfort range 18 to 28 C
- humidity comfort range 40 to 75 percent

These values should be described in the report as current project thresholds rather than universal agricultural limits.

## 14. Wiring and Physical Assembly

### 14.1 ESP32 Sensor Controller Board

The sensor controller uses an ESP32-WROOM-32 DevKit as the hardware base. It connects the analog sensors, relay, pump, manual button, and optional buzzer. The board must be powered correctly and must share ground with the external pump circuit.

### 14.2 Relay and Pump Wiring

The recommended safe wiring pattern is:

- relay VCC to 5V
- relay GND to GND
- relay IN1 to GPIO 14
- PSU positive to relay COM
- relay NO to pump positive
- pump negative to PSU ground
- PSU ground to ESP32 ground

Using the normally-open contact means the pump stays off by default, which is the safer behavior for a watering system.

### 14.3 DHT22 Wiring

The DHT22 sensor should be powered at 3.3V, connected to GPIO 13 for data, and tied to ground. A pull-up resistor can be used where the hardware requires it.

### 14.4 Flow Sensor Wiring

The YFS401 (YF-S401) flow sensor uses power, ground, and a pulse output to GPIO 26. The arrow on the sensor body should match the direction of water flow.

### 14.5 Button Wiring

The manual button uses GPIO 33 with INPUT_PULLUP. Pressing the button pulls the pin LOW and toggles pump state in firmware.

### 14.6 ESP32-CAM Notes

The camera module (OV3660 variant) is reserved for image capture and AI workflows. It should not be used as the sensor controller board because the sensor controller needs the dedicated analog inputs and timing behavior of the ESP32-WROOM-32 DevKit.

### 14.7 Power Rules

The report should clearly state the power rules because they are important for both safety and reliability:

- do not power the pump from the ESP32 3.3V pin
- use an external supply for the pump and relay path
- keep all grounds common
- power sensors according to their logic requirements

## 15. Backend Configuration and Setup

### 15.1 Local Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB Atlas or local MongoDB
- PowerShell on Windows
- optional Arduino tooling for firmware work

### 15.2 Backend Environment Variables

The backend documents the following minimum configuration values:

- MONGODB_URI
- PORT
- NODE_ENV
- CORS_ORIGIN

Optional keys can be added if AI or weather services are enabled.

### 15.3 Backend Startup Behavior

At startup the backend:

- loads environment variables
- validates production requirements
- connects to MongoDB
- seeds RBAC data
- starts the HTTP server
- starts the WebSocket server
- schedules snapshot tasks

### 15.4 Important Runtime Checks

The deployment and setup guides recommend verifying:

- API health endpoint availability
- database connection success
- CORS origin configuration
- sensor post acceptance
- WebSocket connection behavior

### 15.5 Production Considerations

Production startup checks that the required environment variables are present. The service also trusts proxy headers in production and applies CORS rules based on configured origins.

## 16. Frontend Configuration and Setup

### 16.1 Frontend Environment Variables

The frontend expects:

- VITE_API_BASE_URL
- VITE_WS_URL

### 16.2 Frontend Startup Behavior

The web app uses React routing and lazy loaded pages. It also warns if the API base URL is missing so that development misconfiguration is visible early.

### 16.3 Theme Behavior

The interface persists the selected theme and toggles between dark and light modes. The document should mention that the design system is not an afterthought; it is part of the product identity.

### 16.4 Public and Protected UX

The frontend distinguishes between:

- public marketing pages
- authentication flows
- protected dashboard pages
- viewer pages
- admin pages

This should be explained as a role-aware user experience rather than just a route list.

## 17. Public Website Narrative

### 17.1 Purpose of Public Pages

The public website introduces the project to users before login. It explains the value of the platform, highlights capabilities, and provides a transition path to authentication or demo views.

### 17.2 Public Pages in the Current App

- Home
- About
- Features
- Plant Library
- Demo
- Contact

### 17.3 Content Strategy

The public website should:

- explain the problem quickly
- show the solution clearly
- present features visually
- avoid exposing sensitive controls
- provide a readable path into the dashboard

### 17.4 Design Goals

- strong visual identity
- simple navigation
- clear section hierarchy
- responsive layout
- polished imagery and motion

## 18. Dashboard Narrative

### 18.1 Overview Page

The overview page summarizes the current system state. It is the first place users should look after login because it acts as the operational command center.

### 18.2 Sensors Page

The sensors page presents live and historical environmental readings. It is useful for understanding how the plant is responding over time and whether watering thresholds are being reached.

### 18.3 Analytics Page

Analytics converts raw telemetry into readable trends. It should be used to explain moisture patterns, temperature cycles, humidity changes, and watering trends.

### 18.4 Alerts Page

Alerts highlight conditions that need attention, such as low moisture, abnormal readings, or disease-related warnings.

### 18.5 Controls Page

Controls expose watering actions, making it possible to start or stop irrigation when allowed by the user’s permissions.

### 18.6 AI Page

The AI area supports recommendations and disease-oriented workflows. The presentation of this page should explain that AI is advisory and supportive, not a replacement for user judgment.

### 18.7 Insights Page

The insights page is the place for higher-level interpretation of plant health trends, rule-based guidance, and summarized recommendations.

### 18.8 ESP32 Status Page

The ESP32 status page helps verify device connectivity, operational state, and system health.

### 18.9 Settings Page

The settings page is where operational preferences, thresholds, and configuration options are reviewed or adjusted depending on role and permissions.

## 19. Admin Panel Narrative

### 19.1 Admin Scope

The admin panel is the control room for the application. It supports user management, device governance, operational logs, and system configuration.

### 19.2 Known Admin Sections

The current admin console is split into dedicated sections for:

- overview
- connections
- device keys
- users
- UI
- plant sensors
- limits
- config
- raw data
- logs
- mock data

### 19.3 Governance Functions

Admins can:

- create or disable users
- assign roles and permissions
- review permission outcomes
- manage device keys
- inspect logs
- enable or disable mock data for demos

### 19.4 Why the Admin Panel Matters

An IoT dashboard without governance quickly becomes hard to maintain. The admin panel gives the project operational discipline and shows that the platform is more than a visual demo.

## 20. AI and Analytics

### 20.1 AI in the Project

The AI layer supports disease detection and advice-style recommendations. It can be used to surface actions such as checking soil moisture, reviewing recent conditions, or investigating leaf images.

### 20.2 Analytics in the Project

Analytics turns stored telemetry into charts and patterns. It is what allows the system to move from raw data to decision support.

### 20.3 Inputs to Analytics

- current sensor values
- historical trend windows
- watering logs
- disease detection events
- confidence or metadata where available

### 20.4 Reporting Value

The combination of AI and analytics provides a richer story than simple sensor display. It lets the report explain not only what the plant is doing now, but also what changed over time.

## 21. Styling, Colors, and Branding

### 21.1 Visual Direction

The project uses a plant-inspired visual identity. It is intentionally not a generic dashboard palette. The color system leans on green, teal, and soft status colors to match the domain and the product name.

### 21.2 Primary Palette

From the current styling audit, the main colors are:

- primary green: #3A8F3E
- accent teal: #0A9E94
- plant green: #4EA852
- warning: #E6AC00
- danger: #CC3333
- orchid accent: #C86EC4

### 21.3 Dark Theme

The dark theme uses deep green-black gradients with light text and translucent glass surfaces. This supports a modern technical look and improves contrast for dashboard visuals.

### 21.4 Light Theme

The light theme uses pale green gradients and softened surfaces. It keeps the same branding while improving readability for users who prefer brighter interfaces.

### 21.5 UI Design Principles

- use green and teal as the base identity colors
- reserve amber and red for status meaning
- keep typography simple and readable
- avoid clutter in charts and panels
- keep spacing consistent across card groups

### 21.6 Why This Matters in the Report

The design system should be treated as part of the engineering work, not just decoration. It affects readability, usability, and the professional quality of the final project presentation.

## 22. Configuration and User Guide

This section can be used directly in the report appendix or turned into a short user manual.

### 22.1 Required Software

- Node.js
- npm
- MongoDB connection
- Arduino IDE or compatible firmware environment

### 22.2 Backend Setup

1. install dependencies in apps/api
2. create the backend environment file
3. configure MongoDB connection details
4. set the frontend origin
5. start the backend service

### 22.3 Frontend Setup

1. install dependencies in apps/web
2. create the frontend environment file
3. configure API and WebSocket URLs
4. start the development server
5. open the browser dashboard

### 22.4 Firmware Setup

1. open the ESP32-SENSOR firmware
2. enter Wi-Fi and backend URL details
3. confirm the pin mapping
4. upload to the board
5. open serial monitoring
6. repeat for the ESP32-CAM module

### 22.5 First-Run Validation

After setup, verify that:

- the API responds to health checks
- the frontend opens correctly
- sensor values appear in the dashboard
- watering controls work when permitted
- the camera module can submit disease events where enabled

### 22.6 Troubleshooting Notes

- if the API cannot connect to MongoDB, check the URI and database name
- if the frontend cannot reach the API, check the base URL and CORS origin
- if WebSocket updates fail, verify the socket URL and backend state
- if firmware behaves incorrectly, confirm the pin wiring and sensor power

## 23. Deployment

### 23.1 Backend Deployment on Render

The documented Render configuration uses apps/api as the root directory, npm install as the build step, and npm start as the launch command. Environment variables must be configured in the Render dashboard.

### 23.2 Frontend Deployment on Netlify

The frontend is deployed as a Vite build. The publish directory is the built dist folder under apps/web.

### 23.3 Database Deployment

MongoDB Atlas is the documented cloud database target. This makes the storage layer independent from the API host and the browser host.

### 23.4 Deployment Verification

The project should be verified after deployment by checking:

- server boot logs
- API health endpoint
- sensor ingestion endpoint
- dashboard connectivity
- watering behavior
- admin access behavior

## 24. Testing and Validation

### 24.1 Functional Checks

- login and role access
- public route access
- sensor data display
- chart rendering
- watering control execution
- AI interaction
- admin operation flows

### 24.2 Integration Checks

- firmware to API communication
- API to database storage
- backend to WebSocket broadcast
- frontend to live state sync
- dashboard to analytics rendering

### 24.3 Demo Checks

Before a presentation, verify:

- the Wi-Fi connection is stable
- the database is reachable
- the frontend has correct environment values
- the hardware has safe power wiring
- the pump relay and optional buzzer behave as expected

## 25. Limitations

The report should be honest about the current limits of the implementation.

### 25.1 Technical Limits

- this is an academic or prototype system, not a certified agricultural controller
- precision depends on sensor calibration and environment
- some AI and weather features are optional or integration-dependent
- documentation does not yet describe a formal API contract or OpenAPI schema
- test coverage is not presented as a full enterprise QA suite

### 25.2 Practical Limits

- wiring must be correct for stable operation
- the ESP32-CAM and sensor board should be flashed and tested independently
- deployment values differ between development and production

## 26. Future Work

### 26.1 Technical Improvements

- expand sensor calibration support
- add stronger testing and simulation coverage
- publish a formal API contract
- improve offline behavior and recovery logic
- add richer analytics filtering and export options

### 26.2 Product Improvements

- add more plant profiles
- expand disease detection explanation
- improve mobile responsiveness further
- add richer notification options
- refine admin governance and audit views

## 27. Conclusion

SproutSense shows how a plant-care system can be built as a complete stack rather than a single hardware board or a simple dashboard. The project combines edge sensing, automated watering, AI-assisted analysis, authentication, backend services, persistent storage, and an attractive browser interface. Its value comes from integration: each layer supports the others, and together they create a system that is easier to observe, easier to control, and easier to explain in a report or viva.

## 28. Synopsis for Final Submission

SproutSense is an IoT-based smart plant monitoring and automated irrigation platform that uses dual ESP32 hardware, a Node.js and Express backend, MongoDB storage, and a React dashboard. The sensor module measures soil moisture, temperature, humidity, light, and flow values, while the camera module supports disease-related image workflows. The backend validates and stores readings, manages authentication and permissions, and broadcasts live updates to the frontend. The dashboard provides public pages, user authentication, analytics, controls, AI recommendations, and admin governance. The system is designed with a plant-inspired color palette, dark and light themes, and a modular codebase that supports deployment on modern cloud platforms.

## 29. Presentation Deck Outline

Use this for a 10 to 15 slide presentation.

### Slide 1: Title

- SproutSense project title
- author or team details
- institution

### Slide 2: Problem

- manual plant care issues
- delayed watering and disease detection

### Slide 3: Objective

- automate monitoring and irrigation
- provide analytics and remote access

### Slide 4: Architecture

- dual ESP32 model
- backend, database, frontend

### Slide 5: Website

- public pages
- login and dashboard overview

### Slide 6: Dashboard Features

- sensor cards
- charts
- alerts
- controls

### Slide 7: Backend

- routes
- middleware
- RBAC

### Slide 8: Database

- readings
- logs
- users and roles

### Slide 9: Firmware

- ESP32-SENSOR
- ESP32-CAM

### Slide 10: Wiring

- pins and safety rules

### Slide 11: Configuration

- environment variables
- setup steps

### Slide 12: Styling

- colors and theme
- UI identity

### Slide 13: Deployment

- Render
- Netlify
- Atlas

### Slide 14: Results

- live data flow
- demo examples

### Slide 15: Conclusion

- summary and future scope

## 30. Speaker Notes Guidance

For each slide, the speaker notes should include three things:

1. what the slide shows
2. what to emphasize verbally
3. what to demonstrate or transition to next

Keep speaker notes short. They are there to prevent hesitation during the presentation, not to become a second report.

## 31. Suggested Tables for the Report

Include these tables in the final report to make the documentation richer and easier to read:

- component list
- pin mapping table
- sensor threshold table
- environment variable table
- route summary table
- role and permission matrix
- deployment checklist
- troubleshooting checklist

## 32. Suggested Figures for the Report

Recommended figures include:

- overall architecture diagram
- dual ESP32 block diagram
- sensor controller wiring diagram
- ESP32-CAM workflow diagram
- backend service flow diagram
- frontend route map
- dashboard screenshots
- admin panel screenshots
- deployment topology diagram

## 33. Writing Advice for the Final Report

To turn this document into a polished 60+ page report, the writer should:

1. keep the architecture consistent across all sections
2. reuse the same terminology for sensors, roles, and routes
3. avoid inventing unsupported hardware or software features
4. explain each major subsystem before showing the implementation details
5. include screenshots, diagrams, and tables where possible
6. expand the appendix with setup, wiring, and troubleshooting material

## 34. Reference Map

Use the following documents as the authoritative source when expanding the report:

- [README.md](../README.md)
- [docs/architecture/overview.md](architecture/overview.md)
- [docs/architecture/dual-esp32-architecture.md](architecture/dual-esp32-architecture.md)
- [docs/backend/backend-guide.md](backend/backend-guide.md)
- [docs/backend/authentication-rbac.md](backend/authentication-rbac.md)
- [docs/frontend/frontend-guide.md](frontend/frontend-guide.md)
- [docs/frontend/public-pages.md](frontend/public-pages.md)
- [docs/frontend/admin-panel.md](frontend/admin-panel.md)
- [docs/frontend/analytics-system.md](frontend/analytics-system.md)
- [docs/firmware/firmware-guide.md](firmware/firmware-guide.md)
- [docs/firmware/wiring-guide.md](firmware/wiring-guide.md)
- [docs/firmware/sensor-management.md](firmware/sensor-management.md)
- [docs/onboarding/setup.md](onboarding/setup.md)
- [docs/operations/configuration-guide.md](operations/configuration-guide.md)
- [docs/operations/render-deployment.md](operations/render-deployment.md)
- [docs/operations/deployment-checklist.md](operations/deployment-checklist.md)
- [STYLING_AUDIT.md](../STYLING_AUDIT.md)

## 35. Final Note

This document is the expanded base for the full project package. It can be copied into a report template, converted into chapter form, or used as the source for a more polished final manuscript.

## 36. College Submission Format Kit (Ready to Use)

This section maps your required college report format directly to SproutSense and includes ready-to-fill text blocks.

### 36.1 Front Matter (The Preliminaries)

#### A. Title Page Template

Use this exact structure on the first page:

- Project Title: SproutSense: An IoT-Based Smart Plant Monitoring and Automated Irrigation System
- Submitted by:
	- Team Member 1 - Roll No.
	- Team Member 2 - Roll No.
	- Team Member 3 - Roll No.
	- Team Member 4 - Roll No. (if applicable)
- Under the guidance of: [Guide Name, Designation]
- Department: [Department Name]
- College: [College Name]
- Academic Year: [Year]
- College Logo: centered at top or middle as per your college format

#### B. Certificate Page Template

Certificate

This is to certify that the project titled "SproutSense: An IoT-Based Smart Plant Monitoring and Automated Irrigation System" has been carried out by [Team Names with Roll Numbers] in partial fulfillment of the requirements for the award of [Degree Name] in [Branch/Department] during the academic year [Year].

The work has been completed under my supervision and guidance.

- Project Guide Signature:
- HOD Signature:
- Principal Signature:
- Date:
- Place:

#### C. Declaration Page Template

Declaration

We hereby declare that the project work titled "SproutSense: An IoT-Based Smart Plant Monitoring and Automated Irrigation System" submitted to [College Name] is a record of original work carried out by us under the supervision of [Guide Name].

We further declare that this work has not been submitted elsewhere for the award of any degree, diploma, or certificate.

- Team Member 1 Signature / Name / Roll No.
- Team Member 2 Signature / Name / Roll No.
- Team Member 3 Signature / Name / Roll No.
- Date:

#### D. Acknowledgement Template

Acknowledgement

We express our sincere gratitude to our project guide, [Guide Name], for continuous support, technical feedback, and encouragement throughout the development of SproutSense.

We also thank the Head of Department, faculty members, lab assistants, and our institution for providing the facilities, resources, and academic environment necessary for successful completion of this project.

Finally, we thank our teammates and family members for their cooperation and motivation during all project phases.

#### E. Abstract Page (One Page)

Use the abstract already provided in Section 3 and format it into one page with:

- problem statement (manual plant monitoring limitations)
- IoT solution architecture (dual ESP32 + web + backend + database)
- implementation highlights (sensors, API, dashboard, control)
- final result summary (real-time monitoring + irrigation + analytics)

#### F. Table of Contents Guidance

Create a detailed TOC using word-processor auto-generation after final pagination.

Required top-level entries:

1. Front Matter
2. Chapter 1: Introduction
3. Chapter 2: Literature Survey
4. Chapter 3: System Design and Architecture
5. Chapter 4: Implementation
6. Chapter 5: Results and Discussion
7. Weekly Logbook
8. Conclusion and Future Scope
9. References
10. Appendices

#### G. List of Figures and List of Tables

Mandatory for this project. Include separate pages:

- List of Figures
- List of Tables

Figure examples:

- overall architecture
- block diagram
- circuit diagram
- data flow diagram
- UI screenshots
- hardware prototype photos

Table examples:

- component specification table
- pin mapping table
- API endpoint table
- threshold table
- test result table

## 37. Chapter-Wise Expansion Aligned to College Format

### 37.1 Chapter 1: Introduction

#### 1. Project Overview

SproutSense belongs to the domain of IoT-enabled smart agriculture and plant-care automation. The system combines embedded hardware and web software to collect plant-health data and support decision-making.

#### 2. Motivation

The project is relevant because manual irrigation and manual observation often lead to inconsistent outcomes. With increasing affordability of sensors and microcontrollers, real-time plant monitoring has become practical for student, home, and lab settings.

#### 3. Problem Statement

The targeted issue is the lack of continuous, reliable, and role-managed plant-care monitoring. Manual methods make it difficult to track trends and trigger timely interventions.

#### 4. Objectives

- monitor core environmental and soil parameters continuously
- present readings on a real-time dashboard
- support controlled watering actions
- integrate disease-oriented camera workflows
- enforce role-based access and administrative governance

### 37.2 Chapter 2: Literature Survey

Use this chapter to compare SproutSense with existing approaches.

#### 1. Analysis of Existing IoT Systems

Cover common patterns seen in published systems:

- single-node monitoring systems with basic alerting
- cloud-only dashboards with limited hardware integration
- irrigation systems without role-based control
- camera-based systems without sensor fusion

#### 2. Comparison of Communication Protocols

Add a comparison table discussing protocol choices for IoT:

- HTTP/REST
- WebSocket
- MQTT
- LoRaWAN (for long-range low-bandwidth environments)

For SproutSense, explain that HTTP plus WebSocket is the current design choice in the repository, while MQTT/LoRa can be discussed as future variants depending on deployment constraints.

#### 3. Review of Hardware Components

Review each component family and why it was selected:

- ESP32-WROOM-32 DevKit (sensor controller)
- ESP32-CAM (image workflow)
- DHT22 (temperature/humidity)
- soil moisture sensor
- LDR module
- YFS401 (YF-S401) flow sensor
- push button (manual pump control)
- relay and pump assembly
- optional buzzer output

Include brief specifications and trade-offs, then position SproutSense as a modular, cost-conscious implementation.

### 37.3 Chapter 3: System Design and Architecture

#### 1. Block Diagram

Create a block diagram with this flow:

Sensors -> ESP32-SENSOR -> Backend API -> MongoDB + WebSocket -> React Web Dashboard -> User

Parallel path:

ESP32-CAM -> AI/Disease Endpoint -> Backend Storage -> Dashboard Alerts/Insights

#### 2. Circuit Diagram

Include a clear circuit diagram using the documented wiring map in this dossier and in the firmware wiring guide.

#### 3. Data Flow Diagram (DFD)

Build a DFD with at least:

- external entities: user, admin, devices
- processes: ingestion, validation, persistence, analytics, control
- data stores: sensor readings, logs, user-role records, config

#### 4. Component Description

Include technical specs and operating notes for each sensor, actuator, and microcontroller used.

### 37.4 Chapter 4: Implementation

#### 1. Firmware Logic / Algorithm / Flowchart

Add firmware flowchart steps:

1. boot and initialize sensors
2. connect to Wi-Fi
3. read sensor values
4. normalize data payload
5. send to backend endpoint
6. check moisture threshold
7. trigger/stop relay based on control logic
8. log telemetry and repeat loop

#### 2. Software Stack

Document implementation tools:

- firmware: Arduino IDE + ESP32 libraries
- backend: Node.js, Express, Mongoose
- frontend: React, Vite, charting and UI libraries
- deployment: Render, Netlify, MongoDB Atlas

If your college expects Firebase/AWS mention, write that SproutSense currently uses Render and Atlas, and compare Firebase/AWS as alternatives in discussion.

#### 3. Connectivity and API Endpoints

Explain connectivity details:

- Wi-Fi-based device connectivity
- REST endpoints for sensor posts and control actions
- WebSocket for real-time UI updates
- environment-driven backend/frontend endpoint configuration

### 37.5 Chapter 5: Results and Discussion

#### 1. Prototype Snapshots

Add:

- photos of assembled hardware
- photos of sensor setup
- screenshots of public pages
- screenshots of dashboard and admin pages

Note: This project is web-dashboard centric. If your college template says Blynk/App dashboard, you can write "Web dashboard" as the current implemented equivalent.

#### 2. Data Analysis

Discuss:

- moisture trend behavior over time
- temperature and humidity variation
- watering event outcomes and logs
- system response under normal and stress conditions

#### 3. Testing Table

Use a formal test log table. Suggested format:

| Test Case ID | Test Name | Input/Condition | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-01 | Sensor Accuracy Test | Compare readings with reference instrument | Readings within acceptable tolerance | [fill] | Pass/Fail |
| TC-02 | API Ingestion Test | Sensor posts payload every cycle | Data stored in DB and visible in UI | [fill] | Pass/Fail |
| TC-03 | Water Control Test | Trigger manual watering | Relay activates and log created | [fill] | Pass/Fail |
| TC-04 | WebSocket Latency Test | New reading generated | UI updates near real-time | [fill] | Pass/Fail |
| TC-05 | Role Access Test | Viewer opens admin route | Access denied | [fill] | Pass/Fail |

## 38. Weekly Logbook Section (Required)

Add this as a separate chapter or appendix.

### 38.1 Logbook Template

Project Work Log

| Week No. | Date | Activity Performed | Status | Guide Remarks/Sign |
|---|---|---|---|---|
| Week 1 | 02/02 | Literature survey and component finalization | Completed | |
| Week 2 | 09/02 | Circuit simulation and basic design planning | In Progress | |
| Week 3 | 16/02 | Interfacing sensors with ESP32 and endpoint testing | Completed | |
| Week 4 | 23/02 | Developing dashboard pages and data cards | Completed | |
| Week 5 | [fill] | Backend route integration and DB validation | [fill] | |
| Week 6 | [fill] | Admin and role-permission implementation checks | [fill] | |
| Week 7 | [fill] | Deployment validation and bug fixes | [fill] | |
| Week 8 | [fill] | Final report and PPT preparation | [fill] | |

### 38.2 Logbook Writing Rule

Each weekly entry should contain:

- what was planned
- what was completed
- blockers and fixes
- mentor remarks/signature status

## 39. Conclusion and Future Scope (College Format)

### 39.1 Conclusion Draft

SproutSense successfully demonstrates an IoT-enabled plant monitoring and irrigation prototype with integrated firmware, backend services, and web dashboard interfaces. The system provides meaningful real-time visibility, supports controlled watering actions, and maintains historical records for analysis. The dual ESP32 design improves modularity and separates sensing workloads from camera-driven disease workflows.

### 39.2 Future Scope Draft

Potential extension areas include:

- stronger AI disease explainability
- edge-level local inference optimization
- protocol expansion (MQTT/LoRa variants)
- predictive irrigation models
- richer production-grade test automation
- larger deployment with multi-zone sensor nodes

## 40. References and Appendices (Required)

### 40.1 References

Use either IEEE or APA consistently across all citations. Do not mix formats.

Suggested reference categories:

- ESP32 technical documentation
- sensor datasheets
- protocol references (HTTP, WebSocket, MQTT)
- Node.js/Express/MongoDB documentation
- React/Vite documentation
- academic papers on IoT irrigation systems

### 40.2 Appendix A: Key Code Snippets

Do not include full source files. Include only critical snippets:

- firmware main loop and watering logic
- backend sensor-ingestion route/controller snippet
- WebSocket broadcast snippet
- frontend data fetch + live update snippet

### 40.3 Appendix B: Datasheets

Attach or reference datasheets for:

- ESP32-WROOM-32 DevKit
- ESP32-CAM
- DHT22
- soil moisture sensor
- YFS401 (YF-S401) flow sensor
- push button
- relay module
- optional buzzer module

### 40.4 Appendix C: Extra Recommended Appendices

- API endpoint summary sheet
- environment variable checklist
- deployment checklist
- troubleshooting matrix

## 41. Final Packaging Checklist

Before final submission, verify:

1. front matter pages are complete and signed where required
2. chapter numbering and page numbering are final
3. table of contents, list of figures, and list of tables are auto-generated and accurate
4. all diagrams are high resolution and readable in print
5. references are formatted in one consistent citation style
6. appendices contain only selected high-value material

## 42. Current Hardware Truth Sheet (One-Page Appendix)

Use this page as the single source of truth for viva, demo day, and report consistency.

### 42.1 What Is Active in Current Build

- ESP32-SENSOR + ESP32-CAM dual-board architecture
- Active sensors: soil moisture, DHT22 (temperature and humidity), LDR (light), YFS401 (YF-S401) flow
- Active manual input: push button on GPIO33
- Active control output: relay-driven pump on GPIO14
- Optional output: buzzer on GPIO27
- Data path: device HTTP posts to backend API, then dashboard via REST/WebSocket

### 42.2 What Is Not Active in Current Build

- chemistry analog sensor input is disabled in firmware
- on-device display module is not part of the current operating workflow
- Blynk and Google Assistant are not part of the current workflow

### 42.3 Active Pin Map (ESP32-SENSOR)

| Function | Pin | Status |
|---|---:|---|
| Soil moisture AO | GPIO35 | Active |
| LDR AO | GPIO39 | Active |
| DHT22 DATA | GPIO13 | Active |
| Flow pulse (YFS401/YF-S401) | GPIO26 | Active |
| Manual button | GPIO33 | Active |
| Relay (pump control) | GPIO14 | Active |
| Buzzer | GPIO27 | Optional |

### 42.4 Wiring and Safety Rules

- keep a common ground between ESP32, relay supply, and sensors
- power pump from external 5V source, not ESP32 3.3V
- keep analog sensor lines on ADC1 pins
- validate relay NO wiring so pump is OFF by default when idle

### 42.5 Firmware Truth Markers

- sensor firmware: firmware/ESP32-SENSOR/ESP32-SENSOR.ino
- camera firmware: firmware/ESP32_CAM_AI/ESP32-CAM.ino
- flow pulse pin constant uses GPIO26
- relay output uses GPIO14
- payload includes moisture, temperature, humidity, light, flow rate/volume

### 42.6 Quick Demo Verification

1. confirm ESP32-SENSOR joins Wi-Fi and posts telemetry
2. verify dashboard receives live moisture, temp, humidity, light, and flow values
3. trigger watering and confirm relay behavior + watering logs
4. verify optional buzzer behavior if connected
5. confirm ESP32-CAM disease event path reaches backend and dashboard views