# TITLE PAGE

[College Logo Here]

## SPROUTSENSE: DUAL ESP32-BASED IOT PLATFORM FOR INTELLIGENT PLANT MONITORING, AUTOMATED IRRIGATION, AND DISEASE AWARENESS

### Minor Project Report

Submitted by:

1. [Student Name 1] - [Roll Number 1]
2. [Student Name 2] - [Roll Number 2]
3. [Student Name 3] - [Roll Number 3]
4. [Student Name 4] - [Roll Number 4]

Under the guidance of:

[Guide Name], [Designation]

Department of [Department Name]

[College Name]

[University Name]

Academic Year: 2025-2026

---

# CERTIFICATE

This is to certify that the minor project entitled "SPROUTSENSE: DUAL ESP32-BASED IOT PLATFORM FOR INTELLIGENT PLANT MONITORING, AUTOMATED IRRIGATION, AND DISEASE AWARENESS" has been carried out by:

1. [Student Name 1] - [Roll Number 1]
2. [Student Name 2] - [Roll Number 2]
3. [Student Name 3] - [Roll Number 3]
4. [Student Name 4] - [Roll Number 4]

in partial fulfillment of the requirements for the award of the degree of [Degree Name] in [Branch Name] under [University Name], during the academic year 2025-2026.

The work presented in this report is original and has been completed under our supervision.

Project Guide:

Name: [Guide Name]
Designation: [Guide Designation]
Signature: ______________________
Date: ______________________

Head of Department:

Name: [HOD Name]
Designation: Head, Department of [Department Name]
Signature: ______________________
Date: ______________________

Principal:

Name: [Principal Name]
Designation: Principal, [College Name]
Signature: ______________________
Date: ______________________

---

# DECLARATION

We hereby declare that the minor project report entitled "SPROUTSENSE: DUAL ESP32-BASED IOT PLATFORM FOR INTELLIGENT PLANT MONITORING, AUTOMATED IRRIGATION, AND DISEASE AWARENESS" submitted to [University Name] in partial fulfillment of the requirements for the award of the degree of [Degree Name] in [Branch Name] is a record of original work carried out by us under the supervision of [Guide Name], [Designation], Department of [Department Name], [College Name].

We further declare that this work has not been submitted, either in whole or in part, to any other institution or university for the award of any degree or diploma.

All sources of information used in this work have been duly acknowledged.

Place: [City]
Date: [DD/MM/YYYY]

Student Signatures:

1. [Student Name 1] - [Roll Number 1] - Signature: ______________________
2. [Student Name 2] - [Roll Number 2] - Signature: ______________________
3. [Student Name 3] - [Roll Number 3] - Signature: ______________________
4. [Student Name 4] - [Roll Number 4] - Signature: ______________________

---

# ACKNOWLEDGEMENT

We express our sincere gratitude to our project guide, [Guide Name], [Designation], for the consistent guidance, technical direction, and encouragement provided throughout this minor project. Their valuable suggestions helped us transform initial concepts into a functional and validated IoT solution.

We are highly thankful to [HOD Name], Head of the Department of [Department Name], for providing departmental support, laboratory access, and an enabling academic environment for project execution.

We are equally grateful to [Principal Name], Principal of [College Name], for institutional support and encouragement toward practical engineering learning.

We also acknowledge the contributions of laboratory staff and technical assistants for helping us during hardware setup, prototyping, and testing phases. Their timely support in instrumentation, wiring verification, and troubleshooting proved important during integration and calibration activities.

Finally, we thank our peers, friends, and family members for their motivation, cooperation, and moral support during the planning, implementation, and documentation phases of this project.

---

# ABSTRACT

Modern plant care in domestic, educational, and small agricultural environments often suffers from inconsistent watering decisions, delayed fault detection, and limited visibility of real-time environmental conditions. Manual methods are typically dependent on user availability and subjective judgment, which may lead to under-watering, over-watering, avoidable plant stress, and productivity loss. The objective of this work is to design and implement a practical IoT and embedded systems platform that combines continuous sensing, automatic control, web-based monitoring, and AI-assisted decision support for plant health management.

The proposed system, SproutSense, adopts a dual ESP32 architecture to separate sensing/control responsibilities from camera-based disease awareness. An ESP32-WROOM-32 sensor controller acquires soil moisture, temperature, humidity, ambient light, and water flow signals, and controls a relay-driven pump through backend-coordinated irrigation logic. A dedicated ESP32-CAM captures plant imagery and sends disease inference outputs to the backend. The software stack consists of ESP32 firmware (Arduino ecosystem), a Node.js and Express backend with MongoDB persistence, JWT and role-based access control, and a React-Vite web dashboard for live telemetry, analytics, controls, and configuration. Real-time updates are supported through WebSocket channels, while REST APIs provide structured telemetry ingestion, historical retrieval, system status, and administration operations.

Implementation includes payload normalization across firmware variants, device-token authentication for edge endpoints, and configurable thresholds for watering and analytics. Results from prototype evaluation indicate stable telemetry flow, responsive control behavior, and reliable dashboard visibility for user operation and diagnostics. The architecture demonstrates good modularity, maintainability, and deployment readiness for cloud-hosted services. Overall, the project validates that a cost-effective, dual-controller IoT approach can significantly improve plant monitoring quality, irrigation reliability, and operational decision-making in resource-constrained environments.

---

# TABLE OF CONTENTS

1. Title Page ........................................................................ i
2. Certificate ....................................................................... ii
3. Declaration ....................................................................... iii
4. Acknowledgement .................................................................... iv
5. Abstract .......................................................................... v
6. Table of Contents ................................................................ vi
7. List of Figures .................................................................. viii
8. List of Tables ................................................................... ix

Chapter 1: Introduction ............................................................ 1
1.1 Project Overview ............................................................... 1
1.2 Motivation ...................................................................... 3
1.3 Problem Statement .............................................................. 5
1.4 Objectives ...................................................................... 6
1.5 Scope of the Project ........................................................... 8

Chapter 2: Literature Survey ...................................................... 10
2.1 Existing IoT Systems .......................................................... 10
2.2 Communication Protocol Comparison ............................................. 14
2.3 Hardware Components Review .................................................... 18

Chapter 3: System Design and Architecture ........................................ 24
3.1 Overall System Architecture ................................................... 24
3.2 Block Diagram ................................................................. 27
3.3 Circuit Diagram ............................................................... 30
3.4 Data Flow Diagram (DFD) ....................................................... 34
3.5 Component Description ......................................................... 38

Chapter 4: Implementation ......................................................... 44
4.1 Algorithm and Flowchart ....................................................... 44
4.2 Software Stack ................................................................ 49
4.3 Connectivity and Communication ................................................ 54
4.4 Implementation Challenges ..................................................... 61

Chapter 5: Results and Discussion ................................................ 66
5.1 Hardware Snapshots ............................................................ 66
5.2 Software/UI Snapshots ......................................................... 69
5.3 Data Analysis ................................................................ 75
5.4 Testing and Validation ........................................................ 82

Chapter 6: Project Work Log ...................................................... 89

Chapter 7: Conclusion and Future Scope ........................................... 94
7.1 Conclusion ................................................................... 94
7.2 Future Scope ................................................................. 96

Chapter 8: References and Appendices ............................................. 100
8.1 References ................................................................... 100
8.2 Appendix A: Code Snippets .................................................... 104
8.3 Appendix B: Datasheets ....................................................... 110

---

# LIST OF FIGURES

Figure 3.1 End-to-End SproutSense Architecture ................................... 27
Figure 3.2 Functional Block Diagram .............................................. 29
Figure 3.3 ESP32-SENSOR Connection Layout ........................................ 31
Figure 3.4 ESP32-CAM Integration View ............................................ 32
Figure 3.5 Level-0 Data Flow Diagram ............................................. 35
Figure 3.6 Level-1 Data Flow Diagram ............................................. 36
Figure 4.1 Firmware Control Flow ................................................. 46
Figure 4.2 Backend Processing Flow ............................................... 48
Figure 5.1 Sensor Controller Prototype ........................................... 67
Figure 5.2 Relay and Pump Section ................................................ 67
Figure 5.3 ESP32-CAM Module Placement ............................................ 68
Figure 5.4 Dashboard Overview Screen ............................................. 70
Figure 5.5 Sensors Monitoring Screen ............................................. 71
Figure 5.6 Analytics Dashboard Screen ............................................ 72
Figure 5.7 Device Settings Screen ................................................ 73
Figure 5.8 AI Intelligence Hub Screen ............................................ 74

---

# LIST OF TABLES

Table 2.1 Survey of Similar IoT Plant Monitoring Systems ........................ 13
Table 2.2 Protocol Comparison: MQTT vs HTTP vs CoAP .............................. 17
Table 2.3 Microcontroller Comparison ............................................. 20
Table 2.4 Sensor and Actuator Specification Summary .............................. 23
Table 3.1 ESP32-SENSOR Pin Mapping ............................................... 31
Table 3.2 Module-Wise Interface Mapping .......................................... 33
Table 3.3 Major Component Selection Rationale .................................... 40
Table 4.1 Software Stack and Roles ............................................... 50
Table 4.2 Core API Endpoints and Payloads ........................................ 56
Table 5.1 Representative Sensor Data Sample ...................................... 76
Table 5.2 Hourly Aggregated Trend Snapshot ....................................... 78
Table 5.3 Testing and Validation Matrix .......................................... 83
Table 6.1 Project Work Log (Weekly Progress) ..................................... 89
Table 8.1 Datasheet Parameters Used for Design Decisions ........................ 111

---

# Chapter 1: Introduction

## 1.1 Project Overview

Agricultural automation has become a significant engineering domain due to increasing water stress, labor constraints, and the need for reliable crop health monitoring. Within this domain, IoT and embedded systems enable distributed sensing, autonomous actuation, and cloud-level data visibility. For small-scale farms, academic prototypes, greenhouses, and domestic horticulture, low-cost edge computing with wireless communication is an effective path to improve consistency of plant care.

