### Production Docker Deployment

This deployment runs only PostgreSQL and the NestJS app. There are no separate
migration or seed services.

App startup runs database migrations, seed data, then NestJS.

### Prerequisites

- Install Docker Engine and Docker Compose plugin on the EC2 instance.
- Clone this repository on the EC2 instance.
- Run all commands from repository root.
- Do not commit `.env.production`.

### Create Production Environment File

Create `.env.production` on EC2:

```bash
touch .env.production
chmod 600 .env.production
```

Add these values to `.env.production`:

```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<strong-unique-database-password>
DATABASE_NAME=learning_kra
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<same-as-DATABASE_PASSWORD>
POSTGRES_DB=learning_kra
JWT_SECRET=<long-random-secret>
```

Keep `DATABASE_HOST=postgres`. It is Docker service name, not EC2 hostname.
Do not use `localhost` here. Production Compose does not expose PostgreSQL port.
Keep each `POSTGRES_*` value equal to matching `DATABASE_*` value. Both services
load `.env.production`, so Compose commands need no `--env-file` option.

### First Deployment

Build image and start services:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Docker Compose starts PostgreSQL first. App starts only after PostgreSQL health
check passes. App then performs this order:

1. Run pending migrations.
2. Run seed data.
3. Start NestJS only when migration and seed succeed.

Check service status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check app startup logs. Wait for seed completion before health check:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

Test app from EC2 instance:

```bash
curl --fail http://localhost:3000/health
```

### Deploy Update

Pull new source, rebuild image, run migration and seed, then restart app:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Do not use `docker compose down -v` for normal updates. It deletes PostgreSQL
volume and all database data.

### Seed Data

Docker runs seed data every time app container starts or restarts. Current seed
process recreates existing seed memberships and tasks. Use this deployment flow
only when this behavior is acceptable for this app. Keep seed process
idempotent and safe for production.
