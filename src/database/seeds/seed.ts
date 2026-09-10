import { faker } from '@faker-js/faker';
import { DataSource, EntityManager } from 'typeorm';
import { ProjectStatus } from '@/common/enums/project.enums';
import { TaskPriority, TaskStatus } from '@/common/enums/task.enums';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import dataSource from '@/database/config';
import { Project } from '@/database/entities/project.entity';
import { Task } from '@/database/entities/task.entity';
import { User } from '@/database/entities/user.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { Workspace } from '@/database/entities/workspace.entity';
import { hashValue } from '@/modules/auth/utils/password.util';

const SEED_PASSWORD = 'SeedPass!2026';
const FAKER_SEED = 20_260_910;
const USER_COUNT = 10;
const ACTIVE_PROJECT_COUNT = 5;
const INACTIVE_PROJECT_COUNT = 2;
const TASKS_PER_PROJECT = 10;

type SeedWorkspace = {
  slug: string;
  members: Array<{ userIndex: number; role: WorkspaceRole }>;
};

const seedWorkspaces: SeedWorkspace[] = [
  {
    slug: 'seed-workspace-1',
    members: [
      { userIndex: 0, role: WorkspaceRole.OWNER },
      { userIndex: 5, role: WorkspaceRole.MANAGER },
      { userIndex: 6, role: WorkspaceRole.MEMBER },
      { userIndex: 7, role: WorkspaceRole.MEMBER },
    ],
  },
  {
    slug: 'seed-workspace-2',
    members: [
      { userIndex: 1, role: WorkspaceRole.OWNER },
      { userIndex: 8, role: WorkspaceRole.MANAGER },
      { userIndex: 9, role: WorkspaceRole.MEMBER },
      { userIndex: 5, role: WorkspaceRole.MEMBER },
    ],
  },
  {
    slug: 'seed-workspace-3',
    members: [
      { userIndex: 2, role: WorkspaceRole.OWNER },
      { userIndex: 6, role: WorkspaceRole.MANAGER },
      { userIndex: 7, role: WorkspaceRole.MANAGER },
      { userIndex: 8, role: WorkspaceRole.MEMBER },
      { userIndex: 9, role: WorkspaceRole.MEMBER },
      { userIndex: 5, role: WorkspaceRole.MEMBER },
      { userIndex: 0, role: WorkspaceRole.MEMBER },
    ],
  },
  {
    slug: 'seed-workspace-4',
    members: [
      { userIndex: 3, role: WorkspaceRole.OWNER },
      { userIndex: 8, role: WorkspaceRole.MANAGER },
      { userIndex: 9, role: WorkspaceRole.MANAGER },
      { userIndex: 5, role: WorkspaceRole.MEMBER },
      { userIndex: 6, role: WorkspaceRole.MEMBER },
      { userIndex: 7, role: WorkspaceRole.MEMBER },
      { userIndex: 0, role: WorkspaceRole.MEMBER },
    ],
  },
  {
    slug: 'seed-workspace-5',
    members: [{ userIndex: 4, role: WorkspaceRole.OWNER }],
  },
];

const seedUsers = async (manager: EntityManager) => {
  const passwordHash = await hashValue(SEED_PASSWORD);
  const userRepository = manager.getRepository(User);

  await userRepository.upsert(
    Array.from({ length: USER_COUNT }, (_, index) => ({
      name: faker.person.fullName(),
      email: `seed.user${index + 1}@example.com`,
      passwordHash,
    })),
    ['email'],
  );

  const users: User[] = [];

  for (let index = 0; index < USER_COUNT; index += 1) {
    users.push(
      await userRepository.findOneByOrFail({
        email: `seed.user${index + 1}@example.com`,
      }),
    );
  }

  return users;
};

const seedTasks = async (
  manager: EntityManager,
  project: Project,
  memberUserIds: number[],
) => {
  const taskRepository = manager.getRepository(Task);

  await taskRepository.delete({ projectId: project.id });

  await taskRepository.save(
    Array.from({ length: TASKS_PER_PROJECT }, (_, index) => ({
      projectId: project.id,
      createdByUserId: memberUserIds[index % memberUserIds.length],
      assignedToUserId:
        index % 4 === 0
          ? null
          : memberUserIds[(index + 1) % memberUserIds.length],
      title: `Seed task ${index + 1}: ${faker.lorem.words(5)}`,
      description: index % 3 === 0 ? null : faker.lorem.paragraph(),
      dueDate:
        index % 4 === 0
          ? null
          : faker.date
              .between({ from: '2026-01-01', to: '2026-12-31' })
              .toISOString()
              .slice(0, 10),
      priority: [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH][
        index % 3
      ],
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED][
        index % 3
      ],
    })),
  );
};