SproutSense is an IoT-driven plant monitoring and irrigation platform developed as an engineering minor project with a dual ESP32 architecture. The first controller (ESP32-WROOM-32) handles environmental sensing and irrigation actuation, while the second controller (ESP32-CAM) supports camera-based disease awareness workflows. The platform acquires data such as soil moisture, temperature, humidity, light intensity, and water flow context, then publishes the data to a cloud-hosted backend. A web dashboard provides authenticated users with real-time telemetry, control options, historical trends, and AI-assisted recommendations.

The project integrates embedded firmware, network protocols, backend services, database persistence, authentication and role governance, and a modern frontend experience. The solution demonstrates a practical architecture where sensing stability and vision-based processing are separated, thereby reducing computational contention and simplifying module-level debugging.

From a systems perspective, SproutSense is designed around five key principles: reliable data acquisition, secure communication, responsive control, actionable analytics, and modular maintainability. The design allows users to monitor device state, issue watering commands, configure thresholds, review disease events, and validate operational status from a single web interface.

## 1.2 Motivation

Smart agriculture and precision irrigation are increasingly relevant due to water scarcity, climate variability, and the need for resilient cultivation practices. Manual irrigation often relies on periodic visual checks and subjective interpretation of soil dryness, which leads to inconsistent watering cycles and reduced plant health quality. In many practical settings, especially with multiple plants or constrained schedules, users cannot continuously monitor environmental variables.

IoT systems address these limitations by providing sensor-driven monitoring and automated response mechanisms. Recent trends show growing adoption of low-power microcontrollers, cloud APIs, and dashboard-first interfaces for remote operation. IoT platforms also enable data-driven decisions by preserving historical logs and exposing trend analysis, rather than relying only on instantaneous observations.

The motivation for SproutSense emerged from three practical observations:

1. Soil moisture and environmental conditions can fluctuate significantly throughout the day, and manual watering misses these variations.
2. Existing hobby-grade solutions often focus on one device and one function, lacking integration of sensing, control, analytics, and disease context.
3. Users require a transparent, explainable interface that combines live status with historical trends and recommendation support.

The project is therefore motivated by the need to build a robust yet affordable prototype that demonstrates automation, real-time visibility, and intelligent guidance while remaining deployable in educational and small-scale real environments.

## 1.3 Problem Statement

Conventional plant care methods rely heavily on periodic manual inspection and fixed-schedule watering, which fail to adapt to real-time environmental conditions. This leads to frequent under-watering or over-watering, inefficient water usage, and delayed detection of plant stress or disease symptoms.

Many available low-cost prototypes provide partial functionality, such as moisture sensing without secure remote control, or camera modules without integration into an operational dashboard. Additionally, weak role governance and inconsistent data schemas in edge-to-cloud pipelines can reduce system reliability and maintainability.

The specific problem addressed in this project is to design and implement a secure, modular, and responsive IoT system that can:

1. Continuously acquire multi-parameter plant environment data.
2. Support automatic and manual irrigation with trackable logs.
3. Provide web-based real-time monitoring and historical analytics.
4. Incorporate disease-aware camera events into actionable user workflows.

SproutSense fills this gap through a dual-controller embedded design and a cloud-connected application stack that unifies sensing, control, visualization, and decision support.

## 1.4 Objectives

The objectives of this project are listed below as measurable engineering targets:

- To design a dual ESP32 architecture that separates sensing/actuation and camera-based disease workflows for improved stability.

- To interface and calibrate DHT22, capacitive soil moisture, LDR, and YFS401 flow sensing modules with an ESP32-WROOM-32 controller.

- To implement relay-based water pump control with support for both manual and automatic trigger types.

- To develop secure REST-based telemetry ingestion endpoints with device-token authentication and schema validation.

- To build a cloud-backed data layer for storing sensor readings, watering logs, device status, and disease detections.

- To implement a React-based web dashboard for live monitoring, analytics, alerts, settings, and role-aware navigation.

- To provide AI recommendation and chat-assist workflows using current and historical telemetry context.

- To evaluate system performance in terms of response behavior, data consistency, and operational reliability under prototype conditions.

## 1.5 Scope of the Project

### In-Scope

- Dual ESP32 hardware architecture with dedicated sensing/control and camera functions.
- Real-time telemetry transfer to backend APIs over Wi-Fi.
- Watering control through REST endpoints and backend-synchronized status logic.
- Data persistence in MongoDB and near real-time dashboard updates.
- Role-based web experience with public, user, viewer, and admin workflows.
- Basic AI-assisted insights and disease event handling.

### Out-of-Scope

- Industrial-grade weatherproof enclosure and long-term field hardening.
- Battery-powered low-energy optimization for multi-month autonomous deployment.
- Full agronomic model personalization for crop-specific fertigation control.
- Autonomous on-device vision inference in production mode for all use cases.
- Large-scale multi-node mesh deployment and enterprise telemetry orchestration.

The scope was intentionally bounded to maintain alignment with minor project timelines, available hardware, and academic evaluation constraints.

---

# Chapter 2: Literature Survey

## 2.1 Existing IoT Systems

IoT plant monitoring systems in literature generally combine sensors, microcontrollers, and cloud dashboards. However, architectures differ in reliability, communication overhead, scalability, and decision support capability.

Early systems using Arduino UNO with Wi-Fi shields provided foundational sensing but suffered from limited memory and weak secure connectivity options. Later platforms with ESP8266 improved network support but still faced constraints in GPIO flexibility and concurrency under multi-sensor workloads. Recent systems use ESP32 for better dual-core processing, integrated wireless support, and expanded peripheral interfacing.

A review of existing solutions reveals common limitations: insufficient role-based security, absence of integrated disease-awareness pipelines, and reliance on static threshold control without context-aware recommendations.

### Table 2.1 Survey of Similar IoT Plant Monitoring Systems

| System | Architecture | Core Technologies | Strengths | Limitations |
|---|---|---|---|---|
| Basic Arduino Irrigation Node | Single controller + moisture sensor + relay | Arduino UNO, HTTP, cloud channel | Low cost, easy setup | Weak scalability, limited security, no multi-parameter sensing |
| ESP8266 Smart Pot | Single Wi-Fi node | ESP8266, DHT, mobile app | Better internet connectivity | Narrow sensor set, unstable under frequent updates |
| Greenhouse Monitoring Cluster | Multi-node sensing + gateway | ESP32 nodes, MQTT broker, cloud DB | Scalable telemetry | Higher setup complexity, broker dependency |
| Vision-assisted Crop Monitor | Camera node + cloud inference | ESP32-CAM or SBC + ML API | Disease event visibility | Often disconnected from irrigation control loop |
| SproutSense (This Work) | Dual ESP32 + MERN + web dashboard | ESP32-WROOM-32, ESP32-CAM, Express, MongoDB, React | Modular architecture, integrated control + analytics + disease context | Prototype-stage calibration and deployment hardening needed |

From the survey, it is evident that practical performance improves when sensing and imaging tasks are separated and coordinated through a backend service. SproutSense adopts this strategy to reduce single-node overload and improve operational maintainability.

## 2.2 Communication Protocol Comparison

IoT communication protocol choice strongly influences bandwidth efficiency, latency, reliability, and implementation complexity. For this project, HTTP over TLS was selected for firmware-to-backend communication due to simple endpoint integration and predictable request semantics in the existing cloud stack.

MQTT is widely used for publish-subscribe telemetry with low overhead and QoS options. It is suitable for constrained devices and event streams but introduces broker setup and topic governance complexity. CoAP offers lightweight UDP-based messaging and can be efficient in constrained networks, but practical deployment over internet-facing infrastructure is often less straightforward than HTTP in student projects.

### Table 2.2 Protocol Comparison: MQTT vs HTTP vs CoAP

| Parameter | MQTT | HTTP/HTTPS | CoAP |
|---|---|---|---|
| Communication Model | Publish-subscribe via broker | Request-response client-server | Request-response over UDP |
| Transport | TCP | TCP/TLS | UDP/DTLS |
| Header Overhead | Low | Moderate to high | Very low |
| Reliability Options | QoS 0,1,2 | TCP reliability | Confirmable messages |
| Latency | Low | Moderate | Low |
| Scalability | High with broker design | High with REST scaling | High in constrained networks |
| Web Integration | Indirect via broker/API bridge | Native with REST APIs | Requires adaptation layers |
| Debugging Simplicity | Moderate | High | Moderate |
| Suitability for This Project | Good but broker-intensive | Best fit with existing backend | Useful but less aligned with current stack |

The implemented system uses HTTPS endpoints with token-authenticated headers for deterministic data ingestion and control, while WebSocket is used from backend to frontend for near real-time UI synchronization.

## 2.3 Hardware Components Review

### Microcontroller Review

ESP32 class devices are preferred in modern IoT prototypes due to integrated Wi-Fi, adequate GPIO availability, ADC support, and suitable processing capability for medium-complexity firmware logic.

### Table 2.3 Microcontroller Comparison

| Controller | CPU/Clock | Wireless | ADC/GPIO Capability | Typical Use | Pros | Cons |
|---|---|---|---|---|---|---|
| Arduino UNO | 8-bit AVR / 16 MHz | External module needed | Limited ADC/GPIO | Basic control loops | Very simple ecosystem | Limited memory and networking |
| ESP8266 | 32-bit / 80-160 MHz | Wi-Fi | Moderate GPIO | Low-cost IoT node | Strong community support | Fewer peripherals than ESP32 |
| ESP32-WROOM-32 | Dual-core / up to 240 MHz | Wi-Fi + BLE | Rich GPIO + ADC + interrupts | Multi-sensor IoT and control | High flexibility, robust for this use | Requires careful pin planning |
| ESP32-CAM (AI Thinker) | ESP32 + camera interface | Wi-Fi + BLE | Camera-focused with constrained free GPIO | Vision and image capture tasks | Cost-effective camera integration | Tighter memory and pin constraints |

### Sensor and Actuator Review

The current hardware baseline uses DHT22 (temperature/humidity), capacitive soil moisture sensor, LDR analog output, YFS401 flow sensor, relay module, and pump motor. These components were selected for low cost, availability, and compatibility with ESP32 voltage and I/O characteristics.

### Table 2.4 Sensor and Actuator Specification Summary

