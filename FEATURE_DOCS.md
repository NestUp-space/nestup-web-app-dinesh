# FEATURE_DOCS.md — Nestup Web App

---

## 1. App Overview

### What is this web app?

**Nestup** (codenamed "Project Sauron") is a full-stack modular interior design and furniture manufacturing platform. It bridges the gap between room measurement, furniture design, and manufacturing output — from scanning a room with a LiDAR device all the way to generating CNC machine instructions for cutting wood panels.

### Who is it for?

The app serves two broad user groups:

**Internal teams** — staff across the furniture manufacturing workflow:
- Project Managers
- Customer Acquisition
- Site Engineers
- BIM Engineers
- Input/Output QA
- Pressing, Cutting, Packing, and Installation teams
- Designers

**External users:**
- Home Owners — clients who want custom furniture designed and manufactured for their space
- Designers — third-party or contracted designers who work on client projects

### What is the main purpose?

Nestup manages the end-to-end process of:
1. Acquiring a client lead and booking a site visit
2. Measuring the room (via LiDAR scan or ARuco marker photos)
3. Designing modular furniture using a 3D visualiser
4. Managing the project workflow across internal teams
5. Generating manufacturing outputs — cut lists, plank lists, BOM, and G-code for CNC machines
6. Coordinating delivery, installation, and project sign-off

---

## 2. Pages / Screens

### Public Pages

---

#### Home — `/`

**What the user sees:**
The landing page of the Nestup website. Includes the brand introduction, service overview, featured projects or designs, and calls-to-action.

**What the user can do:**
- Navigate to About, Contact, Get a Quote, or Login
- Learn about the product/service offering

---

#### About Us — `/aboutus`

**What the user sees:**
Information about the Nestup company, team, and mission.

**What the user can do:**
- Read about the company background and values

---

#### Contact — `/contact`

**What the user sees:**
A contact form for enquiries.

**What the user can do:**
- Submit a contact form (name, email, message) which is sent via EmailJS

---

#### Login — `/login`

**What the user sees:**
A login/register form to authenticate with the platform.

**What the user can do:**
- Log in with email and password
- Register a new account (if registration is enabled)
- Request a password reset by email

---

#### Get a Quote — `/get-quote/*`

A multi-step guided flow for generating a furniture quote. Each step is its own page:

| Step | URL | Description |
|------|-----|-------------|
| 1 | `/get-quote/society` | Select the apartment complex / society |
| 2 | `/get-quote/floor-plan` | Choose a floor plan layout |
| 3 | `/get-quote/materials` | Select materials (ply type, laminates) |
| 4 | `/get-quote/design` | Choose a design style/template |
| 5 | `/get-quote/summary` | View the final quote |

**What the user can do at each step:**
- Select from pre-loaded options (societies, floor plans, materials, designs)
- Navigate back and forth between steps
- View a generated price estimate on the summary page

---

#### Measurements — `/measurements/*`

A set of pages for measuring room walls using ARuco marker photos taken on a phone or tablet.

| Page | URL | Description |
|------|-----|-------------|
| Instructions | `/measurements/instructions` | Step-by-step guide for using ARuco markers |
| Capture | `/measurements/capture` | Camera interface to photograph markers |
| Design | `/measurements/design` | View extracted wall measurements |
| History | `/measurements/history` | Past measurement sessions |

**What the user can do:**
- Follow instructions to place physical ARuco markers on walls
- Capture photos which are processed to extract real-world wall dimensions
- View and use the computed measurements in a design context

The `/measure` route is a redirect shortcut that points to `/measurements`.

---

### Protected Pages (Dashboard — requires login)

All dashboard pages require authentication. Access to specific pages is controlled by the user's role and permissions.

---

#### Dashboard Home — `/dashboard`

**What the user sees:**
An overview page showing key stats — active projects, pending tasks, recent activity.

**What the user can do:**
- See a high-level summary of their work
- Navigate to projects, users, catalogue, BIM tools, or LiDAR tools via the sidebar

