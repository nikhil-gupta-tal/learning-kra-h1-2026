### Project Structure

This document defines the folder rules for new code and future refactors.

```text
src/
  common/                 # App-wide NestJS framework code
    constants/            # App-wide constants shared by feature modules
    decorators/
    dto/                  # Shared request DTO base classes
    enums/                # App-wide enums shared by feature modules
    filters/
    guards/
    interceptors/
    mappers/              # Shared API response mappers
    pipes/
    utils/                # App-wide pure helper functions
  database/
    entities/             # All database entities
    migrations/           # Database schema migrations
  modules/
    <feature>/
      constants/          # Feature-only constants, when needed
      dto/
      utils/              # Feature-only helpers, when needed
      <feature>.controller.ts
      <feature>.module.ts
      <feature>.service.spec.ts
      <feature>.service.ts
test/                     # End-to-end tests only
```

### Entity and Migration Rules

- Put every new entity in `src/database/entities/`.
- Name entities in kebab case with the `.entity.ts` suffix, for example `user.entity.ts`.
- Add a migration in `src/database/migrations/` for every database schema change.
- Do not depend on database auto-sync outside local development.

### Constants and Utils Rules

- Create a module `constants/` or `utils/` folder only when it contains at least one named constant or helper.
- Keep code in `src/modules/<feature>/constants/` or `src/modules/<feature>/utils/` when it belongs to one feature.
- Promote code to `src/common/constants/` or `src/common/utils/` only when at least two separate feature modules use it and it has no feature-specific business rule.
- Move a promoted constant or utility together with its imports and tests.
- Do not create `helpers/`, `shared/`, `common-utils/`, or duplicate utility folders for the same purpose.

### Common NestJS Code

- Put app-wide NestJS decorators, DTO base classes, enums, filters, guards, interceptors, mappers, pipes, and utilities in `src/common/`.
- Put response-only transformations in `src/common/mappers/`.
- Services must use response mappers and must not return entities directly.
- Put reusable pure utilities, including database error checks, in `src/common/utils/`.
- Keep feature-only NestJS code inside its feature module.
- Do not use barrel `index.ts` files by default. Prefer direct imports to keep ownership visible and reduce circular-dependency risk.

### Naming and Tests

- Use kebab case for folders and files.
- Use the `@/` alias from `tsconfig.json` for imports under `src/` only when a relative import moves up directory levels, such as `../modules` or `../../../modules`. Keep same-folder imports relative, such as `./utils` and `./dto`.
- Use role suffixes for NestJS files, for example `auth.service.ts`, `create-user.dto.ts`, and `auth.constants.ts`.
- Use PascalCase for TypeScript classes.
- Colocate unit tests with their feature code, for example `src/modules/auth/auth.service.spec.ts`.
- Keep end-to-end tests in `test/`.