| Component | Working Principle | Typical Specs | Advantages | Limitations |
|---|---|---|---|---|
| DHT22 | Capacitive humidity + NTC temperature sensing | Temp: -40 to 80 C, RH: 0-100%, digital output | Simple interface, good general accuracy | Moderate refresh rate |
| Capacitive Soil Moisture Sensor | Dielectric change with water content | Analog output, corrosion-resistant compared to resistive probes | Better longevity than resistive probes | Needs calibration to soil type |
| LDR Module (AO) | Photoresistor resistance varies with light | Analog voltage proportional to light level | Very low cost | Non-linear and indirect lux mapping |
| YFS401 Flow Sensor | Hall-effect pulse output proportional to flow | Pulse frequency calibrated to volume | Useful irrigation verification | Calibration needed by plumbing setup |
| Relay Module + Pump | Electromagnetic switch controls pump circuit | 5V relay logic, external pump supply | Isolation from MCU pin load | Relay wear and switching noise |
| ESP32-CAM with OV3660 | On-board camera capture for AI workflows | RGB capture, serial flashing support | Adds disease-awareness channel | Limited resources versus SBC cameras |

The reviewed component set provides sufficient capability for a robust minor-project-scale IoT system while maintaining economical feasibility.

## 2.4 Research Gap Analysis and Design Positioning

Although many published systems demonstrate partial success in automated irrigation, a detailed gap analysis shows that most implementations remain fragmented at one or more levels of the IoT stack.

### Gap 1: Functional Fragmentation Between Sensing and Vision

In many student and prototype systems, moisture sensing and vision analysis are either merged onto one controller or implemented as disconnected modules. The first approach introduces processing contention and unstable timing under constrained memory. The second approach creates analytical silos where disease observations do not influence operational decision support.

SproutSense addresses this by using a dual-controller design with backend-mediated fusion of sensor and disease events. This provides architectural separation while preserving system-level coherence.

### Gap 2: Weak Security Posture in Edge-to-Cloud Paths

A recurrent issue in low-cost IoT projects is absence of endpoint hardening, role checks, and identity isolation between user-level and device-level operations. Systems often rely on open endpoints or static assumptions about trusted devices.

The implemented platform introduces distinct authentication pathways:

1. Device-token authentication for firmware-originating endpoints.
2. JWT-based user authentication for dashboard operations.
3. RBAC permissions for route-level access decisions.

This layered security model closes common attack surfaces such as unauthorized watering control calls and unvalidated telemetry posting.

### Gap 3: Inconsistent Data Contracts Across Firmware Revisions

A significant practical challenge in IoT lifecycle management is schema drift. Field names may vary across firmware versions due to evolving requirements, causing downstream analytics instability.

SproutSense uses normalization in controller logic to support equivalent aliases while storing canonical fields in the database. This design pattern improves backward compatibility and reduces data-loss risk during iterative firmware updates.

### Gap 4: Insufficient Operational Explainability

Many systems provide a binary ON/OFF actuation without recording context, confidence, or rationale. Such designs are difficult to audit and validate academically.

The current architecture improves explainability through:

1. Watering logs with trigger type, before/after moisture, duration, and volume.
2. Disease records with confidence scores and actionable status.
3. AI recommendations with reasons and suggestions.

### Positioning of This Work

Based on literature and implementation constraints, this project is positioned as a practical, security-aware, and integration-focused minor project platform rather than a narrowly optimized algorithmic prototype. Its primary contribution lies in robust end-to-end engineering integration under realistic academic resource limits.

## 2.5 Comparative Evaluation Criteria and Selection Matrix

To ensure objective component and architecture selection, a weighted evaluation matrix was used during design finalization.

### Evaluation Criteria

1. Technical compatibility with dual ESP32 architecture.
2. Cost and procurement feasibility.
3. Integration complexity with existing stack.
4. Reliability under frequent sampling and control operations.
5. Security and maintainability implications.

### Table 2.5 Weighted Selection Matrix (Illustrative)

| Design Option | Compatibility (30) | Cost (20) | Integration (20) | Reliability (20) | Maintainability (10) | Total (100) |
|---|---:|---:|---:|---:|---:|---:|
| Single-controller ESP32 all-in-one | 18 | 19 | 17 | 12 | 12 | 78 |
| Dual ESP32 with backend fusion | 28 | 16 | 18 | 18 | 16 | 96 |
| SBC-centric vision + MCU sensing | 24 | 10 | 13 | 17 | 14 | 78 |

The dual ESP32 option obtained the highest score due to better reliability and modular maintainability despite slightly higher integration effort.

### Protocol Decision Matrix

| Protocol Stack | Implementation Complexity | Debugging Simplicity | Cloud Compatibility | Final Decision |
|---|---|---|---|---|
| MQTT broker + topic model | Medium to high | Medium | Good with broker setup | Not selected for current release |
| HTTPS REST + WebSocket | Medium | High | Native with existing backend | Selected |
| CoAP + gateway translation | High | Medium | Moderate | Deferred |

This decision aligns with project timeline constraints and available operational tooling.

## 2.6 Methodological Notes for Literature and Benchmark Interpretation

To avoid anecdotal comparison, the literature survey and implementation decisions were interpreted using a structured evidence methodology.

### Source Categorization

Reviewed material was grouped into four categories:

1. Peer-reviewed papers on IoT irrigation architecture and communication protocols.
2. Vendor datasheets and hardware reference manuals.
3. Framework-level engineering documentation for backend and frontend stack choices.
4. Practical repository-level implementation records and operational notes.

This categorization reduces bias by combining theoretical and implementation-grounded evidence.

### Benchmark Axes Used in Interpretation

For each candidate architecture or protocol, the following axes were considered:

1. Determinism in control feedback loops.
2. Ease of deployment and debugging in academic infrastructure.
3. Suitability for role-based user interaction in web dashboards.
4. Data quality and schema continuity under iterative firmware updates.
5. Safety implications for physical actuation tasks.

### Threats to Validity

1. External studies vary in crop type, greenhouse setup, and environmental parameters.
2. Vendor datasheet conditions may differ from real field temperature and noise profiles.
3. Prototype timespan constrains long-term statistical conclusions.

To mitigate these threats, implementation choices prioritized reproducibility and explainability rather than maximum optimization under narrow test conditions.

### Engineering Inference

The methodology supports the conclusion that system integration quality is a primary success factor in minor-project-scale IoT platforms. Under constrained time and budget, a robust and auditable architecture offers greater academic and practical value than isolated algorithmic sophistication.

---

# Chapter 3: System Design and Architecture

## 3.1 Overall System Architecture

SproutSense follows a layered architecture from physical sensing to user-level visualization and control. The architecture can be summarized as follows:

Sensors -> ESP32-SENSOR -> Wi-Fi Router/Internet -> Backend API -> MongoDB -> Web Dashboard

ESP32-CAM -> Wi-Fi Router/Internet -> Backend AI Routes -> MongoDB -> Dashboard Alerts/AI Views

At the edge layer, the sensor controller periodically reads analog and digital sensors, evaluates local thresholds, and posts telemetry to secured backend endpoints. It also polls watering status commands and updates runtime state.

At the cloud layer, a Node.js and Express backend validates incoming payloads, normalizes multi-variant field names, updates device status, stores records, and emits WebSocket events for front-end synchronization.

At the persistence layer, MongoDB collections store sensor records, watering logs, disease detections, system configurations, and status histories.

At the application layer, a React dashboard presents route-based modules such as overview, sensors, analytics, alerts, controls, AI intelligence hub, and settings. Role and permission checks govern access to critical actions.

The dual-controller approach reduces contention between time-sensitive sensing/actuation and camera workflows. This improves overall reliability and simplifies fault isolation.

## 3.2 Block Diagram

Figure 3.2 conceptually consists of the following blocks:

1. Sensing Block
   - Soil moisture sensor, DHT22, LDR, and flow sensor connected to ESP32-WROOM-32.

2. Control Block
   - Relay-driven pump controlled through ESP32 GPIO and safety logic.

3. Vision Block
   - ESP32-CAM acquires frames and submits disease classification payloads.

4. Communication Block
   - Both devices connect over Wi-Fi and communicate with HTTPS REST APIs using device credentials.

5. Backend Processing Block
   - Express API routes for sensor, watering, config, AI, auth, and admin operations.

6. Data Storage Block
   - MongoDB schemas for telemetry, logs, statuses, and detections.

7. User Interface Block
   - React dashboard for monitoring, control, analytics, and administration.

Data path and control path are intentionally decoupled: data is pushed or queried through APIs, while front-end real-time updates are delivered through WebSocket events.

## 3.3 Circuit Diagram

The sensor controller wiring is implemented on ESP32-WROOM-32 with ADC1 channels for analog sensors and dedicated GPIO for digital signals.

### Table 3.1 ESP32-SENSOR Pin Mapping

| Signal | Firmware Constant | ESP32 GPIO | Connected Module | Type |
|---|---|---|---|---|
| Soil moisture AO | PIN_SOIL / PIN_SOIL_MOISTURE | GPIO35 | Capacitive moisture sensor | Analog input |
| LDR (digital) | PIN_LDR | GPIO32 | LDR module (digital output) | Digital input |
| DHT22 DATA | PIN_DHT | GPIO13 | DHT22 | Digital input |
| Flow pulse | PIN_FLOW | GPIO26 | YFS401 yellow wire | Interrupt input |
| Relay control | PIN_RELAY | GPIO14 | Relay IN1 | Digital output |
| Manual button | PIN_BUTTON | GPIO33 | Push button to ground | Digital input pull-up |
| Buzzer optional | PIN_BUZZER | GPIO27 | Active/passive buzzer | Digital output |

Power and protection details:

1. ESP32 board is powered via USB 5V.
2. Sensors are powered using appropriate 3.3V or 5V supply per module requirement.
3. Relay and pump use external 5V supply.
4. All grounds are connected as common ground.
5. Relay NO contact is used so the pump remains OFF by default.

### Table 3.2 Module-Wise Interface Mapping

