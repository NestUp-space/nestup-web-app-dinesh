# Business & Product Requirements Document (BRD/PRD)

## LiDAR-Driven Modular Interior Design Platform

---

# PART 1: BUSINESS REQUIREMENTS DOCUMENT (BRD)

---

## 1. Executive Summary

### 1.1 Project Overview

This document outlines the business and product requirements for extending an existing full-stack web application to support a LiDAR-driven, tablet-first, wireless modular interior design workflow. The platform will serve modular manufacturing factories and interior designers by automating the room scanning, floor plan generation, and modular component placement process.

### 1.2 Project Codename

**Project Sauron** - Automated Site Measurement & Modular Design System

### 1.3 Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Product Team | Initial draft |

---

## 2. Business Context

### 2.1 Problem Statement

**Current State:**
Interior designers and site engineers currently perform manual measurements of rooms and walls, a process that is:
- Time-consuming (2-4 hours per room)
- Error-prone (measurement mistakes lead to costly rework)
- Labor-intensive (requires skilled personnel)
- Disconnected from manufacturing (manual data transfer to factory)

**Pain Points:**

| Stakeholder | Pain Point | Impact |
|-------------|------------|--------|
| Interior Designer | Manual measurements take hours | Lost productivity, delayed projects |
| Site Engineer | Measurement errors discovered during installation | Rework costs, client dissatisfaction |
| Factory Production | Manual BOM creation from paper drawings | Delays, material waste |
| Factory Owner | Disconnected workflow from site to production | Inefficiency, reduced throughput |

### 2.2 Opportunity Statement

By automating room scanning with LiDAR technology and integrating it with a modular design platform, we can:
- Reduce room measurement time from hours to minutes
- Eliminate measurement errors through automated detection
- Create a seamless digital workflow from site to factory floor
- Enable real-time BOM and CNC code generation

### 2.3 Business Objectives

| Objective | Metric | Target | Timeline |
|-----------|--------|--------|----------|
| Reduce measurement time | Time per room | < 15 minutes | MVP |
| Improve accuracy | Measurement error rate | < 1% | MVP |
| Increase factory throughput | Projects per month | +30% | 6 months |
| Reduce rework | Installation corrections | -50% | 6 months |
| Customer acquisition | New factory customers | 5 factories | 12 months |

### 2.4 Success Criteria

**MVP Success (3 months):**
- Complete scan-to-floor-plan workflow functional
- 10 successful room scans in production environment
- Module placement and BOM generation working
- Positive feedback from 3 pilot customers

**Product Success (12 months):**
- 5 paying factory customers
- 500+ rooms scanned
- CNC code generation integrated
- Mobile app for tablets released

---

## 3. Stakeholder Analysis

### 3.1 Primary Stakeholders

#### 3.1.1 Modular Manufacturing Factory (Customer)

**Profile:**
- Medium-sized furniture/interior manufacturing companies
- 50-200 employees
- Produce modular kitchens, wardrobes, storage systems
- Serve 20-50 interior designer clients

**Needs:**
- Faster project turnaround
- Reduced material waste
- Automated BOM generation
- CNC-ready outputs
- Digital record of all projects

**Decision Criteria:**
- ROI within 6 months
- Easy integration with existing workflow
- Minimal training required
- Reliable support

#### 3.1.2 Interior Designer / Site Engineer (Primary User)

**Profile:**
- Field personnel visiting client sites
- Age: 25-45
- Tech comfort: Moderate (uses smartphones, basic apps)
- Works in challenging environments (construction sites, no power)

**Needs:**
- Quick and easy room scanning
- Works offline or with poor connectivity
- Visual confirmation of scan quality
- Ability to make on-site design decisions
- Professional outputs for client presentations

**Usage Context:**
- On-site at client locations
- Often no Wi-Fi, sometimes no power
- Uses tablet device
- Time-pressured (multiple site visits per day)

#### 3.1.3 Factory Production Team (Secondary User)

**Profile:**
- CNC operators, production managers
- Works at factory floor
- Needs precise, standardized inputs

**Needs:**
- Accurate dimensions
- Complete BOM with material specifications
- CNC-ready G-code
- Clear installation instructions

### 3.2 Stakeholder Matrix

| Stakeholder | Interest | Influence | Engagement Strategy |
|-------------|----------|-----------|---------------------|
| Factory Owner | High | High | Regular demos, ROI reports |
| Interior Designer | High | Medium | User testing, feedback sessions |
| Site Engineer | High | Medium | Training, support |
| Production Manager | Medium | Medium | Integration planning |
| CNC Operator | Low | Low | Documentation |

---

## 4. Market Analysis

### 4.1 Target Market

**Primary Market:**
- Modular furniture manufacturing factories in India
- Market size: ~5,000 factories
- Addressable market: ~500 factories (tech-ready)

**Secondary Market:**
- Interior design firms
- Architecture firms
- Real estate developers

### 4.2 Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Differentiation |
|------------|-----------|------------|---------------------|
| Manual Process | No cost, familiar | Slow, error-prone | Speed, accuracy |
| Matterport | Brand, quality | Expensive, complex | Affordable, simple |
| Magicplan | Mobile app | Limited accuracy | LiDAR precision |
| Custom Solutions | Tailored | Expensive, slow | Ready-to-use platform |

### 4.3 Value Proposition

**For Factory Owners:**
> "Transform your site measurement process from hours to minutes, eliminate costly rework, and get CNC-ready outputs automatically."

**For Interior Designers:**
> "Scan any room in minutes, design with real dimensions, and impress clients with professional 3D visualizations."

---

## 5. Business Model

### 5.1 Revenue Streams

| Stream | Model | Price Point | Timeline |
|--------|-------|-------------|----------|
| Hardware (LiDAR Kit) | One-time sale | ₹50,000-80,000 | MVP |
| Software Subscription | Monthly SaaS | ₹5,000-15,000/month | MVP |
| Per-Scan Pricing | Usage-based | ₹500-1,000/scan | Post-MVP |
| Premium Features | Add-on | Variable | Post-MVP |

### 5.2 Cost Structure

| Category | Item | Estimated Cost |
|----------|------|----------------|
| Hardware | LiDAR sensor | ₹15,000-25,000 |
| Hardware | Raspberry Pi + accessories | ₹8,000-12,000 |
| Hardware | Cellular modem | ₹3,000-5,000 |
| Hardware | Battery pack | ₹2,000-4,000 |
| Infrastructure | Cloud hosting (Railway) | ₹5,000/month |
| Infrastructure | Object storage | ₹2,000/month |
| Development | Engineering team | Ongoing |

### 5.3 Unit Economics

| Metric | Value |
|--------|-------|
| Customer Acquisition Cost (CAC) | ₹50,000 (estimated) |
| Monthly Recurring Revenue (MRR) per customer | ₹10,000 |
| Gross Margin | 70% |
| Payback Period | 5 months |
| Lifetime Value (LTV) | ₹2,40,000 (24 months) |

---

## 6. Risk Assessment

### 6.1 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption | Medium | High | Pilot program, ROI guarantee |
| Hardware reliability | Medium | High | Quality testing, warranty |
| Competition | Low | Medium | First-mover advantage, integration |
| Pricing pressure | Medium | Medium | Value-based pricing, feature differentiation |

### 6.2 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LiDAR accuracy issues | Medium | High | Calibration, quality checks |
| Connectivity failures | High | Medium | Offline mode, resumable uploads |
| Processing performance | Medium | Medium | Optimization, queue management |
| Data security | Low | High | Encryption, access controls |