---

#### Projects List — `/dashboard/projects`

**What the user sees:**
A paginated table of all projects visible to the current user. Projects are filtered based on the user's role (e.g. a designer sees only their assigned projects; a manager sees all).

**What the user can do:**
- View all accessible projects with their status, designer, engineer, and manager
- Search or filter projects
- Click a project to open its detail view
- Create a new project (if permitted)

---

#### Project Details — `/dashboard/projects/[id]`

**What the user sees:**
Full project details: project metadata, assigned team members, current status, a list of tasks, comments, and uploaded files.

**What the user can do:**
- View and update project information (name, description, status)
- Add and manage tasks within the project
- Upload files to tasks (design drawings, photos, documents)
- Add comments to the project
- View the project activity/audit log
- Share the project with another user
- View materials linked to the project
- Change the project status (subject to role permissions)

---

#### User Management — `/dashboard/users`

**What the user sees:**
A table of all registered users in the system with their name, email, role, and active/inactive status.

**What the user can do:**
- Browse all users
- Search/filter by role or status
- Activate or deactivate a user account
- Navigate to a user's detail page

---

#### User Details — `/dashboard/users/[id]`

**What the user sees:**
A user's profile: their name, email, current role, team assignment, and account status.

**What the user can do:**
- Change the user's assigned role
- Update the user's password
- Toggle the user's active status

---

#### Create User — `/dashboard/users/create-user`

**What the user sees:**
A form to create a new user account.

**What the user can do:**
- Enter name, email, password, and assign a role
- Submit to create the account immediately (no email invite required)

---

#### Role & Permission Management — `/dashboard/users/roles`

**What the user sees:**
A list of all defined roles and their assigned permissions. Permissions are grouped by category (projects, users, tasks, BIM, etc.).

**What the user can do:**
- View which permissions each role has
- Create a new role
- Edit an existing role's permissions
- Understand the granular access control structure

---

#### Catalogue — `/dashboard/catalogue`

**What the user sees:**
A library of all furniture model definitions (templates for modular furniture pieces — wardrobes, cabinets, etc.).

**What the user can do:**
- Browse all models
- Search or filter models
- Open a model to view its inputs and BOM structure
- Navigate to create a new model or edit an existing one

---

#### Create / Edit Model — `/dashboard/catalogue/new` and `/dashboard/catalogue/[modelId]/edit`

**What the user sees:**
A form-based model editor where a BIM engineer can define a furniture model template.

**What the user can do:**
- Define the model name, type, and category
- Add input parameters (e.g. "Width", "Height", "Depth") with type, default value, and constraints
- Add BOM items:
  - **Plank items**: define width/length using formulas (JavaScript expressions evaluated against inputs), material code, grain direction, and edge banding
  - **Hardware items**: specify part codes and quantities
  - **Addon items**: reference other models to compose complex assemblies
- Save or update the model definition

---

#### BIM Process — `/dashboard/bimProcess`

**What the user sees:**
An overview page for BIM (Building Information Modelling) manufacturing workflows. Acts as a hub to access the generation tools.

**What the user can do:**
- Navigate to Cut Lists, Material Estimates, and Plank Lists

---

#### Cut Lists — `/dashboard/bimProcess/cut-lists`

**What the user sees:**
A tool for generating detailed cut lists for a set of furniture pieces.

**What the user can do:**
- Select a project or set of model instances
- Trigger cut list generation
- Download the output as a CSV or PDF file
- The cut list describes each plank: dimensions, material, quantity, and edge banding

---

#### Material Estimates — `/dashboard/bimProcess/material-estimates`

**What the user sees:**
A material cost and quantity estimation tool.

**What the user can do:**
- Select model instances or a project
- Generate a material estimate with quantities and costs per material type
- View a breakdown of required materials

---

#### Plank Lists — `/dashboard/bimProcess/plank-lists`

**What the user sees:**
A plank inventory/optimisation tool.