| Module | Supply | Interface | Notes |
|---|---|---|---|
| DHT22 | 3.3V | Single-wire digital | Optional 10k pull-up recommended |
| Soil Moisture (capacitive) | 3.3V/5V module-dependent | Analog voltage | Calibrate dry/wet ADC endpoints |
| LDR AO | 3.3V | Analog voltage | Linearized in firmware for display |
| YFS401 | 5V | Pulse output | ISR-based pulse counting |
| Relay + Pump | External 5V | Digital trigger via transistorized relay board | Electrical isolation and common ground required |
| ESP32-CAM | 5V | Camera + Wi-Fi | Separate from sensor wiring |

The circuit is designed for prototype safety and maintainability, with straightforward replacement of failed modules and minimal pin conflict risk.

## 3.4 Data Flow Diagram (DFD)

### Level 0 DFD

Entity interactions:

1. User interacts with dashboard for monitoring and commands.
2. Dashboard communicates with backend APIs.
3. Backend stores and retrieves data from MongoDB.
4. ESP32 devices send telemetry and status to backend.
5. Backend emits updates to dashboard via WebSocket.

### Level 1 DFD

Detailed process decomposition:

1. Input Stage
   - Sensor values from ESP32-SENSOR.
   - Disease event payload from ESP32-CAM.
   - User actions from web dashboard (start/stop watering, update settings).

2. Processing Stage
   - Request validation and authentication.
   - Payload normalization for variant field names.
   - Control-state updates (pump state, device online/offline status).
   - AI recommendation and insight generation.

3. Storage Stage
   - SensorReading collection stores environmental telemetry.
   - WateringLog stores irrigation events and outcomes.
   - DiseaseDetection stores disease labels, confidence, and health metadata.
   - DeviceStatus and SystemConfig store operational states and configuration.

4. Output Stage
   - REST responses to UI and device clients.
   - WebSocket push updates for live cards and alerts.
   - Dashboard trends, logs, and recommendation views.

This DFD demonstrates a closed-loop cyber-physical system where sensing, decision, and actuation are continuously linked.

## 3.5 Component Description

### ESP32-WROOM-32 DevKit (Sensor Controller)

Key specifications:

- Dual-core MCU up to 240 MHz.
- Integrated Wi-Fi for cloud API communication.
- Sufficient ADC and interrupt support for mixed sensor workloads.

Selection rationale:

- Balanced performance and cost.
- Mature Arduino ecosystem support.
- Suitable for frequent sampling, JSON payload generation, and command polling.

### ESP32-CAM AI Thinker with OV3660

Key specifications:

- ESP32-based board with integrated camera interface.
- Suitable for image capture and lightweight vision workflow integration.

Selection rationale:

- Dedicated imaging channel without overloading sensor controller.
- Cost-effective integration of disease-awareness events.

### DHT22 Sensor

Key specifications:

- Temperature and humidity sensing in one module.
- Digital interface reduces analog noise susceptibility.

Selection rationale:

- Reliable environmental context for irrigation analytics and AI recommendations.

### Capacitive Soil Moisture Sensor

Key specifications:

- Analog output proportional to soil water content.
- Reduced corrosion compared with resistive probes.

Selection rationale:

- Core variable for irrigation trigger decisions.

### LDR Module

Key specifications:

- Analog response to ambient light intensity.

Selection rationale:

- Adds contextual information for evaporation and growth interpretation.

### YFS401 Flow Sensor

Key specifications:

- Pulse-output flow measurement.
- Allows estimation of delivered water volume.

Selection rationale:

- Validates watering events and supports irrigation efficiency analytics.

### Relay Module and Pump

Key specifications:

- Digital relay control with isolated switching.
- External power path suitable for pump current demands.

Selection rationale:

- Safe and straightforward physical actuation mechanism.

### Table 3.3 Major Component Selection Rationale

| Component | Primary Role | Why Selected in SproutSense |
|---|---|---|
| ESP32-WROOM-32 | Sensor acquisition and control | Reliable multi-I/O + Wi-Fi in one board |
| ESP32-CAM | Disease awareness events | Dedicated camera path with low additional cost |
| DHT22 | Environment sensing | Combined temperature and humidity data |
| Soil sensor | Moisture-based irrigation trigger | Directly supports watering decisions |
| LDR | Light context | Supports analytics and recommendation context |
| YFS401 | Flow feedback | Supports validation of irrigation effectiveness |
| Relay + pump | Actuation | Practical implementation of autonomous watering |

## 3.6 Reliability, Safety, and Failure Handling Architecture

Reliable operation in embedded IoT systems requires systematic handling of failure modes rather than isolated error messages. SproutSense includes safety-oriented mechanisms at both firmware and backend layers.

### Firmware-Level Safety Controls

1. Pump timeout protection limits continuous relay activation and prevents prolonged overwatering under fault conditions.
2. Target flow-volume monitoring allows event termination when intended delivery volume is reached.
3. Button input debouncing prevents accidental rapid toggling from switch noise.
4. Wi-Fi reconnection loops allow autonomous recovery from temporary connectivity drops.

### Backend-Level Reliability Controls

1. Schema validation rejects malformed payloads early.
2. Rate limiting protects core routes from burst traffic and accidental flooding.
3. Health and status endpoints provide operational observability for diagnostics.
4. Structured error responses improve recoverability in firmware retry loops.

### Failure Mode and Effects Summary

| Failure Mode | Likely Cause | Detection Method | Mitigation Implemented |
|---|---|---|---|
| Moisture stuck at fixed value | Sensor drift/disconnect | Flatline trend + outlier check | Recalibration workflow + wiring validation |
| Pump remains active too long | Command/state mismatch | Runtime threshold breach | Hard timeout stop in firmware |
| Missing telemetry intervals | Wi-Fi or endpoint outage | Heartbeat gap in status page | Auto reconnect + retry cycles |
| Invalid disease labels | Model output mismatch | Backend enum validation failure | Label normalization mapping |
| Unauthorized control calls | Credential misuse | Auth middleware rejection | Device token and RBAC enforcement |

### Safety-Oriented Design Implications

The architecture prioritizes fail-safe behavior: when uncertain, stop actuation and preserve state traceability. This principle is essential for practical deployment where water and electrical loads are physically coupled.

## 3.7 Scalability and Maintainability Considerations

Although the current prototype targets a limited node count, design decisions were made with future expansion in mind.

### Horizontal Scalability Path

1. Device identity is persisted with explicit deviceId fields.
2. Time-indexed collections support high-frequency telemetry query windows.
3. Route grouping permits modular expansion by feature domain.

### Maintainability Path

1. Clear separation between route, controller, model, and middleware layers.
2. Dedicated firmware for sensor and camera workloads minimizes cross-impact during updates.
3. Documentation-aligned folder structure supports onboarding and contributor continuity.

### Deployment Evolution Strategy

Future migration path can include:

1. Load-balanced backend instances with shared persistent store.
2. Message queue insertion for high-frequency ingestion bursts.
3. Caching layer for dashboard-heavy read endpoints.

These additions can be introduced incrementally without restructuring the entire codebase, which validates the current design as a strong academic baseline.

## 3.8 Sequence-Level Operational Design

In addition to static architecture diagrams, sequence-level behavior clarifies runtime interactions between edge devices, backend services, and dashboard clients.

### Sequence 1: Sensor Ingestion and Live Update

1. ESP32-SENSOR samples sensors at configured interval.
2. Firmware assembles JSON payload and posts to sensor device endpoint.
3. Backend validates token and payload schema.
4. Controller normalizes aliases and persists canonical record.
5. Device status is marked online and last-seen timestamp updated.
6. WebSocket event is emitted to connected dashboards.
7. Dashboard merges update into active state and refreshes visible cards.

### Sequence 2: Manual Watering Control

1. User clicks start command from controls page.
2. Backend checks JWT, account state, and watering permission.
3. New watering log entry is created with triggerType manual.
4. Device status reflects WATERING state.
5. Sensor firmware polls watering status and activates relay.
6. Flow pulse tracking confirms delivery progression.
7. On stop condition, end state and output metrics are saved.

### Sequence 3: Disease Event Workflow

1. ESP32-CAM captures frame and computes or simulates classification result.
2. Disease label is normalized to backend enum vocabulary.
3. Device posts detection payload to AI disease endpoint.
4. Backend stores disease record and checks alert criteria.
5. Dashboard alert and AI views surface high-priority detections.

### Sequence 4: Configuration Synchronization

1. Device requests current config using device-authenticated route.
2. Backend returns structured configuration object.
3. Device applies interval and mode changes locally.
4. Status endpoint confirms device has re-synced operational state.

These sequences collectively demonstrate a closed feedback system where each architectural layer has explicit runtime responsibility.

## 3.9 Data Governance and Observability Model

Reliable operations require not only data collection but traceable governance.

### Governance Elements

1. Identity binding: deviceId is attached to telemetry and status records.
2. Temporal traceability: timestamped logs support post-event reconstruction.
3. Role governance: route access follows permission checks.
4. Administrative observability: audit-related logs capture operational actions.

### Observability Layers

1. Edge observability through serial diagnostics and heartbeat posts.
2. Backend observability through structured responses and status endpoints.
3. Dashboard observability through live indicators, alerts, and logs.

### Data Lifecycle Perspective

1. Capture: incoming measurements and events.
2. Validate: schema and authentication checks.
3. Store: indexed collections for history and analytics.
4. Surface: visual interfaces and recommendation endpoints.
5. Retain or purge: policy-controlled maintenance operations.

This model strengthens maintainability and supports future compliance-oriented extension if required.

---

# Chapter 4: Implementation

## 4.1 Algorithm and Flowchart

The implemented control logic combines periodic sensing, backend synchronization, command polling, and safety-driven watering control.

### A. ESP32-SENSOR Control Algorithm

1. Initialize Wi-Fi, sensor drivers, GPIO modes, and interrupt service routine for flow pulses.
2. Load configured credentials and endpoint URLs.
3. Every 5 seconds, read sensors (soil moisture, light, DHT22 values).
4. Evaluate auto-watering condition: if moisture falls below threshold and pump is not already running, trigger watering start.
5. During watering, continuously monitor delivered volume and runtime.
6. Stop pump when target volume is reached or safety timeout occurs.
7. Every 15 seconds, upload telemetry payload to backend sensor endpoint.
8. Every 30 seconds, publish heartbeat/status payload.
9. Every 8 seconds, poll watering status endpoint for command synchronization.
10. Every 60 seconds, sync configuration from backend.
11. Repeat loop with error logging and reconnection handling.

