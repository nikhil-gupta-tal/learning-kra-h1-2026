### Problem Statement

Workspace teams need a way to break project work into trackable tasks. Active workspace members need to create, update, assign, complete, and remove tasks while retaining clear project scope, creator information, assignment details, due dates, and priority. Task activity must respect existing workspace and project lifecycle rules.

### Solution

Provide a protected, project-nested Task REST API. Every task belongs to one project and records its creator. A task may have no assignee; when assigned, the assignee must be an active member of the task's workspace. Active workspace members can manage tasks in active projects. Task lists and details expose creator and assignee identity plus their workspace membership role and status. Tasks are hard-deleted on request.

### User Stories

1. As an active workspace member, I want to create a task in an active project, so that project work can be recorded.
2. As an active workspace member, I want every task to belong to exactly one project, so that work has clear project scope.
3. As a task creator, I want my user identity recorded automatically, so that task origin is visible.
4. As an active workspace member, I want to give a task a required title, so that the work is identifiable.
5. As an active workspace member, I want to add an optional description, so that the task has useful context.
6. As an active workspace member, I want to create a task without a description, so that minimal task records are possible.
7. As an active workspace member, I want to set an optional due date, so that expected delivery can be tracked.
8. As an active workspace member, I want to create a task without a due date, so that undated work is supported.
9. As an active workspace member, I want to set a low, medium, or high priority, so that urgency is visible.
10. As an active workspace member, I want new tasks to start in TODO status, so that work state is predictable.
11. As an active workspace member, I want to change a task between TODO, IN_PROGRESS, and COMPLETED, so that progress is current.
12. As an active workspace member, I want to assign a task to an active workspace member, so that responsibility is clear.
13. As an active workspace member, I want to create an unassigned task, so that work can be triaged later.
14. As an active workspace member, I want to unassign a task, so that responsibility can be removed.
15. As an active workspace member, I want assignment to reject users outside my active workspace, so that cross-workspace assignment cannot happen.
16. As an active workspace member, I want assignment to reject inactive members, so that tasks are not assigned to people without workspace access.
17. As an active workspace member, I want to update normal task fields in one request, so that editing is simple.
18. As an active workspace member, I want to clear a task description or due date, so that obsolete information can be removed.
19. As an active workspace member, I want any active member to manage active-project tasks, so that task work has no extra task-specific role restriction in this version.
20. As an active workspace member, I want to list tasks in a project, so that I can find its work.
21. As an active workspace member, I want pagination, title search, status filtering, priority filtering, and assignee filtering, so that task lists stay usable.
22. As an active workspace member, I want task lists ordered newest first by default, so that recent work appears first.
23. As an active workspace member, I want task detail to show creator and assignee ID, name, email, workspace role, and membership status, so that responsibility is understandable.
24. As a workspace owner, I want read-only access to tasks in an inactive project, so that project history remains inspectable.
25. As a manager or member, I want inactive-project tasks treated as unavailable, so that inactive project history remains owner-only.
26. As an active workspace member, I want task reads to remain available while my workspace is inactive, so that workspace history is visible.
27. As an active workspace member, I want task writes rejected while the workspace is inactive, so that paused workspaces cannot change.
28. As an active workspace member, I want task writes rejected when the project is inactive, so that inactive project history cannot change.
29. As an active workspace member, I want an assignee cleared when that member becomes inactive, so that no task remains assigned to an inactive user.
30. As an active workspace member, I want to hard-delete an active-project task, so that invalid or unwanted task records can be removed.
31. As an API consumer, I want invalid input, unavailable records, inactive write restrictions, and invalid assignees to use predictable HTTP errors, so that clients can handle failures.

### Implementation Decisions

