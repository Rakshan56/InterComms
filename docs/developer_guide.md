# InterComms Developer Guide

This guide explains how to run InterComms locally and how to safely change different parts of the codebase.

## 1. Project at a glance

InterComms is a workspace application with two separately deployable applications:

```text
frontend/       Next.js and React user interface
backend/        Express API, authorization, and database access
packages/shared Shared enums and contracts
```

The frontend communicates with the backend over HTTP. The backend communicates with PostgreSQL through Prisma. The browser must never access PostgreSQL directly.

```text
Browser
  ↓
Next.js frontend :3000
  ↓ HTTP /api/v1
Express backend :4000
  ↓ Prisma
PostgreSQL :5432
```

## 2. Requirements

Install the following before starting:

- Node.js 20 or newer.
- npm.
- Docker Desktop, or PostgreSQL 16 running locally.

Check installed versions:

```bash
node --version
npm --version
docker --version
```

## 3. First-time setup

Run these commands from the repository root:

```bash
npm install
cp .env.example backend/.env
```

Open `backend/.env` and set a long random value for `SESSION_SECRET`.

Start PostgreSQL:

```bash
docker compose up -d
```

Create the database schema and seed development data:

```bash
npm run db:migrate
npm run db:seed
```

Generate the Prisma client whenever the schema changes:

```bash
npm run db:generate
```

## 4. Running the application

### Run frontend and backend together

```bash
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/api/v1/health`

### Run only the frontend

```bash
npm run dev -w frontend
```

### Run only the backend

```bash
npm run dev -w backend
```

### Stop the database

```bash
docker compose down
```

The database volume is preserved by default. To remove the local database volume, use the targeted command:

```bash
docker compose down -v
```

This deletes local PostgreSQL data and requires running migrations and seed again.

## 5. Development accounts

The seed script creates these accounts. Every account uses:

```text
InterComms123!
```

| Role | Email |
|---|---|
| Admin | `admin@intercomms.local` |
| Project Manager | `manager@intercomms.local` |
| Team Member | `member@intercomms.local` |
| Viewer / Client | `viewer@intercomms.local` |

The seed data includes Website Relaunch, Project Alpha, Project Beta, memberships, and sample tasks.

## 6. Where to edit frontend code

### Pages and routes

Next.js route files live in `frontend/app/`.

| User-facing area | File |
|---|---|
| Landing page | `frontend/app/page.tsx` |
| Login | `frontend/app/login/page.tsx` |
| Dashboard | `frontend/app/dashboard/page.tsx` |
| Projects | `frontend/app/projects/page.tsx` |
| Project tasks | `frontend/app/projects/[id]/tasks/page.tsx` |
| Project team | `frontend/app/projects/[id]/team/page.tsx` |
| Task details | `frontend/app/tasks/[id]/page.tsx` |
| Calendar | `frontend/app/calendar/page.tsx` |
| Notifications | `frontend/app/notifications/page.tsx` |
| Profile | `frontend/app/profile/page.tsx` |
| Users | `frontend/app/users/page.tsx` |

Keep route files small. A route should compose a page, load a feature, or pass route parameters. Reusable business UI belongs under `frontend/features/`.

### Shared layout and navigation

Edit `frontend/components/shell.tsx` to change:

- Sidebar navigation.
- Header layout.
- Search bar.
- Calendar and notification links.
- Current-user identity.
- Logout behavior.

Changes here affect nearly every authenticated page.

### Feature-specific UI

Use a feature folder when a component belongs to one product area:

```text
frontend/features/
├── dashboard/
│   ├── components/
│   └── types.ts
├── profile/
│   ├── components/
│   └── types.ts
└── shared/
    ├── api.ts
    └── types.ts
```

For a new feature:

1. Create `frontend/features/<feature-name>/`.
2. Add feature components under `components/`.
3. Add feature types under `types.ts`.
4. Add API hooks or feature API functions if needed.
5. Compose the feature from the corresponding `frontend/app/` route.

### Styling

- Global styles: `frontend/app/globals.css`.
- Tailwind configuration: `frontend/tailwind.config.ts`.
- Shared card and pill styles are defined in `globals.css`.
- Prefer the existing visual system before introducing new colors or spacing.

### API calls

The shared API client is:

```text
frontend/lib/api.ts
```

Use it instead of writing repeated `fetch` configuration:

```ts
const projects = await api<Project[]>("/projects");
```

The client sends credentials so the server-side session cookie is used.

## 7. Where to edit backend code

### Express entry points

- `backend/src/server.ts` starts the HTTP server.
- `backend/src/app.ts` configures Express and currently defines the REST endpoints.

Keep server startup separate from application configuration. Do not put database connection code in frontend files.

### Backend infrastructure

| Concern | Location |
|---|---|
| Environment values | `backend/src/config/env.ts` |
| Prisma client | `backend/src/lib/prisma.ts` |
| HTTP errors and params | `backend/src/lib/http.ts` |
| Authentication middleware | `backend/src/middleware/auth.ts` |
| Project access rules | `backend/src/modules/projects/access.ts` |
| Activity recording | `backend/src/modules/activity/service.ts` |