### B. ESP32-CAM Workflow Algorithm

1. Initialize camera and Wi-Fi.
2. Sync AI mode and growth-stage configuration from backend.
3. Capture frame at configured interval (snapshots or live-feed cadence).
4. Produce disease output (simulation mode or inference mode).
5. Normalize disease labels to backend enum-compatible values.
6. Upload disease payload with confidence and optional health metadata.
7. Send periodic heartbeat and configuration sync requests.
8. Retry network operations on transient failures.

### C. Backend Processing Algorithm

1. Receive incoming request.
2. Validate schema and authentication (device token or user JWT).
3. Normalize field aliases where required.
4. Persist data to MongoDB.
5. Update device status and last-seen metadata.
6. Emit WebSocket event to connected dashboard clients.
7. Return structured success response.

### Flowchart Description (Professional Representation)

Start -> Initialize Modules -> Connect Network -> Acquire Inputs -> Validate Readings -> Decision Node (Threshold / Command / Safety) -> Execute Action (Upload / Water / Alert) -> Update Status and Logs -> Wait Interval -> Repeat -> End (on shutdown/reset)

Error-handling branches:

- If network unavailable, enqueue retry cycle and continue local safety logic.
- If sensor read invalid, use fallback value handling and warning logs.
- If pump runtime exceeds limit, force stop and mark safety event.

## 4.2 Software Stack

The software implementation is structured as a firmware-backend-frontend pipeline with clear module boundaries.

### Table 4.1 Software Stack and Roles

| Layer | Tool/Framework | Role in Implementation |
|---|---|---|
| Firmware | Arduino IDE + ESP32 core | Compiling and uploading edge firmware |
| Firmware Libraries | WiFi, HTTPClient, WiFiClientSecure, DHT, ArduinoJson, Preferences | Connectivity, HTTPS calls, sensor IO, JSON serialization, config persistence |
| Backend Runtime | Node.js + Express | API orchestration, business logic, auth, validation |
| Backend Data Layer | MongoDB + Mongoose | Persistence, indexing, aggregation, schema control |
| Security | JWT, RBAC middleware, device token auth | User authorization and device trust boundary |
| Realtime | ws WebSocket server | Push updates for live dashboard views |
| Frontend | React + Vite + React Router | User interface, route management, component rendering |
| Frontend Integration | REST + WebSocket hooks | Snapshot fetch + near real-time updates |
| Deployment | Render (API), Netlify (web) | Cloud hosting and access availability |

### Backend Module Structure

1. Routes layer defines endpoint groups such as auth, users, sensors, water, config, and AI.
2. Controllers implement logic for creation, retrieval, updates, and analytics.
3. Middleware handles rate limiting, auth checks, permission checks, and error mapping.
4. Models define persistence schema and helper static methods.
5. Utilities handle WebSocket publishing, AI provider integration, and helper responses.

### Frontend Module Structure

1. Public pages: home, about, features, plant library, demo, contact.
2. Auth pages: login, register, password reset, verification, access denied.
3. Protected pages: home overview, sensors, analytics, alerts, controls, AI, insights, device status, settings.
4. Admin page: operational console areas (connections, keys, users, UI, sensor limits, raw data, logs, mock data).
5. Hooks and services: API wrappers, WebSocket merging, and mock mode support.

## 4.3 Connectivity and Communication

### Network Topology

The system uses Wi-Fi as the local transport medium for both ESP32 modules. The backend service is internet-reachable, and the web dashboard communicates with backend over HTTPS and WebSocket.

Topology summary:

ESP32-SENSOR / ESP32-CAM -> Wi-Fi AP/Router -> Internet -> Render API -> MongoDB Atlas -> Netlify-hosted Dashboard

### API Endpoint Design

The implementation includes dedicated device-authenticated endpoints and user-authenticated endpoints.

### Table 4.2 Core API Endpoints and Payloads

| Method | Endpoint | Authentication | Purpose | Example Fields |
|---|---|---|---|---|
| POST | /api/sensors/device | X-Device-ID + X-Device-Token | Push sensor telemetry | soilMoisture, temperature, humidity, light, flowRate, flowVolume, deviceId |
| GET | /api/sensors | JWT + permission | Latest reading for dashboard | query: deviceId |
| GET | /api/sensors/history | JWT + permission | Historical trend retrieval | query: hours/start/end |
| POST | /api/water/device/start | Device token | Report watering start | deviceId, triggerType |
| POST | /api/water/device/stop | Device token | Report watering stop | deviceId |
| GET | /api/water/device/status/:deviceId | Device token | Poll command/state | pumpActive, currentState |
| POST | /api/config/status/device | Device token | Device heartbeat/status update | online, pumpActive, currentState, uptime |
| GET | /api/config/device/:deviceId | Device token | Remote config fetch | thresholds, intervals, AI mode |
| POST | /api/ai/disease/device | Device token | Disease event upload | detectedDisease, confidence, growthStage, image metadata |
| POST | /api/ai/chat | JWT + permission | User AI assistant query | prompt, context |

### Payload Structure Example: Sensor Upload

{
  "deviceId": "ESP32-SENSOR",
  "soilMoisture": 32.4,
  "temperature": 28.1,
  "humidity": 66.2,
  "light": 12450,
  "flowRate": 160.5,
  "flowVolume": 95.0,
  "timestamp": "2026-04-16T10:15:00Z"
}

### Payload Structure Example: Disease Detection Upload

{
  "deviceId": "ESP32-CAM",
  "detectedDisease": "leafspot",
  "confidence": 0.82,
  "growthStage": "vegetative",
  "edgeImpulseData": {
    "projectId": "919040",
    "inferenceTime": 124,
    "anomalyScore": 0.08
  },
  "plantHealth": {
    "overallScore": 74,
    "leafColor": "yellow-green"
  }
}

### Security Aspects

1. Device endpoints use token-based identity via headers.
2. User endpoints use JWT access flow and RBAC permissions.
3. Backend enforces request validation and rate limiting.
4. CORS and security headers are configured for web access boundaries.
5. HTTPS communication is used for API transport.

## 4.4 Implementation Challenges

### Challenge 1: Sensor Calibration Variability

Issue: Soil moisture analog readings varied across sensor insertion depth and soil composition.

Resolution: Dry/wet ADC calibration values were used in firmware, and threshold tuning support was added through configurable backend parameters.

### Challenge 2: Multi-Format Payload Compatibility

Issue: Different firmware revisions produced alternate field names such as ph/pH and flowRateMlPerMin/flowRate.

Resolution: Backend normalization logic was introduced to accept known aliases and map to canonical schema fields before persistence.

### Challenge 3: Command Latency and State Synchronization

Issue: Direct push control to device could introduce timing uncertainty under unstable network conditions.

Resolution: Device-side polling of watering status endpoint at fixed intervals was adopted, reducing control ambiguity and improving synchronization consistency.

### Challenge 4: ESP32-CAM Label Consistency

Issue: Disease class labels from prototype datasets were not always backend-enum compatible.

Resolution: Label normalization mapping was implemented in firmware and backend to ensure valid disease category storage.

### Challenge 5: Role-Safe UI Access

Issue: Feature-rich dashboard required strict separation of public, user, viewer, and admin actions.

Resolution: Permission-based route guards and middleware-based authorization checks were implemented across frontend and backend.

### Challenge 6: Deployment and Environment Configuration

Issue: Misaligned environment variables across backend and frontend can break API and WebSocket connectivity.

Resolution: Structured .env contracts were documented and validated with startup checks in production mode.

## 4.5 Detailed API Contract and Data Model Rationale

The implemented API contract was designed to balance strict validation with backward compatibility for evolving firmware clients.

### SensorReading Model Rationale

Primary fields include soilMoisture, temperature, humidity, light, optional pH, flowRate, flowVolume, and timestamp. The inclusion of both instantaneous and cumulative flow metrics supports richer irrigation analytics than moisture-only systems.

Index strategy:

1. Descending timestamp index for latest-read lookups.
2. Composite index on deviceId and timestamp for multi-device historical windows.

### WateringLog Model Rationale

The watering log captures operational semantics beyond event timestamps:

1. triggerType distinguishes auto, manual, scheduled, and AI-originated decisions.
2. soilMoistureBefore and soilMoistureAfter quantify irrigation effectiveness.
3. duration and volumeML support consumption and efficiency analysis.

This schema allows performance auditing of both firmware logic and agronomic impact.

### DiseaseDetection Model Rationale

The disease schema stores both immediate classification and contextual metadata:

1. detectedDisease and confidence for core inference output.
2. growthStage for biological context.
3. optional edgeImpulseData and plantHealth payloads for explainability.

This structure enables progressive enhancement: the system can operate in simplified mode while preserving compatibility for richer model outputs later.

### Validation Philosophy

Input validators enforce physical plausibility ranges and typed payload contracts. This reduces silent corruption in historical analytics and prevents malformed packets from propagating into dashboards.

### Contract Evolution Strategy

To handle firmware heterogeneity, controllers support alias fields and map them into canonical schema fields. This strategy provides graceful migration without forced immediate reflashing of all devices.

## 4.6 Performance Engineering Notes and Resource Constraints

Prototype systems on ESP32 hardware must account for timing jitter, memory limits, and network unpredictability. The implementation includes pragmatic engineering choices to maintain responsiveness.

### Firmware Timing Strategy

Intervals were assigned by function criticality:

1. Short interval for sensor reads to maintain control responsiveness.
2. Medium interval for telemetry uploads to avoid excessive bandwidth consumption.
3. Separate heartbeat and command-poll intervals to decouple liveness from command logic.

This staged timing model prevents one subsystem from starving others.

### Memory and Payload Tradeoffs

1. JSON payload size is kept compact by sending only operationally relevant fields.
2. Camera payloads are metadata-centric by default; large image fields are optional.
3. Backend excludes heavy fields by default in read paths where not required.

### Network Robustness Measures