**What the user can do:**
- Generate a plank list from a project's model instances
- View how individual planks should be cut from standard sheet sizes
- Download the plank list output

---

#### LiDAR Dashboard — `/dashboard/lidar`

**What the user sees:**
A list of all LiDAR scanning sessions with their status, creation date, and associated project.

**What the user can do:**
- Browse all sessions
- Create a new session
- Navigate to a specific session for processing or design

---

#### LiDAR Point Cloud Viewer — `/dashboard/lidar/pointcloud`

**What the user sees:**
An interactive 3D viewer rendering a point cloud from a LiDAR scan.

**What the user can do:**
- Rotate, pan, and zoom the 3D point cloud
- Inspect the raw scan data visually

---

#### LiDAR Session Details — `/dashboard/lidar/session/[sessionId]`

**What the user sees:**
A detailed session view with status indicator, scan file upload area, processing controls, 2D floor plan, 3D room view, module placement panel, and export options.

**What the user can do:**
- Upload scan data files (CSV or PLY/PCD) in chunks
- Trigger scan processing (wall detection via RANSAC algorithm)
- View the detected walls as a 2D floor plan
- View a 3D room reconstruction
- Place modular furniture pieces (modules) into the room
- Move, resize, or remove placed modules
- Export the session data as JSON, Excel, or PDF

---

## 3. Features Breakdown

---

### Feature: User Authentication

**Pages:** `/login`, all dashboard pages

**What it does:**
Controls who can access the app and what they can do. Users log in with email and password; a JWT token is issued and stored in the browser. All API requests include this token.

**Step-by-step:**
1. User enters email and password on the login page
2. The frontend sends credentials to `POST /api/auth/login`
3. The backend validates credentials and returns a JWT
4. The token is stored in `localStorage` and attached to all future API requests
5. The `UserContext` loads the user's profile and permissions
6. Protected routes check for a valid token; unauthenticated users are redirected to `/login`

**Data used:** Email, password (hashed with bcrypt), JWT token, user profile, roles, permissions

---

### Feature: Role-Based Access Control (RBAC)

**Pages:** All dashboard pages, project details, user management, roles page

**What it does:**
Each user is assigned a role (e.g. Project Manager, BIM Engineer, Designer, Home Owner). Each role has a set of permissions that control what actions the user can take. Permissions follow a `{group}.{action}` pattern (e.g. `projects.create`, `tasks.manage`).

**Step-by-step:**
1. Admin assigns a role to a user (via `/dashboard/users/[id]`)
2. Each role has permissions configured in `/dashboard/users/roles`
3. When the user logs in, their permissions are loaded into `UserContext`
4. The frontend checks `hasPermission(permission)` before showing buttons/actions
5. The backend also validates permissions on every API request via middleware
6. Unauthorised requests return a 403 error

**Data used:** Roles, permissions, role-permission mappings, user-role assignment

---

### Feature: Project Management

**Pages:** `/dashboard/projects`, `/dashboard/projects/[id]`

**What it does:**
Allows teams to create, manage, and track interior design projects from initial brief through to completion. Each project can have multiple tasks, files, comments, and team member assignments.

**Step-by-step:**
1. A Project Manager creates a new project, assigning a designer, engineer, and manager
2. Team members view the project's task list and status
3. Tasks are created within the project, each with a status (pending → in progress → completed)
4. Team members upload files to tasks (e.g. design drawings, site photos)
5. Comments can be added at the project level for team communication
6. The project status is updated as work progresses
7. An audit log records all changes for accountability
8. The project can be shared with external users (e.g. the home owner)

**Data used:** Project name, description, status, assigned users, tasks, subtasks, files, comments, activity log

---

### Feature: Task & Subtask Management

**Pages:** `/dashboard/projects/[id]`

**What it does:**
Breaks down a project into discrete units of work. Tasks can have permissions controlling who can view or upload files. Tasks contain subtasks for finer granularity.

