import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1788014820000 implements MigrationInterface {
  name = 'CreateAuthTables1788014820000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "email" character varying(320) NOT NULL,
        "passwordHash" character varying NOT NULL,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" integer NOT NULL,
        "refreshTokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_auth_sessions_user_expiry" ON "auth_sessions" ("userId", "expiresAt")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "auth_sessions"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