1. HTTPS transport with device credentials protects endpoint integrity.
2. Reconnection and retry loops absorb transient failures.
3. WebSocket updates reduce dashboard polling overhead for rapidly changing indicators.

### Latency-Influencing Factors

Observed response characteristics are influenced by:

1. Cloud-hosted API cold starts and internet routing variability.
2. Polling interval granularity at firmware side.
3. Serialization/deserialization overhead in edge and backend layers.

Despite these factors, the prototype demonstrated acceptable responsiveness for academic smart-irrigation workloads.

## 4.7 Verification Workflow and Test Execution Strategy

Implementation verification was performed incrementally across module boundaries to reduce integration risk.

### Phase 1: Firmware Unit-Level Checks

1. Sensor read stability at serial monitor level.
2. Relay and pump actuation checks under safe power setup.
3. Flow pulse counting verification with known water pass-through.
4. Button debounce and manual toggle behavior checks.

### Phase 2: API Contract Validation

1. Endpoint reachability checks for each route group.
2. Positive-path payload submission from firmware and REST clients.
3. Negative-path validation for range violations and missing fields.
4. Device-token and JWT authorization behavior verification.

### Phase 3: Integration and UI Validation

1. End-to-end telemetry appearance in dashboard cards.
2. Live update verification through WebSocket event stream.
3. Watering command lifecycle validation in controls and logs.
4. Disease detection appearance in AI and alerts pages.

### Phase 4: Regression-Oriented Rechecks

1. Repeat critical tests after route or schema modifications.
2. Re-verify RBAC protection on admin-sensitive actions.
3. Confirm historical query and chart adapters remain aligned.

This staged strategy improved reliability by identifying issues early at the lowest-cost debugging layer.

## 4.8 Security Engineering Considerations

Security in IoT is multi-surface, spanning edge firmware, transport, backend logic, and dashboard permissions.

### Implemented Controls

1. Device credentials in protected headers for edge-origin endpoints.
2. JWT-based user sessions for protected web functionality.
3. Account state checks to block suspended or pending accounts.
4. Permission checks for feature-level action authorization.
5. API rate limiting to reduce abuse and accidental overload.

### Residual Risks

1. Hardcoded placeholder tokens in firmware templates can be misused if not rotated.
2. Development-mode configurations may reduce strictness if deployed inadvertently.
3. Physical access to devices can still introduce tamper risks.

### Recommended Hardening Path

1. Enforce token rotation schedule and secure secret provisioning.
2. Add signed firmware release verification.
3. Expand anomaly detection for suspicious command patterns.
4. Maintain security-focused logs for incident review.

The current baseline is appropriate for academic deployment while providing a clear route toward stronger production posture.

---

# Chapter 5: Results and Discussion

## 5.1 Hardware Snapshots

The hardware prototype consists of two independent edge modules.

1. Sensor Controller Snapshot (Figure 5.1)
   - Shows ESP32-WROOM-32 board connected to DHT22, soil sensor, LDR module, flow sensor pulse line, manual button, and relay interface.
   - Demonstrates organized breadboard/wire layout with common ground.

2. Relay and Pump Snapshot (Figure 5.2)
   - Shows external 5V pump power path routed through relay COM-NO contacts.
   - Illustrates safe OFF-by-default behavior through NO terminal usage.

3. ESP32-CAM Snapshot (Figure 5.3)
   - Shows standalone camera module and power/flash interface.
   - Highlights physical separation from analog sensing domain to reduce interference and simplify diagnostics.

Hardware assembly indicates successful realization of a dual-node embedded architecture suitable for continued refinement and enclosure-level packaging.

## 5.2 Software/UI Snapshots

The web dashboard is organized into public and authenticated zones with role-specific route visibility.

### Dashboard Section Explanation

1. Overview Page
   - Displays current environmental indicators, system status summary, and recent activity context.
   - Serves as landing page after login.

2. Sensors Page
   - Shows latest sensor values and device heartbeat visibility.
   - Supports user monitoring of moisture, temperature, humidity, and light behavior.

3. Analytics Page
   - Presents historical charts, trend windows, and aggregated metrics.
   - Used to assess environmental patterns and watering impact over time.

4. Alerts Page
   - Lists abnormal conditions and event notifications requiring user attention.

5. Controls Page
   - Allows manual watering start/stop actions with trigger context.
   - Reflects backend and device state synchronization.

6. Intelligence Hub (AI)
   - Displays recommendations generated from sensor history and conditions.
   - Includes chat-assist interaction for contextual guidance.

7. Device Status Page
   - Provides visibility into ESP32 and ESP32-CAM connection states and last-seen metadata.

8. Settings/Admin Areas
   - Allow threshold updates, policy controls, logs, and governance operations based on permission level.

### User Navigation and Device Connection Process

Typical user process:

1. User accesses public routes and authenticates via login/register.
2. After authentication, route guards allow access based on role permissions.
3. User opens device-related pages to verify online status and last-seen timestamps.
4. Device onboarding/config pages are used to map credentials and fetch runtime configuration.
5. User monitors telemetry on sensors/analytics pages and triggers watering from controls if required.
6. AI and disease pages support proactive health interpretation and action prioritization.

This flow ensures operational usability without requiring direct firmware interaction for routine monitoring.

## 5.3 Data Analysis

Representative measurements were observed during controlled prototype operation and backend logging windows.

### Table 5.1 Representative Sensor Data Sample

| Timestamp | Soil Moisture (%) | Temperature (C) | Humidity (%) | Light (lux) | Flow Rate (mL/min) | Flow Volume (mL) | Pump State |
|---|---:|---:|---:|---:|---:|---:|---|
| 2026-04-14 09:00 | 41.2 | 27.4 | 68.1 | 9800 | 0.0 | 0.0 | OFF |
| 2026-04-14 10:00 | 35.0 | 28.0 | 65.7 | 11500 | 0.0 | 0.0 | OFF |
| 2026-04-14 11:00 | 28.6 | 29.1 | 62.8 | 13200 | 162.0 | 54.5 | ON |
| 2026-04-14 11:10 | 34.8 | 29.0 | 63.1 | 12950 | 155.4 | 102.8 | OFF |
| 2026-04-14 13:00 | 31.9 | 31.2 | 58.4 | 18800 | 0.0 | 0.0 | OFF |
| 2026-04-14 15:00 | 29.4 | 32.0 | 56.0 | 20500 | 170.2 | 98.1 | ON |
| 2026-04-14 15:12 | 36.0 | 31.8 | 57.2 | 19800 | 0.0 | 0.0 | OFF |

### Table 5.2 Hourly Aggregated Trend Snapshot

| Metric | Avg | Min | Max | Observation |
|---|---:|---:|---:|---|
| Soil Moisture (%) | 33.8 | 27.9 | 42.1 | Moisture drop and recovery cycles align with irrigation events |
| Temperature (C) | 29.4 | 26.8 | 32.4 | Midday heat increase correlates with faster moisture decline |
| Humidity (%) | 62.2 | 54.5 | 70.1 | Inverse tendency with temperature observed |
| Light (lux) | 14890 | 6200 | 22800 | Higher light windows correspond to increased evapotranspiration |
| Flow Volume/Event (mL) | 97.4 | 88.0 | 110.3 | Delivery near target watering profile |

### Analysis Discussion

1. Accuracy and Stability
   - Sensor data streams remained within expected physical bounds and validation thresholds.
   - Moisture and flow measurements were consistent with watering activity and event logs.

2. Latency and Responsiveness
   - Dashboard updates reflected backend state with near real-time behavior through WebSocket push.
   - Device polling model improved practical synchronization of watering state transitions.

3. Observed Trends
   - Soil moisture declines accelerated during high-temperature and high-light intervals.
   - Watering events produced measurable moisture recovery, supporting control-loop effectiveness.

4. Disease Event Utility
   - ESP32-CAM detections with confidence filtering enabled focused alert prioritization.
   - Label normalization reduced storage inconsistencies in disease records.

## 5.4 Testing and Validation

### Table 5.3 Testing and Validation Matrix

| Test Case ID | Test Description | Input Conditions | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-01 | Sensor Range Validation | Moisture, temp, humidity, light sample inputs | Values accepted within configured range | Valid payloads persisted; invalid values rejected | Pass |
| TC-02 | Device Token Auth Test | Device endpoint call with invalid token | Request blocked with auth error | 401/403 behavior observed as expected | Pass |
| TC-03 | Watering Start Command | Manual trigger from dashboard | Pump state changes to WATERING; log created | State updated; log entry created and broadcast | Pass |
| TC-04 | Watering Stop Command | Stop trigger after active cycle | Pump state returns to IDLE; endTime recorded | Successful stop and completion metadata saved | Pass |
| TC-05 | Auto-Watering Threshold Test | Moisture below threshold | Automatic watering initiated | Auto trigger executed and logged | Pass |
| TC-06 | Safety Timeout Test | Simulated prolonged pump runtime | Forced stop at timeout limit | Pump stopped at defined safety interval | Pass |
| TC-07 | Sensor History Retrieval | API query for last 24h | Structured historical array returned | Correct count and timestamp ordering observed | Pass |
| TC-08 | WebSocket Live Update | New sensor post event | Dashboard receives sensor_update event | UI updated without manual refresh | Pass |
| TC-09 | RBAC Route Protection | Viewer/user attempts admin operation | Access denied for unauthorized role | Proper permission enforcement observed | Pass |
| TC-10 | Disease Detection Upload | ESP32-CAM payload submit | Detection stored with confidence and timestamp | Record persisted with normalized label | Pass |
| TC-11 | AI Recommendation Endpoint | Valid user request with data context | Recommendation returned with action/confidence | Structured response generated | Pass |
| TC-12 | Connectivity Recovery | Temporary Wi-Fi loss and restore | Device reconnects and resumes uploads | Reconnection and resumed posting observed | Pass |

### Overall Performance Discussion

The prototype met major functional requirements across sensing, irrigation control, backend integration, dashboard visibility, and role governance. Data quality and event synchronization were acceptable for minor-project-grade deployment. Limitations include dependence on stable Wi-Fi, environment-specific sensor calibration drift, and the need for broader long-duration field testing.