### Adding an API endpoint

1. Decide whether the endpoint is public or authenticated.
2. Add `auth` middleware for protected data.
3. Validate body, query, and route parameters with Zod.
4. Apply project membership and role authorization.
5. Query or mutate data through Prisma.
6. Record important mutations through the activity service.
7. Return the standard response shape:

```json
{
  "data": {}
}
```

Errors should use:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "A safe client-facing message."
  }
}
```

Never return password hashes, session identifiers, stack traces, or database error details.

## 8. Changing the database

The Prisma schema is:

```text
backend/prisma/schema.prisma
```

Workflow:

1. Edit the schema.
2. Create and apply a migration:

```bash
npm run db:migrate
```

3. Regenerate the Prisma client:

```bash
npm run db:generate
```

4. Update seed data if the new field is needed in development.
5. Update the backend endpoint and frontend types.
6. Run the full build.

Do not manually edit an already-applied migration. Create a new migration for follow-up changes.

## 9. Adding a new field

For a new project or task field:

1. Add it to `backend/prisma/schema.prisma`.
2. Run `npm run db:migrate`.
3. Add it to the relevant Zod request schema in `backend/src/app.ts` or its domain module.
4. Add it to the Prisma create/update operation.
5. Return it from the read endpoint when the frontend needs it.
6. Add the field to a frontend type.
7. Add the input or display component to the relevant feature.
8. Add seed data if useful for local testing.

## 10. Roles and authorization

The supported global roles are:

```text
ADMIN
PROJECT_MANAGER
TEAM_MEMBER
VIEWER
```

Authorization must be enforced in the backend. Hiding a button in the frontend is not sufficient.

When adding a protected action:

1. Check authentication.
2. Check the global role.
3. Check project membership where applicable.
4. Check whether the project is archived.
5. Return `403` for forbidden actions or `404` when resource concealment is appropriate.
6. Mirror the permission in the UI for a clear user experience.

Do not trust role values supplied by the browser.

## 11. Tasks and project progress

Project progress is calculated from task statuses:

```text
completed tasks / total tasks * 100
```

Only tasks with status `DONE` count as completed.

Task mutations use optimistic concurrency:

1. The client reads a task with `version`.
2. The client sends that version when updating.
3. The backend updates only if the version still matches.
4. A successful update increments the version.
5. A stale update returns HTTP `409`.

Any new task mutation must preserve this behavior. Do not add a status or assignment endpoint that bypasses version checking.

## 12. Adding or changing a page

For a new page:

1. Create a folder under `frontend/app/`.
2. Add a `page.tsx` route entry.
3. Add reusable UI under `frontend/features/<domain>/components/`.
4. Fetch persistent data through `frontend/lib/api.ts`.
5. Add loading, empty, error, and success states.
6. Add a navigation link if users need to discover the page.
7. Add or update the corresponding backend endpoint.

For a visual-only change, edit the relevant component and Tailwind classes. Do not duplicate the API logic in multiple pages.

## 13. Search, calendar, and notifications

These features use backend endpoints and should remain data-driven:

| Feature | Frontend | API |
|---|---|---|
| Search | `frontend/components/shell.tsx` | `GET /api/v1/search` |
| Calendar | `frontend/app/calendar/page.tsx` | `GET /api/v1/calendar` |
| Notifications | `frontend/app/notifications/page.tsx` | `GET /api/v1/notifications` |

When changing these features, preserve access filtering. A user must never receive search results, calendar tasks, or notifications for an inaccessible project.

## 14. Validation before finishing a change

Run the smallest relevant checks during development:

```bash
npm run build -w backend
npm run build -w frontend
```

Run the complete validation before handoff:

```bash
npm run build
npm run test
```

For database changes, also verify:

```bash
npm run db:generate
npm run db:migrate
```

Check the health endpoint:

```bash
curl http://localhost:4000/api/v1/health
```

## 15. Common problems

### Port already in use

The default ports are `3000` and `4000`. Find listeners:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:4000 -sTCP:LISTEN
```

Stop only the specific old process using the reported PID, then restart `npm run dev`.

### Database connection failure

Check that PostgreSQL is running:

```bash
docker compose ps
```

Check that `backend/.env` contains the correct `DATABASE_URL`.

### Prisma client or schema mismatch

Run:

```bash
npm run db:generate
npm run db:migrate
```

### Stale Next.js build artifacts

If Next.js references an old path after moving files, remove only the generated frontend build directory:

```bash
rm -rf frontend/.next
npm run build -w frontend
```

### Authentication appears stuck

- Confirm the API is running on port `4000`.
- Confirm the browser request uses credentials.
- Confirm `WEB_ORIGIN` matches `http://localhost:3000`.
- Log out and log in again to rotate the session.

## 16. Documentation map

- Product overview: [root README](../README.md)
- Technical overview: [tech_behind.md](tech_behind.md)
- Architecture boundaries: [architecture.md](architecture.md)
- Complete developer workflow: this guide

When adding a major reusable pattern or discovering a project-wide pitfall, update the relevant documentation so the next contributor can follow the same workflow.