**Step-by-step:**
1. A user with appropriate permissions creates a task inside a project
2. The task is assigned a status and optional file permissions
3. Team members can upload files to tasks they have "Edit" permission on
4. Subtasks can be created within a task and individually marked as complete
5. Task status is updated (e.g. to "completed") when work is done

**Data used:** Task name, status, file permissions, subtasks, uploaded files

---

### Feature: File Uploads & Management

**Pages:** `/dashboard/projects/[id]`

**What it does:**
Allows team members to attach files (design drawings, photos, PDFs, CAD files) to project tasks. Files are stored in cloud storage (AWS S3 or Google Cloud Storage).

**Step-by-step:**
1. A user opens a task they have "Edit" permission on
2. They select a file to upload
3. The frontend sends the file to `POST /api/files/upload`
4. The backend stores the file in S3/GCS and records metadata in the database
5. Other team members can view and download the file if they have "View" permission
6. Files can be deleted by authorised users

**Data used:** File name, type, size, cloud storage URL, uploader, associated task/project

---

### Feature: Quote Generation Flow

**Pages:** `/get-quote/*`

**What it does:**
Guides a prospective client through selecting their apartment complex, floor plan, materials, and design style to generate a furniture quote.

**Step-by-step:**
1. User visits `/get-quote/society` and selects their apartment society
2. They choose a floor plan that matches their unit layout
3. They select their preferred materials (ply type, thickness, laminate finish)
4. They choose a design style or template
5. The app calculates a price estimate based on selections
6. The user sees a summary page with the itemised quote

**Data used:** Society/location, floor plan type, material selections, design template, generated price

---

### Feature: ARuco Marker Room Measurement

**Pages:** `/measurements/*`

**What it does:**
Enables users to measure room walls using their phone camera and physical ARuco markers (printed paper squares with unique IDs). The app computes real-world dimensions from the photos.

**Step-by-step:**
1. User reads the instructions at `/measurements/instructions`
2. Physical ARuco markers are placed on the walls at known spacing
3. User opens `/measurements/capture` and photographs the wall
4. The app processes the image using computer vision (OpenCV-based) to detect marker positions and compute wall dimensions
5. Computed measurements are saved (to Supabase) and displayed at `/measurements/design`
6. Past sessions are accessible at `/measurements/history`

**Data used:** Camera images, ARuco marker IDs/positions, computed wall dimensions, session metadata

---

### Feature: LiDAR Room Scanning & Processing

**Pages:** `/dashboard/lidar`, `/dashboard/lidar/session/[sessionId]`

**What it does:**
Allows a site engineer to upload raw LiDAR scan data from a physical scanner, process it to detect room walls, and build a 3D model of the room.

**Step-by-step:**
1. Engineer creates a new LiDAR session (status: CREATED)
2. They upload the scan file in chunks — the app reassembles the chunks server-side (status: UPLOADING)
3. The engineer triggers processing; the server runs a RANSAC algorithm on the point cloud to detect wall segments (status: PROCESSING → PROCESSED)
4. The floor plan is displayed as a 2D overhead view with detected walls highlighted
5. A 3D room visualisation is generated from the wall data (status: DESIGNING)
6. The session is completed once design work is done (status: COMPLETED)

**Data used:** LiDAR scan files (CSV, PLY, PCD), point cloud coordinates, detected wall segments (start/end points), session status

---

### Feature: 3D Point Cloud Viewer

**Pages:** `/dashboard/lidar/pointcloud`, `/dashboard/lidar/session/[sessionId]`

**What it does:**
Renders the raw LiDAR point cloud as an interactive 3D scatter plot, letting engineers inspect the scan data before processing.

**Step-by-step:**
1. User opens the point cloud viewer linked to a session
2. Three.js renders thousands of 3D points from the scan data
3. User can rotate (orbit), pan, and zoom to inspect the space
4. Points are colour-coded by height or intensity

**Data used:** Point cloud XYZ coordinates (from processed scan data)

---

### Feature: Floor Plan Viewer

**Pages:** `/dashboard/lidar/session/[sessionId]`