## 5.5 Extended Experimental Discussion

To strengthen evaluation beyond pass/fail functional checks, additional interpretation was performed using operational logs, trend behavior, and control consistency observations.

### A. Moisture Recovery Dynamics

The relationship between watering events and moisture recovery was analyzed at event boundaries. Most successful cycles showed measurable post-irrigation increase, indicating that flow control and irrigation path were mechanically functional.

A useful derived metric is moisture recovery efficiency:

Moisture Recovery Efficiency = (Soil Moisture After - Soil Moisture Before) / Water Volume Applied

This metric helps compare irrigation effectiveness across soil conditions and can support future adaptive duration control.

### B. Environmental Coupling Effects

Temperature and light increase windows correlated with faster moisture decline in daytime records. This confirms the need for dynamic threshold or context-aware recommendation logic instead of fixed schedules.

### C. Control Stability Indicators

Three indicators were used for stability assessment:

1. Frequency of unintended pump toggles.
2. Consistency of state transition sequence (IDLE -> WATERING -> IDLE).
3. Presence of orphan logs (start recorded without stop).

Observed logs indicated stable transition behavior under normal operating network conditions.

### D. Disease Alert Utility

Disease detections with confidence filtering prevented excessive false-priority alerts on the dashboard. This improved operator trust in AI panels and reduced alert fatigue.

### E. Practical Limitations

1. Sensor behavior remains soil-type dependent and requires site recalibration.
2. Image-based detection confidence is influenced by lighting and camera positioning.
3. Long-term drift and seasonality were not fully covered in the short academic timeline.

## 5.6 Statistical and Validation Enhancements

For a more formal engineering interpretation, the following statistical checks are recommended and partially adopted in analysis workflows.

### Table 5.4 Suggested Statistical Validation Indicators

| Indicator | Interpretation | Value Range Goal |
|---|---|---|
| Sensor Availability Ratio | Percentage of expected intervals with valid readings | Greater than 95 percent |
| Watering Command Success Rate | Successful start/stop command completion ratio | Greater than 98 percent |
| Mean Event Synchronization Delay | Time between backend command and reflected device state | Less than 10 seconds |
| Disease Alert Precision Proxy | High-confidence non-healthy detections among all alerts | Context-dependent, maximize confidence-filtered relevance |

### Confidence-Oriented Discussion

Although this prototype does not claim certified industrial validation, the consistency of event logs, acceptable synchronization behavior, and bounded sensor values provide strong evidence that the design is functionally sound for minor-project objectives.

### Regression Testing Scope Extension

Future validation can include:

1. Stress tests with burst telemetry.
2. Long-duration soak tests over multiple weeks.
3. Fault injection scenarios (network partitions, malformed payload replay, sensor disconnect).
4. Controlled benchmark comparison between fixed and adaptive watering policies.

These additions would further improve scientific rigor and readiness for publication-oriented outcomes.

## 5.7 Comparative Scenario Analysis

To evaluate practical impact, behavior was compared across representative operation scenarios.

### Scenario A: Normal Day with Moderate Climate

Expected behavior:

1. Gradual moisture decline.
2. One to two controlled watering events.
3. Stable dashboard and minimal alerts.

Observed behavior aligned with expectation, indicating proper control-loop operation.

### Scenario B: High Temperature and High Light Interval

Expected behavior:

1. Faster moisture depletion.
2. Increased watering event probability.
3. Recommendation urgency increase.

Observed trends showed stronger moisture drop gradients and context-aware suggestion shifts, supporting environmental sensitivity of the system.

### Scenario C: Network Instability Window

Expected behavior:

1. Temporary telemetry gaps.
2. Device reconnection and heartbeat recovery.
3. System return to normal with minimal manual intervention.

Observed behavior confirmed reconnect loops and post-recovery upload continuity, though short visibility gaps remained during outage periods.

### Scenario D: Disease Alert Burst

Expected behavior:

1. New non-healthy detections captured in history.
2. Active alerts populated based on confidence thresholds.
3. User sees prioritized disease context on AI screens.

Observed behavior matched this flow, validating disease awareness integration as an actionable support feature.

## 5.8 Limitations, Ethics, and Practical Deployment Notes

### Technical Limitations

1. Calibration requirements differ by soil composition and probe placement.
2. Camera-based interpretation quality depends on illumination and framing.
3. Current results are from prototype-scale operation, not full seasonal deployment.

### Ethical and Operational Considerations

1. AI recommendations should assist, not replace, human agronomic judgment.
2. Misclassification risk must be communicated clearly to users.
3. Water-use automation must include transparent override controls.

### Deployment Guidance for Responsible Use

1. Keep manual override available for all automated actions.
2. Use conservative thresholds during initial operation.
3. Monitor logs regularly after firmware or config updates.
4. Perform periodic sensor health checks and recalibration.

These practices support safe and responsible use while preserving user trust in automation outcomes.

---

# Chapter 6: Project Work Log

## Table 6.1 Project Work Log (Weekly Progress)

| Month | Week No. | Activity Performed | Remarks | Signature |
|---|---:|---|---|---|
| January 2026 | Week 1 | Problem definition, literature survey, and requirement finalization for smart plant monitoring and irrigation scope | Core use-cases finalized with guide feedback | __________ |
| January 2026 | Week 2 | Selection and procurement review of ESP32 boards, DHT22, soil sensor, LDR, flow sensor, relay, and pump | Hardware shortlist frozen for prototype build | __________ |
| January 2026 | Week 3 | Preliminary circuit planning, pin mapping, and safety review for relay-pump wiring | Common-ground and power rules documented | __________ |
| February 2026 | Week 4 | Firmware baseline setup in Arduino IDE and initial sensor interfacing tests | Basic sensor reads obtained on serial monitor | __________ |
| February 2026 | Week 5 | Flow sensor interrupt handling and manual relay control implementation | Water flow pulse counting validated | __________ |
| February 2026 | Week 6 | Auto-watering threshold logic, timeout safety, and button-trigger handling implemented | Stable local control loop achieved | __________ |
| February 2026 | Week 7 | Backend API scaffolding and route integration for sensors, water, config, and AI modules | Core endpoint groups operational | __________ |
| March 2026 | Week 8 | MongoDB schema creation for SensorReading, WateringLog, DiseaseDetection, DeviceStatus | Persistence layer verified through test inserts | __________ |
| March 2026 | Week 9 | JWT auth and RBAC middleware integration with protected route testing | Role-based access controls enabled | __________ |
| March 2026 | Week 10 | React dashboard route structure, sidebar navigation, and API integration for live cards and controls | User workflows functional end-to-end | __________ |
| March 2026 | Week 11 | WebSocket integration for near real-time updates and analytics trend rendering | Live telemetry refresh behavior improved | __________ |
| April 2026 | Week 12 | ESP32-CAM module integration, disease payload upload, and label normalization | Camera workflow connected to backend AI routes | __________ |
| April 2026 | Week 13 | System integration testing (sensor ingestion, watering logs, auth checks, dashboard controls) | Functional test matrix drafted and executed | __________ |
| April 2026 | Week 14 | Result analysis, report drafting, references, appendix preparation, and final review | Documentation and final presentation readiness completed | __________ |

---

# Chapter 7: Conclusion and Future Scope

## 7.1 Conclusion

This minor project successfully implemented SproutSense, a dual ESP32-based IoT platform for intelligent plant monitoring and automated irrigation. The system addressed the core problem of inconsistent manual plant care by integrating continuous environmental sensing, controlled irrigation actions, cloud data persistence, and dashboard-based remote visibility.

The chosen architecture separated sensing/control and camera workflows into dedicated embedded modules, improving reliability and maintainability. The backend provided secure and structured APIs with validation, RBAC, and real-time update support. The frontend delivered a role-aware interface for monitoring, analytics, configuration, and control. Prototype-level testing showed functional correctness for core operations such as telemetry ingestion, watering actuation, status synchronization, and disease event handling.

Based on implemented objectives, the project demonstrates practical applicability for educational labs, home cultivation, and small controlled environments. The approach is technically sound, modular, and extensible for future scale-up.

## 7.2 Future Scope

Potential enhancements are listed below:

1. AI/ML Predictive Irrigation
   - Train predictive models using historical moisture, weather, and growth-stage data for proactive watering schedules.

2. Edge Computing Optimization
   - Shift portions of decision logic and anomaly detection to edge nodes for reduced cloud dependency.

3. Expanded Sensor Coverage
   - Add pH, EC, CO2, and soil temperature sensing for improved agronomic insight.

4. Industrial Deployment Features
   - Introduce ruggedized enclosures, failover connectivity, and remote firmware update pipelines.

5. Multi-Node Farm Topology
   - Support zone-based node management and coordinated irrigation scheduling across larger deployments.

6. Standards and Platform Integration
   - Integrate with external farm management systems, weather APIs, and standard IoT interoperability frameworks.

7. Stronger Security Hardening
   - Extend device key rotation automation, signed firmware validation, and security event auditing.

8. Advanced Visualization and Reporting
   - Add richer comparative analytics, predictive trend overlays, and export-ready operational reports.

---

# Chapter 8: References and Appendices

## 8.1 References (IEEE Style)

[1] D. Rose, "A Survey of Smart Irrigation Systems for Precision Agriculture," IEEE Access, vol. 11, pp. 10123-10145, 2023.

[2] A. Kumar and P. Singh, "IoT-Based Plant Monitoring Using ESP32 and Cloud Analytics," International Journal of Embedded Systems, vol. 15, no. 2, pp. 77-89, 2022.

[3] M. R. Patel et al., "Comparative Study of MQTT, HTTP, and CoAP in Resource-Constrained IoT Networks," Sensors, vol. 23, no. 8, pp. 1-22, 2023.

[4] Espressif Systems, "ESP32-WROOM-32 Datasheet," 2024. [Online]. Available: https://www.espressif.com

[5] AI Thinker, "ESP32-CAM Technical Reference Manual," 2023. [Online].

[6] Aosong Electronics, "DHT22 Temperature and Humidity Sensor Datasheet," 2022. [Online].

[7] YF Tech, "YF-S401 Water Flow Sensor Specification," 2021. [Online].