### 6.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Training complexity | Medium | Medium | Simple UI, video tutorials |
| Support burden | Medium | Medium | Self-service tools, documentation |
| Hardware maintenance | Medium | Low | Modular design, spare parts |

---

## 7. Implementation Approach

### 7.1 Phased Rollout

**Phase 1: MVP (Months 1-3)**
- Core scan-to-floor-plan workflow
- Basic module placement
- BOM generation
- 3 pilot customers

**Phase 2: Enhancement (Months 4-6)**
- Advanced module library
- CNC code generation
- Mobile app improvements
- 10 customers

**Phase 3: Scale (Months 7-12)**
- Multi-factory support
- Advanced analytics
- API for integrations
- 25+ customers

### 7.2 Resource Requirements

| Role | Count | Duration | Responsibility |
|------|-------|----------|----------------|
| Backend Developer | 1 | Full-time | APIs, data pipeline |
| Frontend Developer | 1 | Full-time | Visualization, UI |
| Python/ML Engineer | 1 | Part-time | Point cloud processing |
| Product Manager | 1 | Part-time | Requirements, coordination |
| QA Engineer | 1 | Part-time | Testing |

---

# PART 2: PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

## 8. Product Overview

### 8.1 Product Vision

**Vision Statement:**
> "Empower modular manufacturing factories with an automated, LiDAR-driven platform that transforms room scanning into production-ready outputs in minutes, not hours."

### 8.2 Product Principles

1. **Simplicity First**: Any site engineer should complete a scan in < 15 minutes with minimal training
2. **Offline-Capable**: Core functionality works without constant connectivity
3. **Accuracy Matters**: Measurements must be within 1% of actual dimensions
4. **Production-Ready**: Outputs directly usable by factory systems
5. **Tablet-Native**: Designed for touch, not mouse

### 8.3 Product Scope

**In Scope (MVP):**
- LiDAR point cloud capture and transmission
- Automated wall and edge detection
- 2D floor plan generation
- 3D room visualization
- Modular component placement
- BOM generation
- Session management

**Out of Scope (MVP):**
- CNC G-code generation
- Multi-room/multi-floor support
- AR/VR visualization
- Customer-facing portal
- Inventory management integration

---

## 9. User Personas

### 9.1 Persona 1: Rajesh - Site Engineer

**Demographics:**
- Age: 32
- Location: Mumbai, India
- Education: Diploma in Interior Design
- Experience: 5 years

**Role:**
- Visits 3-5 client sites daily
- Takes measurements for kitchen/wardrobe installations
- Reports to interior designer and factory

**Goals:**
- Complete measurements quickly and accurately
- Avoid return visits due to missed measurements
- Look professional in front of clients

**Frustrations:**
- Manual measurements take too long
- Difficult to measure in cluttered rooms
- Paper notes get lost or damaged
- Clients get impatient

**Technology:**
- Comfortable with smartphone apps
- Uses WhatsApp for communication
- Has used basic CAD software
- Owns an Android tablet (company-provided)

**Quote:**
> "I visit 4-5 sites every day. If I could cut measurement time in half, I could take on more projects or actually have lunch."

### 9.2 Persona 2: Priya - Interior Designer

**Demographics:**
- Age: 38
- Location: Bangalore, India
- Education: B.Arch
- Experience: 12 years, owns design firm

**Role:**
- Manages team of 5 site engineers
- Creates designs based on measurements
- Coordinates with factories

**Goals:**
- Reduce project turnaround time
- Minimize errors and rework
- Impress clients with visualizations
- Scale business without proportional staff increase

**Frustrations:**
- Measurement errors discovered during installation
- Back-and-forth with factory on dimensions
- Difficulty visualizing designs for clients
- Manual BOM creation is tedious

**Technology:**
- Expert in AutoCAD, SketchUp
- Uses project management tools
- Active on social media
- Comfortable with new technology

**Quote:**
> "Every measurement error costs me money and reputation. I need foolproof data from site to factory."

### 9.3 Persona 3: Mohan - Factory Production Manager

**Demographics:**
- Age: 45
- Location: Chennai, India
- Education: B.Tech Mechanical
- Experience: 20 years in manufacturing

**Role:**
- Manages factory production schedule
- Oversees CNC operations
- Ensures quality and timelines

**Goals:**
- Receive accurate, complete specifications
- Minimize production delays
- Reduce material waste
- Maintain quality standards

**Frustrations:**
- Incomplete or unclear drawings
- Dimension discrepancies
- Last-minute design changes
- Manual data entry into CNC systems

**Technology:**
- Expert in CNC programming
- Uses ERP systems
- Prefers standardized inputs
- Resistant to frequent changes

**Quote:**
> "Give me correct dimensions once, and I'll deliver perfect output. It's the back-and-forth that kills productivity."

---

## 10. User Journey Maps

### 10.1 Primary User Journey: Room Scanning & Module Placement

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SITE ENGINEER USER JOURNEY                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  PHASE 1: PREPARATION                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  Arrive  │───▶│  Power   │───▶│  Open    │───▶│  Create  │                      │
│  │  at Site │    │  LiDAR   │    │  App     │    │  Session │                      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                      │
│                                                                                     │
│  PHASE 2: SCANNING                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  Start   │───▶│  Walk    │───▶│  View    │───▶│  Confirm │                      │
│  │  Scan    │    │  Room    │    │  Preview │    │  Complete│                      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                      │
│                                                                                     │
│  PHASE 3: PROCESSING (AUTOMATIC)                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  Upload  │───▶│  Process │───▶│  Detect  │───▶│  Generate│                      │
│  │  Data    │    │  Cloud   │    │  Walls   │    │  Floor   │                      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                      │
│                                                                                     │
│  PHASE 4: DESIGN                                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  View    │───▶│  Select  │───▶│  Place   │───▶│  Adjust  │                      │
│  │  3D Room │    │  Module  │    │  on Wall │    │  Position│                      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                      │
│                                                                                     │
│  PHASE 5: OUTPUT                                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  Review  │───▶│  Generate│───▶│  Export  │───▶│  Share   │                      │
│  │  Design  │    │  BOM     │    │  Files   │    │  Factory │                      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Journey Stage Details

| Stage | User Action | System Response | Success Metric |
|-------|-------------|-----------------|----------------|
| Arrive at Site | Engineer reaches client location | - | - |
| Power LiDAR | Press power button | LED indicates ready | < 30 seconds boot |
| Open App | Launch tablet app | App connects to LiDAR | < 5 seconds connect |
| Create Session | Tap "New Scan" | Session created with ID | Instant |
| Start Scan | Tap "Start" | LiDAR begins capture | Immediate feedback |
| Walk Room | Move LiDAR around room | Real-time point cloud preview | Coverage indicator |
| View Preview | Check captured data | 3D preview displayed | Quality score shown |
| Confirm Complete | Tap "Complete Scan" | Upload initiated | Progress indicator |
| Upload Data | Wait for upload | Chunked upload with resume | < 2 min for typical room |
| Process Cloud | Automatic | Processing status shown | < 3 min processing |
| Detect Walls | Automatic | Walls highlighted | Accuracy > 99% |
| Generate Floor Plan | Automatic | 2D plan displayed | Correct room shape |
| View 3D Room | Interact with 3D view | Orbit, zoom, pan | Smooth 30+ FPS |
| Select Module | Browse module library | Module templates shown | < 3 taps to select |
| Place on Wall | Drag module to wall | Snaps to wall surface | Accurate placement |
| Adjust Position | Drag/resize module | Real-time update | Sub-cm precision |
| Review Design | Check all placements | Summary view | Clear visualization |
| Generate BOM | Tap "Generate BOM" | BOM calculated | Complete materials list |
| Export Files | Select export format | Files generated | PDF, JSON, Excel |
| Share Factory | Send to factory | Notification sent | Delivery confirmed |