**What it does:**
Shows a 2D top-down view of the room with detected walls drawn as line segments.

**Step-by-step:**
1. After scan processing, the server provides wall segment coordinates
2. The floor plan viewer renders the walls on a 2D canvas
3. Users can see the room outline, wall lengths, and overall dimensions
4. Wall annotations show measurements in millimetres

**Data used:** Wall segment start/end coordinates, room dimensions

---

### Feature: Module Placement (Furniture Layout)

**Pages:** `/dashboard/lidar/session/[sessionId]`

**What it does:**
Allows users to place modular furniture pieces (modules) into the scanned room. Modules snap to walls and are validated for collisions.

**Step-by-step:**
1. User selects a module template from the panel (e.g. wardrobe, kitchen unit)
2. They click a wall or position in the floor plan to place the module
3. The module snaps to the nearest wall
4. Collision detection prevents overlapping modules
5. The user can resize, rotate, or delete placed modules
6. The final layout is saved to the session

**Data used:** Module templates, placed module positions/dimensions, wall positions, collision data

---

### Feature: LiDAR Session Export

**Pages:** `/dashboard/lidar/session/[sessionId]`

**What it does:**
Exports the processed session data — room layout, walls, and placed modules — in multiple formats.

**Step-by-step:**
1. User clicks the export button on a completed or designing-stage session
2. They choose a format: JSON, Excel (XLSX), or PDF
3. The server generates the file and returns a download link
4. The exported file contains wall dimensions, module placements, and a BOM

**Data used:** Session walls, placed modules, module dimensions/materials, project metadata

---

### Feature: Catalogue Model Management

**Pages:** `/dashboard/catalogue`, `/dashboard/catalogue/new`, `/dashboard/catalogue/[modelId]/edit`

**What it does:**
A library of reusable furniture model definitions. BIM engineers define templates with configurable inputs and bill-of-materials rules. These templates are then instantiated in projects.

**Step-by-step:**
1. BIM engineer navigates to the catalogue and clicks "New Model"
2. They define the model name, type (simple box / L-shaped box), and description
3. They add **input parameters** — e.g. "Width" (number, 600–1200mm), "Height" (number), "Material"
4. They add **BOM items**:
   - *Planks*: specify a formula for width and length (e.g. `width - 36`), material code, grain direction, edge banding sides
   - *Hardware*: part code and quantity (can be a formula)
   - *Addons*: reference another model to compose assemblies
5. They save the model definition
6. Later, when instantiated on a project, users enter real values for the inputs
7. The system evaluates the formulas to produce the exact cut dimensions

**Data used:** Model name/type, input parameters (name, type, default, min/max), BOM items (type, material code, dimension formulas, edge banding)

---

### Feature: BIM — Cut List Generation

**Pages:** `/dashboard/bimProcess/cut-lists`

**What it does:**
Generates a detailed list of all panels/planks that need to be cut for a set of furniture pieces. The output is used by the cutting team to prepare materials.

**Step-by-step:**
1. User selects a project or model instances to generate for
2. The system evaluates each BIM model's plank items, applying the user's input values to the dimension formulas
3. A cut list is produced: one row per plank, with dimensions (L × W × thickness), material, grain direction, and edge banding requirements
4. The user downloads the cut list as CSV or PDF

**Data used:** Model instances, input values, plank formulas, material codes, edge banding specs

---

### Feature: BIM — Plank List Generation

**Pages:** `/dashboard/bimProcess/plank-lists`

**What it does:**
Generates an optimised inventory of standard sheet sizes needed to produce all cuts. Used for purchasing and workshop preparation.

**Step-by-step:**
1. User selects the project/instances
2. The server aggregates all plank items and groups them by material and thickness
3. A nesting/packing algorithm calculates how many full sheets are required
4. The plank list is returned as a downloadable file

**Data used:** Cut list data, standard sheet dimensions, material types

---

### Feature: BIM — Material Estimates

**Pages:** `/dashboard/bimProcess/material-estimates`