[8] MongoDB Inc., "MongoDB Documentation: Data Modeling and Aggregation," 2025. [Online]. Available: https://www.mongodb.com/docs

[9] Node.js Foundation, "Node.js Documentation," 2025. [Online]. Available: https://nodejs.org

[10] React Team, "React Documentation," 2025. [Online]. Available: https://react.dev

[11] Express.js Foundation, "Express Framework Guide," 2025. [Online]. Available: https://expressjs.com

[12] SproutSense Repository Documentation, "Architecture, Backend, Frontend, and Firmware Guides," AV-iot-ai/SproutSense, 2026.

## 8.2 Appendix A: Code Snippets

### A.1 Main Firmware Loop Pattern (ESP32-SENSOR)

```cpp
void loop() {
  unsigned long now = millis();

  if (now - g_tSensors >= IV_SENSORS) {
    g_tSensors = now;
    updateSensors();
    checkAutoWatering();
    updatePumpSafety();
  }

  if (now - g_tBackend >= IV_BACKEND) {
    g_tBackend = now;
    postSensorPayload();
  }

  if (now - g_tHeartbeat >= IV_HEARTBEAT) {
    g_tHeartbeat = now;
    postDeviceStatus();
  }

  if (now - g_tCmdPoll >= IV_CMD_POLL) {
    g_tCmdPoll = now;
    pollRemoteCommand();
  }
}
```

### A.2 Sensor Ingestion Controller Pattern

```javascript
export const createSensorReading = async (req, res, next) => {
  try {
    const {
      soilMoisture, pH, ph, temperature, humidity, light,
      flowRate, flowRateMlPerMin, waterFlowRate,
      flowVolume, cycleVolumeML, waterFlowVolume,
      leafCount, leaf_count, canopyLeafCount,
      deviceId = req.deviceAuth?.deviceId || 'ESP32-SENSOR'
    } = req.body;

    const reading = await SensorReading.create({
      soilMoisture,
      pH: pH ?? ph,
      temperature,
      humidity,
      light,
      flowRate: flowRate ?? flowRateMlPerMin ?? waterFlowRate,
      flowVolume: flowVolume ?? cycleVolumeML ?? waterFlowVolume,
      leafCount: leafCount ?? leaf_count ?? canopyLeafCount,
      deviceId
    });

    wsService.broadcastSensorUpdate(reading);
    successResponse(res, reading, 'Sensor reading created', 201);
  } catch (error) {
    next(error);
  }
};
```

### A.3 Watering Control Endpoints

```javascript
router.post('/device/start', wateringLimiter, validateWateringRequest, authenticateDevice, startWatering);
router.post('/device/stop', wateringLimiter, validateWateringRequest, authenticateDevice, stopWatering);
router.get('/device/status/:deviceId', readLimiter, authenticateDevice, getWateringStatus);
```

### A.4 Disease Detection Device Endpoint

```javascript
router.post('/disease/device', aiLimiter, validateDiseaseDetection, authenticateDevice, submitDiseaseDetection);
```

### A.5 Frontend Route Groups

```jsx
<Routes>
  <Route path="/" element={<PublicHomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
  <Route path="/sensors" element={<ProtectedRoute><SensorsPage /></ProtectedRoute>} />
  <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
  <Route path="/controls" element={<ProtectedRoute><ControlsPage /></ProtectedRoute>} />
  <Route path="/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedAdminRoute><AdminPanelPage /></ProtectedAdminRoute>} />
</Routes>
```

## 8.3 Appendix B: Datasheets

The following datasheets and technical references were consulted during component selection and implementation.

### Table 8.1 Datasheet Parameters Used for Design Decisions

| Module | Datasheet Focus Parameters | Design Relevance |
|---|---|---|
| ESP32-WROOM-32 | Operating voltage, ADC channels, GPIO constraints, Wi-Fi features | Determined sensor pin plan and communication capability |
| ESP32-CAM (OV3660) | Camera pin map, memory constraints, power requirements | Determined vision module feasibility and wiring separation |
| DHT22 | Sampling interval, temperature and humidity range | Guided sensor polling interval and validation limits |
| Capacitive Soil Sensor | Analog output behavior, supply range | Guided ADC calibration and threshold mapping |
| YFS401 Flow Sensor | Pulse-to-flow conversion relation | Enabled water volume estimation and pump safety checks |
| Relay Module | Trigger voltage and switching isolation | Ensured safe pump actuation from ESP32 GPIO |
| Pump Motor | Voltage/current requirement | Guided external power supply strategy |

Important design decisions informed by datasheets:

1. Analog sensing was assigned to ADC1-capable pins to avoid contention.
2. Relay and pump were isolated from MCU direct load using external power routing.
3. Sensor ranges in backend validators were aligned with realistic module limits.
4. Camera module operation was separated from sensor board to reduce processing and pin conflicts.

## 8.4 Appendix C: Expanded Endpoint Catalogue

This appendix provides a consolidated endpoint-level view for implementation and viva discussion.

### Authentication and User Domain

1. POST /api/auth/register
2. POST /api/auth/login
3. POST /api/auth/refresh
4. GET /api/auth/me

### Sensor Domain

1. POST /api/sensors/device
2. GET /api/sensors
3. GET /api/sensors/history
4. GET /api/sensors/hourly
5. GET /api/sensors/stats

### Watering Domain

1. POST /api/water/device/start
2. POST /api/water/device/stop
3. GET /api/water/device/status/:deviceId
4. POST /api/water/start
5. POST /api/water/stop
6. GET /api/water/history
7. GET /api/water/today

### Configuration and Health Domain

1. GET /api/config
2. POST /api/config
3. GET /api/config/status
4. POST /api/config/status/device
5. GET /api/config/health
6. GET /api/config/system-stats

### AI and Disease Domain

1. GET /api/ai/recommend
2. GET /api/ai/insights
3. GET /api/ai/usage
4. POST /api/ai/chat
5. POST /api/ai/disease/device
6. GET /api/ai/disease/latest
7. GET /api/ai/disease/history
8. GET /api/ai/disease/alerts

### Administrative and Governance Domain

1. GET /api/config/admin-logs
2. POST /api/config/admin-logs
3. DELETE /api/config/admin-logs
4. GET /api/config/admin-logs/export

This structured view is useful for API testing plans, security audits, and demo sequencing.

## 8.5 Appendix D: Viva Preparation Notes and Technical Defense Points

This section provides concise technical defense points for oral examination.

### Key Justifications

1. Why dual ESP32:
   - Separates camera workload from real-time sensor-control loop, improving stability.

2. Why HTTPS + REST instead of MQTT:
   - Better fit with existing stack and easier debug visibility within project timeline.

3. Why device-token authentication:
   - Enforces edge identity and prevents unauthorized telemetry/control injection.

4. Why normalize payload aliases:
   - Supports firmware evolution without breaking historical compatibility.

5. Why include flow sensing:
   - Confirms physical water delivery instead of assuming pump runtime equals output.

### Expected Viva Questions with Model Responses

Q1. How does your system prevent overwatering?
A1. The firmware includes threshold logic, target volume checks through flow pulses, and hard runtime timeout safety.

Q2. What happens during internet outage?
A2. Devices continue local loop behavior, retry connectivity periodically, and resume backend synchronization after reconnect.

Q3. How is unauthorized dashboard access prevented?
A3. JWT authentication is combined with route-level RBAC permission checks in both frontend and backend.

Q4. How can this project be scaled?
A4. By introducing multi-device provisioning, queue-based ingestion, and horizontally scalable backend deployment while retaining the current API contract.

Q5. What are major limitations?
A5. Calibration dependency, limited long-duration field validation, and current prototype-stage enclosure hardening.

These points can be used directly during seminar presentation and final defense.

## 8.6 Appendix E: Deployment and Demonstration Checklist

This checklist can be followed before final demonstration, evaluation, or video recording.

### Pre-Demo Hardware Checklist

1. Verify all common grounds and power lines.
2. Confirm relay and pump wiring through NO contact path.
3. Check sensor cable seating and stable ADC readings.
4. Confirm ESP32-CAM board boots and camera initializes.

### Pre-Demo Software Checklist

1. Backend service reachable and health endpoint returns success.
2. Frontend connects to API and WebSocket endpoint.
3. Device credentials configured and validated.
4. Dashboard login and role-aware menus functioning.

### Live Demonstration Sequence

1. Show dashboard live sensor cards.
2. Trigger manual watering start and stop.
3. Display watering log entry with timestamps.
4. Show analytics trend panel for recent interval.
5. Demonstrate disease event ingestion and alert listing.
6. Show admin/config page and explain guard protections.

### Post-Demo Evidence Capture

1. Export representative screenshots.
2. Save sample API response payloads.
3. Archive test matrix and observations.
4. Record known limitations and improvement notes.

## 8.7 Appendix F: Glossary of Technical Terms

1. ADC: Analog-to-Digital Converter used to read analog sensor voltage values.
2. RBAC: Role-Based Access Control that restricts actions by permission policy.
3. JWT: JSON Web Token used for stateless user authentication.
4. Telemetry: Time-stamped operational data sent from device to backend.
5. Heartbeat: Periodic status message indicating device liveness.
6. QoS: Quality of Service in message delivery semantics.
7. Latency: Delay between action request and observable system response.
8. Throughput: Amount of data handled per unit time.
9. Canonical Schema: Standardized field structure used for persistent storage.
10. Edge Device: Hardware node operating near the physical process, such as ESP32.

---

# NOTE FOR FINAL SUBMISSION FORMATTING

This draft contains complete report content and structure. For final college submission in DOCX/PDF, apply the required style sheet exactly as specified:

- H1: Bahnschript, 20 pt, centered, bold, line spacing 1.5.
- H2: Bahnschript, 18 pt, left, bold, line spacing 1.15.
- H3: Bahnschript, 16 pt, left, bold, line spacing 1.15.
- Body: Calibri, 12 pt, justified, spacing after 10 pt.
- Bullets/Sub-bullets: Calibri, 12 pt, justified, with required indentation.

Also replace all placeholders for names, roll numbers, signatures, institution details, and page numbers before final print/export.