---

## 11. Functional Requirements

### 11.1 Feature Categories

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FEATURE HIERARCHY                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        F1: SESSION MANAGEMENT                               │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │  Create   │  │  Resume   │  │  List     │  │  Delete   │                │   │
│  │  │  Session  │  │  Session  │  │  Sessions │  │  Session  │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        F2: DATA CAPTURE                                     │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │  LiDAR    │  │  Point    │  │  Chunked  │  │  Upload   │                │   │
│  │  │  Connect  │  │  Cloud    │  │  Upload   │  │  Resume   │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        F3: POINT CLOUD PROCESSING                           │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │  Noise    │  │  Wall     │  │  Edge     │  │  Floor    │                │   │
│  │  │  Removal  │  │  Detect   │  │  Detect   │  │  Plan Gen │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        F4: VISUALIZATION                                    │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │  3D Room  │  │  2D Floor │  │  Wall     │  │  Module   │                │   │
│  │  │  View     │  │  Plan     │  │  Elevation│  │  Preview  │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        F5: MODULE PLACEMENT                                 │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │  Module   │  │  Drag &   │  │  Snap to  │  │  Collision│                │   │
│  │  │  Library  │  │  Drop     │  │  Wall     │  │  Detect   │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        F6: OUTPUT GENERATION                                │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │  BOM      │  │  Dimension│  │  PDF      │  │  JSON     │                │   │
│  │  │  Generate │  │  Report   │  │  Export   │  │  Export   │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Feature Specifications

#### F1: Session Management

**F1.1 Create Session**

| Attribute | Specification |
|-----------|---------------|
| ID | F1.1 |
| Name | Create New Scan Session |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to create a new scan session so that I can start capturing room data |

**Acceptance Criteria:**
- [ ] User can create session with single tap
- [ ] Session assigned unique UUID
- [ ] Session metadata includes: timestamp, device ID, location (optional)
- [ ] Session appears in session list immediately
- [ ] Works offline (syncs when connected)

**Technical Requirements:**
```
API: POST /api/sessions
Request Body: {
  device_id: string,
  location?: { lat: number, lng: number },
  metadata?: object
}
Response: {
  session_id: string (UUID),
  created_at: timestamp,
  status: "created"
}
```

**F1.2 Resume Session**

| Attribute | Specification |
|-----------|---------------|
| ID | F1.2 |
| Name | Resume Incomplete Session |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to resume an incomplete session so that I don't lose work if the app closes |

**Acceptance Criteria:**
- [ ] User sees list of incomplete sessions
- [ ] Tapping session resumes at last state
- [ ] All previously captured data is preserved
- [ ] Upload resumes from last successful chunk
- [ ] Processing state is restored

**F1.3 List Sessions**

| Attribute | Specification |
|-----------|---------------|
| ID | F1.3 |
| Name | View All Sessions |
| Priority | P1 (Should Have) |
| User Story | As a site engineer, I want to see all my sessions so that I can track my work |

**Acceptance Criteria:**
- [ ] Sessions listed in reverse chronological order
- [ ] Each session shows: date, status, thumbnail
- [ ] Filter by: status, date range
- [ ] Search by session ID or metadata
- [ ] Pagination for large lists

**F1.4 Delete Session**

| Attribute | Specification |
|-----------|---------------|
| ID | F1.4 |
| Name | Delete Session |
| Priority | P2 (Nice to Have) |
| User Story | As a site engineer, I want to delete unwanted sessions so that I can keep my workspace clean |

**Acceptance Criteria:**
- [ ] User can delete session with confirmation
- [ ] Deleted session moves to trash (30-day retention)
- [ ] Associated files are marked for deletion
- [ ] Cannot delete session in active use

---

#### F2: Data Capture

**F2.1 LiDAR Connection**

| Attribute | Specification |
|-----------|---------------|
| ID | F2.1 |
| Name | Connect to LiDAR Device |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to connect my tablet to the LiDAR so that I can start scanning |

**Acceptance Criteria:**
- [ ] App auto-discovers LiDAR on same network
- [ ] Manual IP entry as fallback
- [ ] Connection status clearly indicated
- [ ] Auto-reconnect on connection loss
- [ ] Battery level displayed

**Connection Methods:**
1. **Primary**: LiDAR creates WiFi hotspot → Tablet connects
2. **Secondary**: Both on same cellular network
3. **Fallback**: Direct Ethernet (via adapter)

**F2.2 Point Cloud Capture**

| Attribute | Specification |
|-----------|---------------|
| ID | F2.2 |
| Name | Capture Point Cloud Data |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to capture the room's point cloud so that I can generate a floor plan |

**Acceptance Criteria:**
- [ ] Real-time preview of captured points
- [ ] Coverage indicator shows scanned vs. unscanned areas
- [ ] Quality score indicates scan completeness
- [ ] User can pause and resume capture
- [ ] Capture auto-stops when coverage threshold met

**Technical Specifications:**
```
Point Cloud Format:
- Points: X, Y, Z (float32)
- Intensity: uint16
- Color (optional): R, G, B (uint8)
- Timestamp: uint64

Expected Data:
- Points per second: 64,000
- Typical room scan: 500K - 2M points
- File size: 10-50 MB per room
```

**F2.3 Chunked Upload**

| Attribute | Specification |
|-----------|---------------|
| ID | F2.3 |
| Name | Upload Point Cloud in Chunks |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want uploads to work reliably on poor networks so that I don't lose captured data |

**Acceptance Criteria:**
- [ ] Large files split into 1MB chunks
- [ ] Each chunk acknowledged before next sent
- [ ] Failed chunks automatically retried
- [ ] Progress shown to user
- [ ] Upload can be paused and resumed

**Technical Requirements:**
```
API: POST /api/sessions/:id/pointcloud/chunk
Request Body: {
  chunk_index: number,
  total_chunks: number,
  data: base64 string,
  checksum: string (MD5)
}
Response: {
  received: boolean,
  next_expected_chunk: number
}

API: POST /api/sessions/:id/pointcloud/complete
Request Body: {
  total_chunks: number,
  total_size: number,
  checksum: string (MD5 of complete file)
}
Response: {
  status: "uploaded" | "checksum_mismatch",
  file_url: string
}
```

**F2.4 Upload Resume**

| Attribute | Specification |
|-----------|---------------|
| ID | F2.4 |
| Name | Resume Interrupted Upload |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want uploads to resume from where they stopped so that I don't waste time and data |

**Acceptance Criteria:**
- [ ] App queries server for last received chunk
- [ ] Upload resumes from next chunk
- [ ] No duplicate data transmitted
- [ ] Works across app restarts
- [ ] Works across device restarts

---

#### F3: Point Cloud Processing

**F3.1 Noise Removal**

| Attribute | Specification |
|-----------|---------------|
| ID | F3.1 |
| Name | Remove Noise from Point Cloud |
| Priority | P0 (Must Have) |
| User Story | As the system, I want to remove noise from the point cloud so that wall detection is accurate |

**Processing Steps:**
1. Statistical outlier removal (neighbors=30, std_ratio=2.0)
2. Voxel downsampling (5mm voxel size)
3. Radius outlier removal (radius=0.05m, min_neighbors=10)