**What it does:**
Calculates the total material quantities and estimated cost for a project.

**Step-by-step:**
1. User selects a project or instances
2. The estimator aggregates all BOM items (planks, hardware, addons)
3. Quantities are calculated and priced against material unit costs
4. A cost breakdown is shown by material type
5. The estimate can be downloaded

**Data used:** BOM items, material quantities, unit costs

---

### Feature: User Management (Admin)

**Pages:** `/dashboard/users`, `/dashboard/users/[id]`, `/dashboard/users/create-user`

**What it does:**
Allows administrators to manage the user accounts in the system — creating users, assigning roles, deactivating accounts, and resetting passwords.

**Step-by-step:**
1. Admin views the user list at `/dashboard/users`
2. They click "Create User" to open the creation form
3. They enter name, email, initial password, and assign a role
4. The user is created immediately and can log in
5. Admin can later navigate to a user's profile to change their role, update their password, or deactivate their account

**Data used:** User name, email, password, role, active status

---

### Feature: Role & Permission Management

**Pages:** `/dashboard/users/roles`

**What it does:**
Allows administrators to define what each user role can and cannot do in the system.

**Step-by-step:**
1. Admin opens the roles page
2. They see all defined roles and their assigned permissions
3. They can create a new role with a name and select permissions
4. Or edit an existing role's permission set
5. Changes take effect immediately for all users with that role on their next request

**Data used:** Role names, permission groups and actions, role-permission mappings

---

## 4. User Flows

---

### Flow 1: New Client Gets a Quote

1. Home owner visits the landing page (`/`)
2. Clicks "Get a Quote"
3. Selects their apartment society → floor plan → materials → design style
4. Views the generated quote summary
5. Submits a contact form or books a site visit

---

### Flow 2: Site Engineer Scans a Room with LiDAR

1. Engineer logs into the dashboard
2. Navigates to `/dashboard/lidar` and creates a new session
3. Uploads the LiDAR scan file in chunks
4. Triggers processing to detect walls via RANSAC
5. Reviews the 2D floor plan and 3D room view
6. Places modular furniture modules on the floor plan
7. Exports the session as PDF/Excel for handover to the design team

---

### Flow 3: Home Owner Measures a Room with ARuco

1. Home owner opens the app on their phone and visits `/measurements/instructions`
2. Prints or displays ARuco markers and places them on the walls
3. Opens `/measurements/capture` and photographs each wall
4. Reviews extracted measurements at `/measurements/design`
5. Measurement data is stored and linked to their project

---

### Flow 4: BIM Engineer Defines a New Model

1. BIM engineer logs in and navigates to `/dashboard/catalogue`
2. Clicks "New Model" and fills in the model details
3. Adds input parameters (e.g. Width, Height, Material)
4. Adds plank BOM items with dimension formulas
5. Adds hardware items (hinges, runners, screws)
6. Saves the model to the catalogue

---

### Flow 5: Project Manager Creates and Manages a Project

1. Manager logs into the dashboard and navigates to `/dashboard/projects`
2. Creates a new project, assigns designer, engineer, and manager
3. Creates tasks within the project (e.g. "Site Measurement", "3D Design", "Cut List")
4. Team members update task statuses as they complete work
5. Files are uploaded to tasks at each stage
6. Manager monitors progress via the project activity log
7. Manager updates project status to "Completed" when all tasks are done

---

### Flow 6: BIM Engineer Generates Manufacturing Outputs

1. BIM engineer navigates to `/dashboard/bimProcess`
2. Selects a project with model instances
3. Opens "Cut Lists" and generates the cut list for all models
4. Downloads as CSV and shares with the cutting team
5. Opens "Material Estimates" and reviews costs
6. Opens "Plank Lists" to see how many sheets to purchase

---

### Flow 7: Admin Onboards a New Team Member

1. Admin logs in and navigates to `/dashboard/users`
2. Clicks "Create User" and fills in name, email, password
3. Assigns the appropriate role (e.g. "BIM Engineer")
4. New user can log in immediately with their credentials
5. Admin can later adjust permissions via the roles page if needed

