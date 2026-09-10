import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProjectDescriptionType1788627780000 implements MigrationInterface {
  name = 'UpdateProjectDescriptionType1788627780000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "projects" ALTER COLUMN "description" TYPE text',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "projects" ALTER COLUMN "description" TYPE character varying(2000)',
    );
  }
}