**Performance Requirements:**
- Process 1M points in < 30 seconds
- Reduce point count by 40-60%
- Preserve wall features

**F3.2 Wall Detection**

| Attribute | Specification |
|-----------|---------------|
| ID | F3.2 |
| Name | Detect Wall Surfaces |
| Priority | P0 (Must Have) |
| User Story | As the system, I want to detect all walls so that I can generate a floor plan |

**Algorithm:**
1. RANSAC plane detection (threshold=2cm, iterations=1000)
2. Filter planes by orientation (vertical ±10°)
3. Cluster nearby parallel planes
4. Extract wall boundaries
5. Compute wall dimensions

**Output:**
```json
{
  "walls": [
    {
      "id": "wall_1",
      "plane_equation": [a, b, c, d],
      "normal": [nx, ny, nz],
      "boundary_points": [[x1,y1], [x2,y2], ...],
      "width": 3.5,
      "height": 2.8,
      "area": 9.8
    }
  ]
}
```

**F3.3 Edge Detection**

| Attribute | Specification |
|-----------|---------------|
| ID | F3.3 |
| Name | Detect Wall Edges and Features |
| Priority | P0 (Must Have) |
| User Story | As the system, I want to detect edges and features so that wall boundaries are accurate |

**Detected Features:**
- Wall-to-wall corners
- Wall-to-floor edges
- Wall-to-ceiling edges
- Window openings
- Door openings
- Protrusions (switchboards, boxes)

**F3.4 Floor Plan Generation**

| Attribute | Specification |
|-----------|---------------|
| ID | F3.4 |
| Name | Generate 2D Floor Plan |
| Priority | P0 (Must Have) |
| User Story | As the system, I want to generate a 2D floor plan from detected walls |

**Output:**
```json
{
  "floor_plan": {
    "boundary": [[x1,y1], [x2,y2], ...],
    "area": 25.5,
    "walls": [
      {
        "id": "wall_1",
        "start": [0, 0],
        "end": [3.5, 0],
        "length": 3.5,
        "features": [
          {
            "type": "window",
            "position": [1.2, 1.0],
            "dimensions": [1.5, 1.2]
          }
        ]
      }
    ],
    "dimensions": {
      "width": 5.0,
      "depth": 4.5
    }
  }
}
```

---

#### F4: Visualization

**F4.1 3D Room View**

| Attribute | Specification |
|-----------|---------------|
| ID | F4.1 |
| Name | Interactive 3D Room Visualization |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to see the room in 3D so that I can verify the scan and place modules |

**Acceptance Criteria:**
- [ ] Room rendered with walls, floor, ceiling
- [ ] Orbit: rotate view around room center
- [ ] Pan: move view left/right/up/down
- [ ] Zoom: move closer/farther
- [ ] Touch controls optimized for tablet
- [ ] Minimum 30 FPS on target devices
- [ ] Walls color-coded or textured

**Technical Requirements:**
```
Rendering Engine: Three.js
Target Devices: iPad (2020+), Android tablets (mid-range+)
Polygon Budget: < 100K triangles
Texture Budget: < 50MB
```

**F4.2 2D Floor Plan View**

| Attribute | Specification |
|-----------|---------------|
| ID | F4.2 |
| Name | 2D Floor Plan Visualization |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to see a 2D floor plan so that I can understand room layout quickly |

**Acceptance Criteria:**
- [ ] Top-down view of room
- [ ] Walls shown as lines with thickness
- [ ] Dimensions displayed on walls
- [ ] Features (doors, windows) indicated
- [ ] Pan and zoom controls
- [ ] Scale indicator shown
- [ ] North arrow (optional)

**F4.3 View Toggle**

| Attribute | Specification |
|-----------|---------------|
| ID | F4.3 |
| Name | Toggle Between 3D and 2D Views |
| Priority | P1 (Should Have) |
| User Story | As a site engineer, I want to switch between 3D and 2D views so that I can work efficiently |

**Acceptance Criteria:**
- [ ] Single button toggles view
- [ ] Smooth transition animation
- [ ] Camera position preserved where possible
- [ ] Module selections preserved

---

#### F5: Module Placement

**F5.1 Module Library**

| Attribute | Specification |
|-----------|---------------|
| ID | F5.1 |
| Name | Browse Module Templates |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to browse available modules so that I can select the right one for the design |

**Module Categories:**
1. **Storage**
   - Wall cabinet
   - Base cabinet
   - Tall cabinet
   - Shelf unit
   
2. **Kitchen**
   - Sink unit
   - Stove unit
   - Chimney
   - Refrigerator space
   
3. **Wardrobe**
   - Hanging section
   - Drawer unit
   - Shelf section
   - Shoe rack

**Module Template Structure:**
```json
{
  "id": "wall_cabinet_standard",
  "name": "Wall Cabinet - Standard",
  "category": "storage",
  "default_dimensions": {
    "width": 600,
    "height": 720,
    "depth": 350
  },
  "constraints": {
    "min_width": 300,
    "max_width": 1200,
    "min_height": 400,
    "max_height": 900,
    "min_depth": 250,
    "max_depth": 400
  },
  "parameters": {
    "material_thickness": 18,
    "back_panel_thickness": 6,
    "shelf_count": 2,
    "door_type": "single"
  },
  "placement_rules": {
    "allowed_surfaces": ["wall"],
    "min_height_from_floor": 1400,
    "max_height_from_floor": 2200
  },
  "thumbnail": "url_to_image",
  "3d_model": "url_to_glb"
}
```

**F5.2 Drag and Drop Placement**

| Attribute | Specification |
|-----------|---------------|
| ID | F5.2 |
| Name | Place Modules by Drag and Drop |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want to drag modules onto walls so that I can design the room layout |

**Acceptance Criteria:**
- [ ] Select module from library
- [ ] Drag onto 3D view
- [ ] Module follows finger/cursor
- [ ] Visual feedback when over valid surface
- [ ] Drop places module
- [ ] Undo available after placement

**F5.3 Snap to Wall**

| Attribute | Specification |
|-----------|---------------|
| ID | F5.3 |
| Name | Modules Snap to Wall Surfaces |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want modules to snap to walls so that placement is accurate |

**Acceptance Criteria:**
- [ ] Modules automatically align to wall plane
- [ ] Snap to wall edges (left, right)
- [ ] Snap to other modules
- [ ] Snap indicators shown
- [ ] Snap can be disabled temporarily

**F5.4 Collision Detection**

| Attribute | Specification |
|-----------|---------------|
| ID | F5.4 |
| Name | Prevent Module Overlap |
| Priority | P0 (Must Have) |
| User Story | As a site engineer, I want the system to prevent overlapping modules so that designs are valid |

**Acceptance Criteria:**
- [ ] Modules cannot overlap other modules
- [ ] Modules cannot extend beyond wall boundaries
- [ ] Visual indicator when collision detected
- [ ] Module pushed to valid position
- [ ] Warning if placement is invalid

**F5.5 Module Configuration**

| Attribute | Specification |
|-----------|---------------|
| ID | F5.5 |
| Name | Configure Module Parameters |
| Priority | P1 (Should Have) |
| User Story | As a site engineer, I want to configure module dimensions and options so that they fit the space |

**Configurable Parameters:**
- Width, Height, Depth
- Material thickness
- Number of shelves
- Door type (single, double, sliding)
- Handle type
- Color/finish

**UI Requirements:**
- Inline editing on selection
- Number inputs with increment/decrement
- Dropdown for predefined options
- Real-time 3D preview update

