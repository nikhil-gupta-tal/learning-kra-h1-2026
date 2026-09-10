import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceTables1788268320000 implements MigrationInterface {
  name = 'CreateWorkspaceTables1788268320000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"workspace_status_enum\" AS ENUM ('ACTIVE', 'INACTIVE')",
    );
    await queryRunner.query(
      "CREATE TYPE \"workspace_role_enum\" AS ENUM ('OWNER', 'MANAGER', 'MEMBER')",
    );
    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(64) NOT NULL,
        "status" "workspace_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "PK_workspaces_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspaces_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "workspace_members" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "workspaceId" integer NOT NULL,
        "userId" integer NOT NULL,
        "role" "workspace_role_enum" NOT NULL,
        "status" "workspace_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "PK_workspace_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_members_workspace_user" UNIQUE ("workspaceId", "userId"),
        CONSTRAINT "FK_workspace_members_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workspace_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_workspace_members_owner" ON "workspace_members" ("workspaceId") WHERE "role" = \'OWNER\'',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_workspace_members_user_status" ON "workspace_members" ("userId", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_workspace_members_workspace_status" ON "workspace_members" ("workspaceId", "status")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "workspace_members"');
    await queryRunner.query('DROP TABLE "workspaces"');
    await queryRunner.query('DROP TYPE "workspace_role_enum"');
    await queryRunner.query('DROP TYPE "workspace_status_enum"');
  }
}
