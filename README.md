# NestupWebApp - Production Ready Documentation

## Overview
NestupWebApp is a scalable, production-ready application designed to streamline file sharing, project management, and task tracking for BIM engineers, production engineers, and clients. It provides a centralized platform for real-time updates, role-based permissions, and mobile accessibility.

---

## Features

### 1. File Management
- Centralized file repository accessible on mobile and desktop.
- Task-based permissions with metadata (file name, stage, uploader, timestamp, required action).
- File size limit: 10MB (compression suggestions for larger files).
- Role-based access:
  - **Edit Access**: Upload, delete files.
  - **View Access**: Download files.

### 2. Project Management
- Predefined task templates for projects.
- Real-time project status tracking (pending, completed, approved tasks).
- Role-based project creation and management:
  - **BIM Engineers**: Create projects.
  - **Admins**: Modify permissions.

### 3. User Roles & Permissions
- **Admin**: Full access, including user creation and project management.
- **BIM Engineer**: Manage projects, upload/view files, manage task permissions.
- **Production Engineer**: View production files.
- **Client**: View client-related files, approve tasks.

### 4. Mobile-First Design
- Optimized for mobile file uploads, status tracking, and task management.
- Minimalist dashboard for quick access to information.

### 5. Security
- Role-Based Access Control (RBAC).
- Data encryption for file uploads/downloads.
- Secure password reset via email verification.
- Audit logs for file uploads, downloads, and project modifications.

---

## User Stories

### Happy Paths
1. **New Client Registration & Login**
   - Clients receive an email to create a password after CAT creates their account.
2. **Project Creation**
   - BIM Engineers create projects with predefined task templates.
3. **File Upload & Permissions**
   - Easy file upload with clear permission settings.
4. **Status Tracking**
   - Clients view project status and pending actions on a dashboard.

### Unhappy Paths
- **File Upload Failure**: Clear messaging for file size limits and compression instructions.

---

## Functional Requirements

### 1. User Registration
- Admins create all users.
- CAT creates client users.

### 2. Project Creation
- BIM Engineers create projects with predefined task templates.

### 3. File Upload and Permissions
- Files uploaded to specific tasks with assigned permissions.
- File size limit: 10MB.

### 4. Project and Task Tracking
- Real-time tracking for clients and engineers.
- Pending tasks highlighted on dashboards.

### 5. Login
- Clients create passwords during their first login.

---

## Non-Goals
- Customer acquisition.
- Cross-department file management (limited to BIM and production teams).

---

## Future Scope
- OTP-based registration for clients.
- Advanced filtering and sorting for projects.
- Notifications via email/SMS for project updates.
- Custom task management.

---

## Deployment
- **Backend**: Node.js/Express with Prisma for database interaction.
- **Frontend**: Next.js with Tailwind CSS for responsive design.
- **Database**: PostgreSQL.
- **Containerization**: Docker for deployment.
- **CI/CD**: Automated pipelines for testing and deployment.

---

## Testing
- Unit tests for APIs using Jest.
- Integration tests for workflows (e.g., project creation, file upload).

---

## Getting Started

### Prerequisites
- Node.js
- Docker
- PostgreSQL

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/nestupwebapp.git
   ```
2. Navigate to the project directory:
   ```bash
   cd nestupwebapp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   - Copy `.env.example` to `.env` and update values.

5. Start the application:
   ```bash
   docker-compose up
   ```

---

## Contributing
Contributions are welcome! Please follow the [contribution guidelines](CONTRIBUTING.md).

---

## License
This project is licensed under the MIT License.