---

#### F6: Output Generation

**F6.1 BOM Generation**

| Attribute | Specification |
|-----------|---------------|
| ID | F6.1 |
| Name | Generate Bill of Materials |
| Priority | P0 (Must Have) |
| User Story | As a factory manager, I want a complete BOM so that I can procure materials |

**BOM Contents:**
```json
{
  "bom": {
    "session_id": "uuid",
    "generated_at": "timestamp",
    "summary": {
      "total_modules": 8,
      "total_area_sqm": 12.5,
      "total_plywood_sheets": 4,
      "total_hardware_items": 156
    },
    "materials": [
      {
        "category": "plywood",
        "specification": "18mm BWR Grade",
        "quantity": 4,
        "unit": "sheets",
        "dimensions": "8x4 ft"
      },
      {
        "category": "hardware",
        "specification": "Soft-close hinge",
        "quantity": 24,
        "unit": "pairs"
      }
    ],
    "cut_list": [
      {
        "module_id": "cabinet_1",
        "part": "side_panel",
        "quantity": 2,
        "dimensions": {
          "length": 720,
          "width": 350,
          "thickness": 18
        },
        "material": "18mm BWR Plywood",
        "edge_banding": ["front", "top"]
      }
    ]
  }
}
```

**F6.2 Dimension Report**

| Attribute | Specification |
|-----------|---------------|
| ID | F6.2 |
| Name | Generate Dimension Report |
| Priority | P1 (Should Have) |
| User Story | As a site engineer, I want a dimension report so that I can verify measurements |

**Report Contents:**
- Room dimensions (L x W x H)
- Each wall with length and height
- Feature locations (windows, doors)
- Module placement coordinates
- Clearances and gaps

**F6.3 PDF Export**

| Attribute | Specification |
|-----------|---------------|
| ID | F6.3 |
| Name | Export to PDF |
| Priority | P1 (Should Have) |
| User Story | As a site engineer, I want to export a PDF so that I can share with clients |

**PDF Contents:**
- Cover page with project details
- 2D floor plan with dimensions
- 3D visualization renders
- Module list with specifications
- BOM summary

**F6.4 JSON/Excel Export**

| Attribute | Specification |
|-----------|---------------|
| ID | F6.4 |
| Name | Export Data to JSON/Excel |
| Priority | P1 (Should Have) |
| User Story | As a factory manager, I want data in Excel so that I can import into our systems |

---

## 12. Non-Functional Requirements

### 12.1 Performance Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| Page Load Time | < 3 seconds on 4G | P0 |
| 3D Rendering FPS | ≥ 30 FPS | P0 |
| Point Cloud Processing | < 3 minutes for typical room | P0 |
| Upload Speed | Maximize available bandwidth | P0 |
| API Response Time | < 500ms for metadata, < 2s for processing status | P1 |

### 12.2 Reliability Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| System Uptime | 99.5% (excluding planned maintenance) | P0 |
| Data Durability | No data loss after confirmed upload | P0 |
| Error Recovery | Automatic retry with exponential backoff | P0 |
| Session Recovery | Resume from any interruption point | P0 |

### 12.3 Scalability Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| Concurrent Users | 50 simultaneous users | P1 |
| Storage | 100GB initial, scalable to 1TB | P1 |
| Processing Queue | Handle 20 concurrent jobs | P1 |

### 12.4 Security Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| Data Encryption | TLS 1.3 in transit, AES-256 at rest | P0 |
| Authentication | JWT with refresh tokens | P0 |
| Authorization | Role-based access control | P1 |
| Data Isolation | Sessions isolated by user/organization | P0 |

### 12.5 Usability Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| Learning Curve | Complete first scan in < 30 minutes with tutorial | P0 |
| Touch Targets | Minimum 44x44 pixels | P0 |
| Offline Capability | Core capture works without internet | P0 |
| Error Messages | Clear, actionable error messages | P0 |
| Accessibility | WCAG 2.1 Level A compliance | P2 |

### 12.6 Compatibility Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| Browsers | Chrome 90+, Safari 14+, Edge 90+ | P0 |
| Tablets | iPad (2020+), Android 10+ tablets | P0 |
| Screen Sizes | 768px - 1366px width | P0 |
| Orientation | Landscape primary, portrait supported | P1 |

---

## 13. Data Requirements

### 13.1 Data Model

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA MODEL DIAGRAM                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       │
│  │      USER       │         │     SESSION     │         │    POINT_CLOUD  │       │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤       │
│  │ id (PK)         │───┐     │ id (PK)         │───┐     │ id (PK)         │       │
│  │ email           │   │     │ user_id (FK)    │   │     │ session_id (FK) │       │
│  │ name            │   │     │ status          │   │     │ file_url        │       │
│  │ organization_id │   │     │ created_at      │   │     │ file_size       │       │
│  │ created_at      │   │     │ updated_at      │   │     │ point_count     │       │
│  └─────────────────┘   │     │ metadata        │   │     │ format          │       │
│                        │     └─────────────────┘   │     │ upload_status   │       │
│                        │              │            │     │ created_at      │       │
│                        └──────────────┘            │     └─────────────────┘       │
│                                       │            │              │                │
│                                       │            └──────────────┘                │
│                                       │                                            │
│                                       ▼                                            │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       │
│  │  PROCESSED_DATA │         │      WALL       │         │     FEATURE     │       │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤       │
│  │ id (PK)         │         │ id (PK)         │         │ id (PK)         │       │
│  │ session_id (FK) │         │ session_id (FK) │         │ wall_id (FK)    │       │
│  │ floor_plan      │         │ plane_equation  │         │ type            │       │
│  │ room_dimensions │         │ width           │         │ position        │       │
│  │ processing_time │         │ height          │         │ dimensions      │       │
│  │ created_at      │         │ boundary_points │         │ metadata        │       │
│  └─────────────────┘         │ normal_vector   │         └─────────────────┘       │
│                              └─────────────────┘                                   │
│                                       │                                            │
│                                       ▼                                            │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       │
│  │     MODULE      │         │  MODULE_TEMPLATE│         │       BOM       │       │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤       │
│  │ id (PK)         │         │ id (PK)         │         │ id (PK)         │       │
│  │ session_id (FK) │         │ name            │         │ session_id (FK) │       │
│  │ template_id (FK)│◄────────│ category        │         │ materials       │       │
│  │ wall_id (FK)    │         │ default_dims    │         │ cut_list        │       │
│  │ position        │         │ constraints     │         │ hardware        │       │
│  │ dimensions      │         │ parameters      │         │ generated_at    │       │
│  │ parameters      │         │ 3d_model_url    │         └─────────────────┘       │
│  │ created_at      │         └─────────────────┘                                   │
│  └─────────────────┘                                                               │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    -- Status: created, uploading, processing, processed, designing, completed
    device_id VARCHAR(100),
    location JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point clouds table
CREATE TABLE point_clouds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    file_url VARCHAR(500),
    file_size BIGINT,
    point_count INTEGER,
    format VARCHAR(20) DEFAULT 'ply',
    upload_status VARCHAR(20) DEFAULT 'pending',
    -- Status: pending, uploading, uploaded, failed
    chunks_received INTEGER DEFAULT 0,
    total_chunks INTEGER,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed data table