---

### Flow 8: Designer Reviews and Works on an Assigned Project

1. Designer logs in; they see only their assigned projects in the project list
2. Opens a project and reviews the uploaded site photos and measurements in tasks
3. Works on the 3D design using the visualiser tools
4. Uploads design files back to the appropriate task
5. Updates the task status to "Completed"
6. The project manager is notified via the activity log

---

## 5. Integrations & External Connections

---

### Cloud Storage — AWS S3 / Google Cloud Storage

**Purpose:** All user-uploaded files (design drawings, site photos, LiDAR scans, generated documents) are stored in cloud object storage rather than the server's local disk.

**How it's used:**
- When a file is uploaded via the API, the backend streams it directly to S3 or GCS
- A URL to the stored object is saved in the database
- Download requests generate a pre-signed URL or proxy the file through the API
- Both S3 and GCS are supported; the active provider is configured via environment variables

---

### Google Calendar API

**Purpose:** Scheduling and managing site visits and consultations between the Nestup team and clients.

**How it's used:**
- When a site visit is booked (via the Book a Visit flow or through a project task), an event is created in a shared Google Calendar
- Uses a Google service account for authentication (no per-user OAuth required)
- Calendar events can be created, viewed, and updated from within the app

---

### Zoho CRM

**Purpose:** Customer relationship management — syncing client data, leads, and project information with the Nestup CRM.

**How it's used:**
- When a new quote is generated or a client enquiry is submitted, the lead is pushed to Zoho CRM
- Client contact details and project status are synced
- Uses OAuth 2.0 with a refresh token for authentication

---

### EmailJS (Frontend)

**Purpose:** Sending contact form submissions and email notifications from the frontend without a dedicated backend mail server.

**How it's used:**
- The contact form on `/contact` uses EmailJS to send the enquiry directly to a configured email inbox
- No backend involvement required

---

### Nodemailer (Backend)

**Purpose:** Sending transactional emails from the backend, primarily for password reset flows.

**How it's used:**
- When a user requests a password reset (`POST /api/auth/reset-password-request`), the backend generates a time-limited token
- Nodemailer sends an email with a reset link
- Configurable to use any SMTP provider

---

### Supabase

**Purpose:** Storage for ARuco measurement session data.

**How it's used:**
- When a user completes an ARuco room measurement, the computed wall dimensions and session metadata are saved to Supabase
- Used specifically for the `/measurements` feature, providing a lightweight hosted database for public measurement sessions

---

### Three.js + React Three Fiber

**Purpose:** All 3D visualisation within the app — point cloud viewer, room 3D viewer, and the furniture cabinet designer.

**How it's used:**
- Three.js provides the underlying WebGL rendering engine
- React Three Fiber (R3F) wraps Three.js in React components for use in Next.js pages
- Used in: LiDAR point cloud viewer, room 3D viewer, and the CabinetDesigner component

---

### jsPDF

**Purpose:** Client-side or server-side generation of PDF documents.

**How it's used:**
- Generating downloadable PDF exports from BIM cut lists, material estimates, and LiDAR session exports

---

### xlsx (SheetJS)

**Purpose:** Generating Excel spreadsheet files.

**How it's used:**
- Exporting cut lists, plank lists, and LiDAR session data as `.xlsx` files for use in workshop and purchasing workflows

---

### jszip

**Purpose:** Creating ZIP archives for batch exports.

**How it's used:**
- Bundling multiple exported files (e.g. cut list + plank list + BOM) into a single downloadable ZIP

---

### OpenAPI / Swagger

**Purpose:** API documentation for backend developers and integrators.

**How it's used:**
- The backend exposes a Swagger UI at `/api-docs`
- All backend routes are documented with request/response schemas
- Useful for frontend developers and third-party integrations

---

*Generated 2026-03-18 — covers all pages, features, and integrations found in the Nestup web app codebase.*
