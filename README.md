# InterComms — Product Showcase

## Overview

InterComms is a project collaboration workspace for teams that need one clear place to plan work, assign responsibility, track progress, and communicate around deliverables.

It is designed for organizations where project information is often spread across chat messages, spreadsheets, calendars, and disconnected task lists. InterComms brings that work together in a role-aware workspace.

## Core use case

A company is running several projects at the same time:

1. An administrator creates a project and assigns a project manager.
2. The project manager organizes the project into tasks.
3. Team members receive assigned work and update task progress.
4. Viewers or clients can follow project progress without changing project data.
5. Everyone can see deadlines, comments, activity, and completion progress in context.

The result is a shared project view where teams can answer:

- What projects are active?
- Who owns each task?
- What needs attention next?
- Which deadlines are approaching?
- How much of the project is complete?
- What changed recently?

## MVP

The InterComms MVP focuses on the smallest set of capabilities needed to manage a project from planning through delivery.

### Authentication and roles

- Secure login and logout.
- Persistent server-side sessions.
- Four roles: Admin, Project Manager, Team Member, and Viewer / Client.
- Backend-enforced permissions.

### Project management

- View accessible projects.
- View project status, manager, tasks, members, and progress.
- Track multiple projects such as Project Alpha and Project Beta.

### Task management

- Create tasks inside a project.
- Add descriptions, priorities, assignees, and due dates.
- Move tasks through To do, In progress, In review, and Done.
- Open task details and add comments.
- Prevent stale task updates with version-based concurrency control.

### Progress and planning

- Calculate project progress from completed tasks.
- View task deadlines in a calendar.
- Search authorized projects and tasks.
- Receive actionable activity notifications.

### Collaboration

- View project members.
- See recent project and task activity.
- Add comments to tasks.
- Update personal profile information.

## Example experience

### Admin

The Admin signs in, creates **Project Alpha**, assigns a manager, and monitors project-wide progress from the dashboard.

### Project Manager

The Manager signs in, creates **Project Beta**, adds tasks, assigns work to team members, sets deadlines, and moves tasks through the delivery workflow.

### Team Member

The Team Member opens assigned tasks, updates statuses, adds comments, and uses the calendar to prioritize upcoming work.

### Viewer / Client

The Viewer follows authorized projects, reviews task progress, checks deadlines, and reads project activity without changing project data.

## High-level structure

```text
InterComms/
├── frontend/          # Next.js user interface
│   ├── app/           # Application pages
│   ├── components/    # Shared layout and UI
│   ├── features/      # Dashboard, profile, and domain features
│   └── lib/           # Frontend API client
│
├── backend/           # Express REST API
│   ├── src/           # Authentication, authorization, routes, and services
│   └── prisma/        # PostgreSQL schema, migrations, and seed data
│
├── packages/shared/   # Shared enums and contracts
├── docs/              # Architecture notes
└── docker-compose.yml # Local PostgreSQL service
```

## Product flow

```text
Sign in
   ↓
Dashboard
   ↓
Projects
   ↓
Project details
   ↓
Tasks, members, deadlines, and activity
   ↓
Task updates and collaboration
   ↓
Automatic project progress
```

## Why InterComms

InterComms gives teams a practical operating view of project delivery:

- **Clarity:** every task has an owner, status, priority, and deadline.
- **Accountability:** role-based access makes responsibilities explicit.
- **Visibility:** dashboards and calendars show what is happening now.
- **Context:** comments and notifications stay connected to the work.
- **Reliability:** real backend persistence protects shared project state.

## Technology summary

- Next.js and React for the frontend.
- Express and TypeScript for the backend.
- PostgreSQL and Prisma for persistent data.
- Argon2id and server-side sessions for authentication.
- Tailwind CSS for the interface.

For complete setup, API, database, and development instructions, see [docs/tech_behind.md](docs/tech_behind.md).