- Add a Task feature module, task database entity, database migration, task DTOs, and task response mapper. Register the module with the application. Existing authentication, workspace, and project behavior remains unchanged except the workspace member deactivation path must clear assignments for that member.
- A task has an immutable project reference, immutable creator user reference, nullable assignee user reference, title, nullable description, nullable due date, priority, status, creation time, and update time.
- Tasks belong to exactly one project. Task creation requires an active project in the route workspace. The task creator is always the authenticated request user and cannot be supplied or changed by the client.
- Task title is trimmed and must contain 1 to 150 characters after trimming. Description is nullable, has no length restriction or normalization, and may be cleared with `null`.
- Due date is nullable and date-only. It accepts a valid calendar date and may be cleared with `null`; no time or timezone is stored.
- Task priority values are `LOW`, `MEDIUM`, and `HIGH`; creation defaults to `MEDIUM`. Task status values are `TODO`, `IN_PROGRESS`, and `COMPLETED`; creation defaults to `TODO`. Any transition between the three statuses is allowed.
- Assignment is optional. Omitted assignment on creation creates an unassigned task. An explicit `assignedToUserId: null` on update unassigns the task. A non-null assignee must have an active membership in the route workspace. The same project may have tasks with duplicate titles.
- The protected API is nested under `/workspaces/:workspaceId/projects/:projectId/tasks`. It supports task creation, paginated task listing, task detail, one normal task update endpoint, and hard deletion. The normal update endpoint changes any mutable field, including status and assignment. Successful deletion returns `204 No Content`.
- Every task route requires active membership for the route workspace. For an active project, any active workspace member may create, list, read, update, assign, unassign, change status, and delete tasks. There are no task-specific permissions in this scope.
- Active members may read tasks while the workspace is inactive, but all task writes are forbidden. An inactive project permits task list and detail only to the workspace owner and forbids all task writes. Managers and members receive not found for inactive-project task access.
- The list endpoint supports `page`, `limit`, `search`, `status`, `priority`, and `assignedToUserId`. It defaults to page 1, limit 10, and newest-first creation time. The existing maximum page limit of 100 applies. Search matches task title. Lists return the existing `{ data, meta }` response shape. No due-date filter or custom sorting is added.
- Task responses expose task fields plus `createdBy` and nullable `assignedTo` user blocks. Each user block includes ID, name, email, current workspace role, and membership status. The creator remains visible if their membership later becomes inactive. The assignee is cleared when their membership becomes inactive; no assignment or role history is stored.
- Errors follow existing feature conventions: malformed DTO, query, enum, date, or ID input returns 400; inaccessible workspace, project, task, membership, or assignee returns 404; a write to an inactive workspace or inactive project returns 403. Hard-deleted tasks subsequently return 404.

### Testing Decisions

- The protected HTTP API is the sole primary test seam. Tests verify observable HTTP behavior rather than service internals, entities, or repository calls.
- End-to-end tests use authenticated-cookie users and the existing application test setup. Project protected-route behavior is the prior art for route nesting, workspace membership, inactive workspace reads, and project lifecycle visibility.
- Coverage includes task creation defaults and validation; immutable creator identity; active-member access; workspace isolation; assignment and unassignment; invalid, inactive, and cross-workspace assignees; date-only due dates; updates and nullable-field clearing; all status transitions; priority values; pagination, search, filters, and default ordering; inactive workspace and project rules; response user blocks; hard deletion; and 400, 403, and 404 contracts.

### Out of Scope

- Frontend implementation.
- Task soft deletion, restoration, archival, audit logs, assignment history, activity feeds, comments, attachments, labels, subtasks, dependencies, estimates, or recurring tasks.
- Due-time support, timezone handling, reminders, overdue automation, due-date filtering, and custom task sorting.
- Task-specific roles, creator-only permissions, assignee-only permissions, watchers, or notifications.
- Project movement, task movement between projects, and changes to existing auth, workspace lifecycle, project lifecycle, or workspace role rules other than clearing assignments when memberships are deactivated.

### Further Notes

- Task creator and assignee role data is live workspace membership data, not a historical snapshot.
- Existing user deletion behavior is not changed by this feature.
- No issue tracker configuration or triage-label vocabulary is available in this workspace. This local spec is drafted as requested; issue publication and the `ready-for-agent` label cannot be applied.