CREATE TABLE processed_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    floor_plan JSONB,
    room_dimensions JSONB,
    wall_count INTEGER,
    processing_status VARCHAR(20) DEFAULT 'pending',
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Walls table
CREATE TABLE walls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    wall_index INTEGER NOT NULL,
    plane_equation FLOAT8[4],
    normal_vector FLOAT8[3],
    width FLOAT8,
    height FLOAT8,
    area FLOAT8,
    boundary_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features table (windows, doors, etc.)
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wall_id UUID NOT NULL REFERENCES walls(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    position JSONB NOT NULL,
    dimensions JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module templates table
CREATE TABLE module_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    default_dimensions JSONB NOT NULL,
    constraints JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    placement_rules JSONB DEFAULT '{}',
    thumbnail_url VARCHAR(500),
    model_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Placed modules table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES module_templates(id),
    wall_id UUID REFERENCES walls(id),
    position JSONB NOT NULL,
    dimensions JSONB NOT NULL,
    rotation FLOAT8 DEFAULT 0,
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BOM table
CREATE TABLE boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    materials JSONB NOT NULL,
    cut_list JSONB NOT NULL,
    hardware JSONB NOT NULL,
    summary JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_point_clouds_session_id ON point_clouds(session_id);
CREATE INDEX idx_walls_session_id ON walls(session_id);
CREATE INDEX idx_modules_session_id ON modules(session_id);
CREATE INDEX idx_features_wall_id ON features(wall_id);
```

### 13.3 File Storage Structure

```
object-storage/
├── point-clouds/
│   ├── raw/
│   │   └── {session_id}/
│   │       ├── scan.ply
│   │       └── metadata.json
│   └── processed/
│       └── {session_id}/
│           ├── cleaned.ply
│           └── downsampled.ply
├── exports/
│   └── {session_id}/
│       ├── floor_plan.pdf
│       ├── bom.xlsx
│       └── design.json
└── models/
    └── templates/
        ├── wall_cabinet.glb
        ├── base_cabinet.glb
        └── ...
```

---

## 14. API Specifications

### 14.1 API Overview

```
Base URL: https://api.projectsauron.com/v1

Authentication: Bearer token (JWT)

Content-Type: application/json (unless file upload)

Rate Limits:
- Standard endpoints: 100 requests/minute
- Upload endpoints: 10 requests/minute
- Processing endpoints: 5 requests/minute
```

### 14.2 Session APIs

#### Create Session
```
POST /sessions

Request:
{
  "device_id": "string",
  "location": {
    "lat": number,
    "lng": number
  },
  "metadata": {
    "project_name": "string",
    "client_name": "string"
  }
}

Response (201):
{
  "id": "uuid",
  "status": "created",
  "created_at": "timestamp",
  "upload_url": "presigned_url_for_upload"
}
```

#### Get Session
```
GET /sessions/:id

Response (200):
{
  "id": "uuid",
  "status": "processing",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "point_cloud": {
    "status": "uploaded",
    "point_count": 1500000
  },
  "processed_data": {
    "status": "completed",
    "wall_count": 4,
    "room_dimensions": {
      "width": 5.2,
      "depth": 4.1,
      "height": 2.8
    }
  },
  "modules": [...]
}
```

#### List Sessions
```
GET /sessions?status=completed&limit=20&offset=0

Response (200):
{
  "sessions": [...],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

### 14.3 Upload APIs

#### Initialize Chunked Upload
```
POST /sessions/:id/pointcloud/init

Request:
{
  "file_name": "scan.ply",
  "file_size": 25000000,
  "chunk_size": 1048576,
  "total_chunks": 24,
  "checksum": "md5_hash"
}

Response (200):
{
  "upload_id": "uuid",
  "chunk_urls": ["presigned_url_1", "presigned_url_2", ...]
}
```

#### Upload Chunk
```
PUT /sessions/:id/pointcloud/chunk/:chunk_index

Headers:
  Content-Type: application/octet-stream
  X-Chunk-Checksum: md5_of_chunk

Body: binary chunk data

Response (200):
{
  "chunk_index": 5,
  "received": true,
  "chunks_remaining": 19
}
```

#### Complete Upload
```
POST /sessions/:id/pointcloud/complete

Request:
{
  "upload_id": "uuid",
  "total_chunks": 24,
  "checksum": "md5_of_complete_file"
}

Response (200):
{
  "status": "uploaded",
  "file_url": "url",
  "point_count": 1500000
}
```

#### Resume Upload
```
GET /sessions/:id/pointcloud/status

Response (200):
{
  "upload_id": "uuid",
  "status": "uploading",
  "chunks_received": [0, 1, 2, 3, 5],
  "chunks_missing": [4, 6, 7, ...],
  "next_chunk": 4
}
```

### 14.4 Processing APIs

#### Trigger Processing
```
POST /sessions/:id/process

Request:
{
  "options": {
    "noise_removal": true,
    "wall_detection": true,
    "floor_plan_generation": true
  }
}

Response (202):
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_time_seconds": 180
}
```

#### Get Processing Status
```
GET /sessions/:id/process/status

Response (200):
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 65,
  "current_step": "wall_detection",
  "steps_completed": ["noise_removal"],
  "steps_remaining": ["floor_plan_generation"]
}
```

#### Get Layout Data
```
GET /sessions/:id/layout

Response (200):
{
  "floor_plan": {
    "boundary": [[x,y], ...],
    "area": 21.32
  },
  "walls": [
    {
      "id": "wall_1",
      "start": [0, 0],
      "end": [5.2, 0],
      "length": 5.2,
      "height": 2.8,
      "features": [...]
    }
  ],
  "room_dimensions": {
    "width": 5.2,
    "depth": 4.1,
    "height": 2.8
  }
}
```

### 14.5 Module APIs

#### List Module Templates
```
GET /modules/templates?category=storage

Response (200):
{
  "templates": [
    {
      "id": "uuid",
      "name": "Wall Cabinet - Standard",
      "category": "storage",
      "thumbnail_url": "url",
      "default_dimensions": {...}
    }
  ]
}
```

#### Place Module
```
POST /sessions/:id/modules

Request:
{
  "template_id": "uuid",
  "wall_id": "uuid",
  "position": {
    "x": 1.2,
    "y": 1.4,
    "z": 0
  },
  "dimensions": {
    "width": 0.6,
    "height": 0.72,
    "depth": 0.35
  },
  "rotation": 0,
  "parameters": {
    "shelf_count": 2,
    "door_type": "single"
  }
}

Response (201):
{
  "id": "uuid",
  "template_id": "uuid",
  "wall_id": "uuid",
  "position": {...},
  "dimensions": {...},
  "created_at": "timestamp"
}
```

#### Update Module
```
PUT /sessions/:id/modules/:module_id

Request:
{
  "position": {...},
  "dimensions": {...},
  "parameters": {...}
}

Response (200):
{
  "id": "uuid",
  "updated_at": "timestamp",
  ...
}
```

#### Delete Module
```
DELETE /sessions/:id/modules/:module_id

Response (204)
```

### 14.6 Export APIs

#### Generate BOM
```
POST /sessions/:id/bom/generate

Response (202):
{
  "job_id": "uuid",
  "status": "generating"
}
```

#### Get BOM
```
GET /sessions/:id/bom

Response (200):
{
  "id": "uuid",
  "generated_at": "timestamp",
  "summary": {...},
  "materials": [...],
  "cut_list": [...],
  "hardware": [...]
}
```

#### Export to PDF
```
POST /sessions/:id/export/pdf

Request:
{
  "include": ["floor_plan", "3d_views", "bom", "dimensions"]
}

Response (202):
{
  "job_id": "uuid",
  "status": "generating"
}
```

#### Get Export
```
GET /sessions/:id/export/:job_id

Response (200):
{
  "status": "completed",
  "download_url": "presigned_url",
  "expires_at": "timestamp"
}
```

---

## 15. UI/UX Requirements

### 15.1 Design Principles

1. **Tablet-First**: Primary design target is 10-12" tablets in landscape
2. **Touch-Optimized**: Large touch targets, gesture support
3. **Progressive Disclosure**: Show essential controls first, advanced options on demand
4. **Visual Feedback**: Every action has immediate visual response
5. **Error Prevention**: Guide users away from mistakes before they happen

### 15.2 Screen Inventory

| Screen | Priority | Description |
|--------|----------|-------------|
| Dashboard | P0 | Session list, quick actions |
| New Scan | P0 | LiDAR connection, capture flow |
| Processing | P0 | Progress indicator, status |
| 3D Viewer | P0 | Room visualization, module placement |
| 2D Floor Plan | P0 | Top-down view with dimensions |
| Module Library | P0 | Browse and select modules |
| Module Config | P1 | Configure module parameters |
| BOM View | P1 | View and export BOM |
| Export | P1 | Generate and download exports |
| Settings | P2 | App and account settings |

### 15.3 Wireframes

#### Dashboard Screen
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  🏠 Project Sauron                                    [User] [Settings]     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                             │   │
│  │    [+ NEW SCAN]                                    🔍 Search sessions       │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Recent Sessions                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │                  │
│  │  │            │  │  │  │            │  │  │  │            │  │                  │
│  │  │  Thumbnail │  │  │  │  Thumbnail │  │  │  │  Thumbnail │  │                  │
│  │  │            │  │  │  │            │  │  │  │            │  │                  │
│  │  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │                  │
│  │  Kitchen Scan    │  │  Bedroom - Mr X  │  │  Office Room    │                  │
│  │  Jan 12, 2026    │  │  Jan 11, 2026    │  │  Jan 10, 2026   │                  │
│  │  ● Completed     │  │  ○ In Progress   │  │  ● Completed    │                  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                  │
│                                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                  │
│  │       ...        │  │       ...        │  │       ...        │                  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3D Viewer Screen
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ← Back    Kitchen Scan - Jan 12, 2026                    [2D] [3D] [Save] │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌────────────────────────────────────────────────────────┐  ┌─────────────────┐   │
│  │                                                        │  │  MODULE LIBRARY │   │
│  │                                                        │  │                 │   │
│  │                                                        │  │  ┌───────────┐  │   │
│  │                                                        │  │  │ Wall      │  │   │
│  │                    3D ROOM VIEW                        │  │  │ Cabinet   │  │   │
│  │                                                        │  │  └───────────┘  │   │
│  │                  ┌─────────────────┐                   │  │                 │   │
│  │                  │                 │                   │  │  ┌───────────┐  │   │
│  │                  │    CABINET      │                   │  │  │ Base      │  │   │
│  │                  │                 │                   │  │  │ Cabinet   │  │   │
│  │                  └─────────────────┘                   │  │  └───────────┘  │   │
│  │                                                        │  │                 │   │
│  │            ╔═══════════════════════════╗               │  │  ┌───────────┐  │   │
│  │            ║                           ║               │  │  │ Tall      │  │   │
│  │            ║         FLOOR             ║               │  │  │ Cabinet   │  │   │
│  │            ║                           ║               │  │  └───────────┘  │   │
│  │            ╚═══════════════════════════╝               │  │                 │   │
│  │                                                        │  │  [+ More...]   │   │
│  └────────────────────────────────────────────────────────┘  └─────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  [Orbit] [Pan] [Zoom]  |  [Undo] [Redo]  |  [Generate BOM] [Export PDF]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### Module Configuration Panel
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  MODULE CONFIGURATION                                                    [X Close] │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                     │
│  Wall Cabinet - Standard                                                            │
│                                                                                     │
│  DIMENSIONS                                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │  Width (mm)     [−]  [ 600 ]  [+]      Range: 300 - 1200                  │    │
│  │  Height (mm)    [−]  [ 720 ]  [+]      Range: 400 - 900                   │    │
│  │  Depth (mm)     [−]  [ 350 ]  [+]      Range: 250 - 400                   │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
│  OPTIONS                                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │  Shelves        [−]  [  2  ]  [+]                                         │    │
│  │  Door Type      [ Single Door        ▼ ]                                  │    │
│  │  Handle         [ Bar Handle         ▼ ]                                  │    │
│  │  Material       [ 18mm BWR Plywood   ▼ ]                                  │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
│  POSITION                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │  From Left (mm)     [ 1200 ]                                              │    │
│  │  From Floor (mm)    [ 1400 ]                                              │    │
│  │  Wall               [ Wall 1 - North  ▼ ]                                 │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  [Delete Module]                              [Cancel]  [Apply Changes]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Technical Architecture

### 16.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE DIAGRAM                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────┐                                                                │
│  │   LiDAR DEVICE  │                                                                │
│  │  ┌───────────┐  │         ┌─────────────────────────────────────────────────┐   │
│  │  │ Unitree   │  │         │                   CLOUD                          │   │
│  │  │ L2 LiDAR  │  │         │                                                  │   │
│  │  └─────┬─────┘  │         │  ┌─────────────┐      ┌─────────────────────┐   │   │
│  │        │        │         │  │   VERCEL    │      │      RAILWAY        │   │   │
│  │  ┌─────┴─────┐  │         │  │  (Frontend) │      │     (Backend)       │   │   │
│  │  │Raspberry  │  │         │  │             │      │                     │   │   │
│  │  │   Pi      │  │   4G    │  │  ┌───────┐  │      │  ┌───────────────┐  │   │   │
│  │  │  + SIM    │──┼────────────│  │Next.js│  │◄────►│  │   Node.js     │  │   │   │
│  │  └───────────┘  │         │  │  │  App  │  │      │  │   Express     │  │   │   │
│  └─────────────────┘         │  │  └───────┘  │      │  └───────┬───────┘  │   │   │
│                              │  │      │      │      │          │          │   │   │
│         ┌─────────────────┐  │  │      │      │      │          │          │   │   │
│         │     TABLET      │  │  │      ▼      │      │          ▼          │   │   │
│         │  ┌───────────┐  │  │  │  ┌───────┐  │      │  ┌───────────────┐  │   │   │
│         │  │  Browser  │◄─┼──┼──│  │Three.js│ │      │  │ Python Worker │  │   │   │
│         │  │  (PWA)    │  │  │  │  │Viewer │  │      │  │  (Processing) │  │   │   │
│         │  └───────────┘  │  │  │  └───────┘  │      │  └───────────────┘  │   │   │
│         └─────────────────┘  │  └─────────────┘      │          │          │   │   │
│                              │                       │          ▼          │   │   │
│                              │                       │  ┌───────────────┐  │   │   │
│                              │                       │  │   Job Queue   │  │   │   │
│                              │                       │  │   (Bull/Redis)│  │   │   │
│                              │                       │  └───────────────┘  │   │   │
│                              │                       └──────────┬──────────┘   │   │
│                              │                                  │              │   │
│                              │  ┌───────────────────────────────┴────────────┐ │   │
│                              │  │                  DATA LAYER                │ │   │
│                              │  │                                            │ │   │
│                              │  │  ┌────────────┐      ┌────────────────┐   │ │   │
│                              │  │  │ PostgreSQL │      │  Object Store  │   │ │   │
│                              │  │  │ (Railway)  │      │  (S3/Cloudflare│   │ │   │
│                              │  │  │            │      │   R2)          │   │ │   │
│                              │  │  │ - Sessions │      │                │   │ │   │
│                              │  │  │ - Modules  │      │ - Point Clouds │   │ │   │
│                              │  │  │ - BOMs     │      │ - Exports      │   │ │   │
│                              │  │  └────────────┘      └────────────────┘   │ │   │
│                              │  └────────────────────────────────────────────┘ │   │
│                              └─────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 16.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | Next.js 14 | Existing, SSR support, good DX |
| 3D Rendering | Three.js | Industry standard, good performance |
| State Management | Zustand | Lightweight, simple API |
| Backend | Node.js + Express | Existing, good ecosystem |
| Database | PostgreSQL | Reliable, JSON support, existing |
| Job Queue | Bull + Redis | Reliable, good monitoring |
| Processing | Python | Best for point cloud libraries |
| Object Storage | Cloudflare R2 | Cost-effective, S3-compatible |
| Hosting | Vercel + Railway | Existing infrastructure |

### 16.3 Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         POINT CLOUD PROCESSING PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  INPUT                                                                              │
│  ┌─────────────────┐                                                                │
│  │  Raw Point Cloud│                                                                │
│  │  (PLY/NPY file) │                                                                │
│  └────────┬────────┘                                                                │
│           │                                                                         │
│           ▼                                                                         │
│  STAGE 1: PREPROCESSING                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               │   │
│  │  │ Statistical   │───►│    Voxel      │───►│    Radius     │               │   │
│  │  │ Outlier       │    │ Downsampling  │    │   Outlier     │               │   │
│  │  │ Removal       │    │  (5mm grid)   │    │   Removal     │               │   │
│  │  └───────────────┘    └───────────────┘    └───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│           │                                                                         │
│           ▼                                                                         │
│  STAGE 2: WALL DETECTION                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               │   │
│  │  │   RANSAC      │───►│    Filter     │───►│    Extract    │               │   │
│  │  │    Plane      │    │   Vertical    │    │     Wall      │               │   │
│  │  │  Detection    │    │    Planes     │    │   Boundaries  │               │   │
│  │  └───────────────┘    └───────────────┘    └───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│           │                                                                         │
│           ▼                                                                         │
│  STAGE 3: FEATURE DETECTION                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               │   │
│  │  │   Depth Map   │───►│  Protrusion/  │───►│    Classify   │               │   │
│  │  │  Generation   │    │   Recession   │    │    Features   │               │   │
│  │  │              │    │   Detection   │    │               │               │   │
│  │  └───────────────┘    └───────────────┘    └───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│           │                                                                         │
│           ▼                                                                         │
│  STAGE 4: FLOOR PLAN GENERATION                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               │   │
│  │  │   Project     │───►│   Simplify    │───►│    Generate   │               │   │
│  │  │   to 2D       │    │   Polygon     │    │   Dimensions  │               │   │
│  │  │              │    │              │    │               │               │   │
│  │  └───────────────┘    └───────────────┘    └───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│           │                                                                         │
│           ▼                                                                         │
│  OUTPUT                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐               │
│  │   Walls JSON    │    │  Floor Plan    │    │   Features      │               │
│  │                 │    │     JSON       │    │     JSON        │               │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘               │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. Implementation Roadmap

### 17.1 Phase 1: Foundation (Weeks 1-4)

| Week | Backend Tasks | Frontend Tasks | Deliverable |
|------|---------------|----------------|-------------|
| 1 | Session API, DB schema | Project setup, routing | Session CRUD working |
| 2 | Chunked upload API | Upload component | File upload working |
| 3 | Python integration, job queue | Processing status UI | Processing triggered |
| 4 | Layout API, wall storage | Basic 3D viewer | Walls displayed |

### 17.2 Phase 2: Core Features (Weeks 5-8)

| Week | Backend Tasks | Frontend Tasks | Deliverable |
|------|---------------|----------------|-------------|
| 5 | Wall detection refinement | 2D floor plan view | Floor plan rendered |
| 6 | Module templates API | Module library UI | Modules selectable |
| 7 | Module placement API | Drag-drop placement | Modules placeable |
| 8 | Collision detection | Snap and constraints | Valid placements only |

### 17.3 Phase 3: Output & Polish (Weeks 9-12)

| Week | Backend Tasks | Frontend Tasks | Deliverable |
|------|---------------|----------------|-------------|
| 9 | BOM generation | BOM display | BOM viewable |
| 10 | Export APIs (PDF, Excel) | Export UI | Files downloadable |
| 11 | Performance optimization | UI polish, animations | Smooth experience |
| 12 | Testing, bug fixes | Testing, bug fixes | MVP ready |

### 17.4 Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| M1: Data Pipeline | Week 4 | Upload → Process → Display working |
| M2: Design System | Week 8 | Module placement complete |
| M3: MVP | Week 12 | Full workflow, BOM generation |
| M4: Pilot | Week 14 | 3 customers using system |

---

## 18. Testing Requirements

### 18.1 Test Categories

| Category | Coverage Target | Responsibility |
|----------|-----------------|----------------|
| Unit Tests | 80% core logic | Developers |
| Integration Tests | All API endpoints | Developers |
| E2E Tests | Critical user flows | QA |
| Performance Tests | Key metrics | QA |
| Usability Tests | 5 users | Product |

### 18.2 Test Scenarios

**Critical Path Tests:**
1. Create session → Upload → Process → View walls
2. Place module → Configure → Save
3. Generate BOM → Export PDF
4. Resume interrupted upload
5. Recover from app crash

**Edge Cases:**
1. Very large room (100+ sq m)
2. Complex room shape (L-shaped, alcoves)
3. Multiple windows/doors
4. Poor quality scan (sparse points)
5. Network interruption mid-upload

---

## 19. Success Metrics

### 19.1 Product Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| Scan Success Rate | % scans completing processing | > 95% | Backend logs |
| Time to Floor Plan | Upload → Floor plan ready | < 5 min | Backend metrics |
| Module Placement Time | Average time to place module | < 30 sec | Frontend events |
| BOM Accuracy | % correct material estimates | > 98% | Manual validation |
| User Satisfaction | NPS score | > 40 | Surveys |

### 19.2 Business Metrics

| Metric | Definition | Target | Timeline |
|--------|------------|--------|----------|
| Active Factories | Paying customers | 5 | 6 months |
| Monthly Scans | Total scans per month | 200 | 6 months |
| Revenue | Monthly recurring | ₹1,00,000 | 6 months |
| Churn Rate | Customer cancellation | < 5% monthly | Ongoing |

---

## 20. Appendices

### 20.1 Glossary

| Term | Definition |
|------|------------|
| BOM | Bill of Materials - list of all materials needed |
| CNC | Computer Numerical Control - automated cutting machines |
| LiDAR | Light Detection and Ranging - laser scanning technology |
| PLY | Polygon File Format - 3D point cloud format |
| RANSAC | Random Sample Consensus - algorithm for plane detection |
| Session | Single room scan and design project |

### 20.2 References

1. Unitree L2 LiDAR Documentation
2. Three.js Documentation
3. Open3D Python Library
4. Next.js Documentation
5. Railway Deployment Guide

### 20.3 Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 2026 | Initial document | Product Team |

---

## Document Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Tech Lead | | | |
| Engineering Manager | | | |
| Business Stakeholder | | | |

---

*This document serves as the definitive reference for the LiDAR-Driven Modular Interior Design Platform. All implementation decisions should align with the requirements specified herein.*