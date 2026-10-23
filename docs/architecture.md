# InterComms architecture

## Workspace boundaries

`frontend` is the browser application. It owns routes, feature UI, client-side state, and API calls. It never imports Prisma or backend code.

`backend` is the Express service. It owns authentication, authorization, validation, business rules, persistence, and activity logging. It never imports React or Next.js code.

`packages/shared` contains dependency-light contracts and enums that are safe to use in both applications.

## Frontend organization

- `app/`: Next.js route entry points only.
- `components/`: reusable application-wide layout and UI.
- `features/<domain>/`: domain-specific types, API hooks, components, and workflows.
- `lib/`: infrastructure helpers such as the typed API client.

New UI should be added to the relevant `features` directory and composed by a small route file.

## Backend organization

- `config/`: environment and service configuration.
- `lib/`: database and HTTP infrastructure.
- `middleware/`: authentication, validation, and error handling.
- `modules/<domain>/`: domain access rules, services, schemas, and routes.
- `prisma/`: schema, migrations, and seed data.

Database access belongs in backend modules or services; frontend components must use the API.
