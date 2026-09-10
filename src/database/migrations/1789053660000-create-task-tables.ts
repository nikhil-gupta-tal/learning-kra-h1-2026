import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskTables1789053660000 implements MigrationInterface {
  name = 'CreateTaskTables1789053660000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"task_priority_enum\" AS ENUM ('LOW', 'MEDIUM', 'HIGH')",
    );
    await queryRunner.query(
      "CREATE TYPE \"task_status_enum\" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED')",
    );
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "projectId" integer NOT NULL,
        "createdByUserId" integer NOT NULL,
        "assignedToUserId" integer,
        "title" character varying(150) NOT NULL,
        "description" text,
        "dueDate" date,
        "priority" "task_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "status" "task_status_enum" NOT NULL DEFAULT 'TODO',
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_created_by_user" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_assigned_to_user" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_tasks_project_created_at" ON "tasks" ("projectId", "createdAt")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_tasks_assigned_to_user" ON "tasks" ("assignedToUserId")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tasks"');
    await queryRunner.query('DROP TYPE "task_status_enum"');
    await queryRunner.query('DROP TYPE "task_priority_enum"');
  }
}
