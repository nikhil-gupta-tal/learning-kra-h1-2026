import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectTables1788615480000 implements MigrationInterface {
  name = 'CreateProjectTables1788615480000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"project_status_enum\" AS ENUM ('ACTIVE', 'INACTIVE')",
    );
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "workspaceId" integer NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" character varying(2000),
        "status" "project_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_projects_workspace_name" UNIQUE ("workspaceId", "name"),
        CONSTRAINT "FK_projects_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_projects_workspace_status" ON "projects" ("workspaceId", "status")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "projects"');
    await queryRunner.query('DROP TYPE "project_status_enum"');
  }
}
