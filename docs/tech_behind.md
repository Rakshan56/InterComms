# InterComms

InterComms is a full-stack project collaboration and delivery platform. It helps teams turn project ideas into organized work by bringing projects, tasks, deadlines, members, comments, notifications, and progress tracking into one workspace.

The application supports four types of users:

- **Admin** — manages users, creates projects, and oversees the workspace.
- **Project Manager** — manages assigned projects, members, tasks, and delivery progress.
- **Team Member** — works on assigned tasks, updates task status, and collaborates through comments.
- **Viewer / Client** — views authorized projects, tasks, team information, deadlines, and progress.

Project progress is calculated from task completion. When a task is moved to `DONE`, the project progress percentage updates automatically.

## What the application provides

- Secure login with PostgreSQL-backed sessions.
- Server-side role-based access control.
- Project creation, project visibility, and project progress tracking.
- Task creation, assignment, priorities, due dates, and status updates.
- Optimistic concurrency control for task edits.
- Task comments and recent activity notifications.
- Calendar view for tasks with due dates.
- Global search for authorized projects and tasks.
- User profile management.
- Dashboard metrics based on real database data.

The frontend never treats local arrays, hardcoded metrics, or browser storage as the source of truth. Persistent data and authorization decisions belong to the backend and PostgreSQL database.

## Repository structure

```text
InterComms/
├── frontend/                    # Next.js browser application
│   ├── app/                     # App Router pages and route entry points
│   │   ├── dashboard/           # Workspace dashboard
│   │   ├── projects/            # Project list and project workspaces
│   │   ├── tasks/               # Task detail pages
│   │   ├── calendar/            # Due-date calendar
│   │   ├── notifications/      # Activity notifications
│   │   ├── profile/             # Current-user profile
│   │   ├── users/               # Admin team directory
│   │   └── login/               # Authentication page
│   ├── components/              # Application-wide UI components
│   ├── features/                # Feature-specific UI, types, and workflows
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── shared/
│   ├── lib/                     # Frontend infrastructure, including API client
│   ├── public/                  # Static browser assets
│   └── package.json
│
├── backend/                     # Express API and database layer
│   ├── src/
│   │   ├── config/              # Environment and service configuration
│   │   ├── lib/                 # Prisma and HTTP infrastructure
│   │   ├── middleware/          # Authentication and authorization middleware
│   │   ├── modules/             # Domain modules and business rules
│   │   │   ├── activity/
│   │   │   ├── auth/
│   │   │   └── projects/
│   │   ├── app.ts               # Express middleware and API routes
│   │   └── server.ts            # API process entry point
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL data model
│   │   ├── migrations/          # Versioned database migrations
│   │   └── seed.ts              # Development users and sample data
│   └── package.json
│
├── packages/
│   └── shared/                  # Shared enums and dependency-light contracts
├── docs/
│   └── architecture.md          # Application architecture notes
├── docker-compose.yml            # Local PostgreSQL service
├── .env.example                 # Root environment reference
└── package.json                 # Workspace scripts
```

## Frontend and backend separation

### Frontend

The `frontend/` folder owns the browser experience:

- Next.js App Router pages.
- React components and feature workflows.
- Tailwind CSS styling.
- Loading, success, empty, and error states.
- API calls through the shared frontend client.

Frontend code must not import Prisma, access PostgreSQL directly, or make authorization decisions based on editable client state.

### Backend

The `backend/` folder owns the application service:

- Express REST API under `/api/v1`.
- Authentication and server-side sessions.
- Request validation.
- Role and project membership authorization.
- Project, task, comment, calendar, search, and notification queries.
- Optimistic concurrency checks.
- Prisma database access.
- Activity logging.

The backend is the authority for permissions and persistent application behavior.

## Run locally

### Requirements

- Node.js 20 or newer.
- npm.
- Docker Desktop or a local PostgreSQL 16 instance.

### Setup

From the repository root:

```bash
npm install
cp .env.example backend/.env
```

Set a long random value for `SESSION_SECRET` in `backend/.env`, then start PostgreSQL:

```bash
docker compose up -d
```

Create the database schema and development data:

```bash
npm run db:migrate
npm run db:seed
```

Start the frontend and backend together:

```bash
npm run dev
```

The applications run at:

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`
- API health check: `http://localhost:4000/api/v1/health`

## Development commands

Run these commands from the repository root:

```bash
npm run dev          # Start frontend and backend
npm run build        # Build both workspaces
npm run test         # Run backend tests
npm run db:generate  # Generate the Prisma client
npm run db:migrate   # Create/apply a development migration
npm run db:seed      # Insert development users and sample projects
```

To run one workspace independently:

```bash
npm run dev -w frontend
npm run dev -w backend
npm run build -w frontend
npm run build -w backend
```

## Development accounts

The seed script creates these accounts. They all use the password `InterComms123!`.

| Role | Email |
|---|---|
| Admin | `admin@intercomms.local` |
| Project Manager | `manager@intercomms.local` |
| Team Member | `member@intercomms.local` |
| Viewer / Client | `viewer@intercomms.local` |

The seed data includes:

- Website Relaunch.
- Project Alpha, created by the Admin.
- Project Beta, created by the Project Manager.
- Sample memberships and tasks for each project.

## Data and security principles

- Passwords are hashed with Argon2id.
- Session identifiers are stored server-side and sent through HTTP-only cookies.
- Authorization is enforced by the backend.
- Project and task data is filtered by the authenticated user’s access.
- Task mutations require the current task version and return `409` for stale updates.
- Activity records do not contain passwords, session tokens, or secret configuration.

For more detail about where to add new functionality, see [architecture.md](architecture.md).