const seedWorkspace = async (
  manager: EntityManager,
  seedWorkspace: SeedWorkspace,
  workspaceIndex: number,
  users: User[],
) => {
  const workspaceRepository = manager.getRepository(Workspace);
  const memberRepository = manager.getRepository(WorkspaceMember);
  const projectRepository = manager.getRepository(Project);

  await workspaceRepository.upsert(
    {
      name: `${faker.company.name()} Workspace`,
      slug: seedWorkspace.slug,
      status: WorkspaceStatus.ACTIVE,
    },
    ['slug'],
  );

  const workspace = await workspaceRepository.findOneByOrFail({
    slug: seedWorkspace.slug,
  });

  await memberRepository.delete({ workspaceId: workspace.id });
  await memberRepository.save(
    seedWorkspace.members.map(({ userIndex, role }) => ({
      workspaceId: workspace.id,
      userId: users[userIndex].id,
      role,
      status: WorkspaceStatus.ACTIVE,
    })),
  );

  const memberUserIds = seedWorkspace.members.map(
    ({ userIndex }) => users[userIndex].id,
  );

  for (
    let projectIndex = 0;
    projectIndex < ACTIVE_PROJECT_COUNT + INACTIVE_PROJECT_COUNT;
    projectIndex += 1
  ) {
    const status =
      projectIndex < ACTIVE_PROJECT_COUNT
        ? ProjectStatus.ACTIVE
        : ProjectStatus.INACTIVE;
    const projectNumber = projectIndex + 1;
    const name = `Seed workspace ${workspaceIndex + 1} project ${projectNumber}`;

    await projectRepository.upsert(
      {
        workspaceId: workspace.id,
        name,
        description: faker.company.catchPhrase(),
        status,
      },
      ['workspaceId', 'name'],
    );

    const project = await projectRepository.findOneByOrFail({
      workspaceId: workspace.id,
      name,
    });
    await seedTasks(manager, project, memberUserIds);
  }
};

const verifySeed = async (manager: EntityManager) => {
  const workspaceRepository = manager.getRepository(Workspace);
  const projectRepository = manager.getRepository(Project);
  const taskRepository = manager.getRepository(Task);
  const userRepository = manager.getRepository(User);
  const memberRepository = manager.getRepository(WorkspaceMember);
  const workspaces: Workspace[] = [];

  for (const { slug } of seedWorkspaces) {
    workspaces.push(await workspaceRepository.findOneByOrFail({ slug }));
  }
  const workspaceIds = workspaces.map(({ id }) => id);
  const projects = await projectRepository
    .createQueryBuilder('project')
    .where('project.workspaceId IN (:...workspaceIds)', { workspaceIds })
    .andWhere('project.name LIKE :seedProjectName', {
      seedProjectName: 'Seed workspace % project %',
    })
    .getMany();
  const projectIds = projects.map(({ id }) => id);

  const users = await userRepository
    .createQueryBuilder('user')
    .where('user.email LIKE :seedEmail', { seedEmail: 'seed.user%@example.com' })
    .getCount();
  const memberships = await memberRepository
    .createQueryBuilder('membership')
    .where('membership.workspaceId IN (:...workspaceIds)', { workspaceIds })
    .getCount();
  const tasks = await taskRepository
    .createQueryBuilder('task')
    .where('task.projectId IN (:...projectIds)', { projectIds })
    .getCount();

  if (
    users !== USER_COUNT ||
    workspaces.length !== 5 ||
    projects.length !== 35 ||
    memberships !== 23 ||
    tasks !== 350
  ) {
    throw new Error(
      `Seed verification failed: users=${users}, workspaces=${workspaces.length}, projects=${projects.length}, memberships=${memberships}, tasks=${tasks}.`,
    );
  }
};

const seed = async (source: DataSource) => {
  faker.seed(FAKER_SEED);

  if (!source.isInitialized) {
    await source.initialize();
  }

  await source.transaction(async (manager) => {
    const users = await seedUsers(manager);

    for (const [workspaceIndex, workspaceDefinition] of seedWorkspaces.entries()) {
      await seedWorkspace(manager, workspaceDefinition, workspaceIndex, users);
    }

    await verifySeed(manager);
  });
};

seed(dataSource)
  .then(() => {
    console.log('Seed complete: 10 users, 5 workspaces, 35 projects, 350 tasks.');
  })
  .catch((error: unknown) => {
    console.error('Seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
