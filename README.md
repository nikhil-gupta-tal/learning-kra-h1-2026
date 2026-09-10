# Learning KRA

Backend API for teams to manage workspaces, projects, and tasks.

### Product

- Cookie-based JWT authentication and session management
- Workspaces with owner, manager, and member roles
- Workspace projects with lifecycle controls
- Project tasks with assignment, priority, status, and due date

### Stack

NestJS, TypeScript, PostgreSQL, TypeORM, and Docker Compose.

### Local setup

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Create `.env` from these local values.

   ```env
   NODE_ENV=development
   PORT=3000

   DATABASE_HOST=localhost
   DATABASE_PORT=5433
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_NAME=typeorm-db-dev

   JWT_SECRET=replace-with-a-long-random-secret
   ```

3. Start PostgreSQL and apply migrations.

   ```bash
   docker compose up -d
   pnpm run migration:run
   ```

4. Start API.

   ```bash
   pnpm run start:dev
   ```

PostgreSQL is exposed on port `5433`. Adminer is available on port `8081`.

### Tests

```bash
pnpm run test
pnpm run test:e2e
```

### API scope

- [Authentication and sessions](docs/specs/auth.spec.md)
- [Workspaces and memberships](docs/specs/workspace.spec.md)
- [Projects](docs/specs/project.spec.md)
- [Tasks](docs/specs/task.spec.md)
