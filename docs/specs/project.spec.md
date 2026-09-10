### Problem Statement

Workspace teams need a way to record projects inside the workspace where the work belongs. Owners and managers need to create and maintain those projects, while owners alone must be able to deactivate and later reactivate them without losing project history. All active workspace members need to read the active project list. There is no project-count quota.

### Solution

Provide a protected, workspace-nested Project REST API. Each project belongs to exactly one workspace and has a name, optional description, active/inactive status, and standard timestamps. Active workspace owners and managers can create and update active projects. Active workspace members can read active projects. Only the active workspace owner can change a project's status. Inactive projects remain preserved as soft-deleted history and are visible only to the owner.

### User Stories

1. As an active workspace owner, I want to create a project in my workspace, so that I can organize workspace work.
2. As an active workspace manager, I want to create a project in my assigned workspace, so that I can help organize team work.
3. As a workspace owner or manager, I want to name a project, so that the team can identify it.
4. As a workspace owner or manager, I want to add an optional project description, so that the project has useful context.
5. As a workspace owner or manager, I want to create a project without a description, so that a short project record is enough when detail is unavailable.
6. As a workspace owner or manager, I want to clear a project description, so that obsolete context is removed.
7. As a workspace owner or manager, I want duplicate project names in one workspace rejected, so that project identity remains clear.
8. As a workspace owner or manager, I want the same project name usable in a different workspace, so that workspaces remain independent.
9. As an active workspace member, I want to list active projects in my workspace, so that I can find current work.
10. As an active workspace member, I want to view an active project, so that I can see its details.
11. As an active workspace member, I want project lists paginated and searchable by name, so that large project lists remain usable.
12. As a workspace owner, I want inactive projects hidden from the default list, so that routine work views contain only current projects.
13. As a workspace owner, I want to list inactive projects explicitly, so that I can manage historical projects.
14. As a workspace owner, I want to view an inactive project, so that I can inspect it before reactivation.
15. As a workspace manager or member, I want an inactive project treated as unavailable, so that only the owner can access soft-deleted history.
16. As a workspace owner, I want to deactivate an active project, so that it is soft-deleted without losing its history.
17. As a workspace owner, I want to reactivate an inactive project, so that paused work can resume.
18. As a workspace manager, I want no ability to change project status, so that project lifecycle control stays with the owner.
19. As a workspace owner or manager, I want inactive projects blocked from normal edits, so that historical records cannot change accidentally.
20. As a workspace user, I want project writes blocked while my workspace is inactive, so that a paused workspace cannot be changed accidentally.
21. As a workspace user, I want to read projects while my workspace is inactive, so that project history remains available.
22. As an API consumer, I want predictable validation, conflict, authorization, and not-found errors, so that the client can handle project failures correctly.
23. As a workspace owner or manager, I want no cap on project creation, so that the workspace is not artificially limited.

### Implementation Decisions

- Add a Project feature module, a Project database entity, and one database migration. The module follows the repository feature structure; no auth or workspace behavior is changed.
- A project has one immutable workspace reference, `name`, nullable `description`, `status`, and standard creation and update timestamps. A project cannot be moved between workspaces.
- Project status uses the existing `ACTIVE` and `INACTIVE` lifecycle values. Setting status to `INACTIVE` is the project's soft-delete operation; there is no `deletedAt` column and no hard-delete API.
- Project name is trimmed, required on creation, and must contain 1 to 150 characters after trimming. Description is optional and nullable with no length limit or normalization. An update may set description to `null` to clear it.
- A database uniqueness constraint covers workspace and project name across both active and inactive projects. A soft-deleted project keeps its name reserved; no partial unique index is used.
- The protected API is nested under `/workspaces/:workspaceId/projects`: create a project; list projects; get project detail; update a project; and update project status at `/workspaces/:workspaceId/projects/:projectId/status`.
- List projects uses `page`, `limit`, `search`, and `status` query parameters. It defaults to active projects, page 1, limit 10, and newest-first creation date. The existing maximum page limit of 100 applies. Search matches project name. Custom sorting is not added.
- Only the workspace owner may request `status=INACTIVE` in the project list. The owner may retrieve an inactive project's detail without a special query parameter. A manager or member requesting an inactive project receives not found.
- Every operation requires an active membership for the route workspace. Active owner and manager roles may create and update active projects. Any active workspace member may list and get active projects. Only the owner may change project status.
- Project writes reuse the workspace write rule: an inactive workspace rejects create, update, deactivate, and reactivate operations. Reads remain allowed to active members of an inactive workspace according to project-status visibility rules.
- Updating an inactive project is forbidden for every role. Reactivation succeeds only for the workspace owner and only when the workspace is active.
- Responses expose project identifiers, workspace identifier, name, description, status, creation time, and update time. Lists use the existing `{ data, meta }` paginated response shape.
- Errors follow workspace conventions: inaccessible workspace or project returns 404; role or inactive-workspace write denial returns 403; invalid DTO or query input returns 400; duplicate workspace/project name returns 409.
- There is no project-count quota, per-workspace limit, ownership field on a project, or project-specific manager assignment.

### Testing Decisions

- The highest existing test seam is the protected HTTP API. Project behavior should be tested through its HTTP routes with authenticated-cookie users and workspace memberships, following the application's end-to-end test setup.
- Tests verify observable behavior, not service internals or repository calls.
- Coverage includes create and update authorization for owner, manager, and member; membership isolation between workspaces; active/inactive workspace rules; project status transitions; inactive-project visibility; duplicate names across active and inactive records; validation; pagination; default ordering; search; and 400, 403, 404, and 409 contracts.
- The existing workspace protected-route conventions and auth cookie flow are prior art for project route tests. Feature service tests may be colocated when they add value, but HTTP behavior remains the primary seam.

### Out of Scope

- Frontend implementation.
- Project hard deletion, restore history, audit logs, and `deletedAt` timestamps.
- Project movement between workspaces.
- Custom list sorting, filters beyond name search and status, or a project-count quota.
- Project members, project-specific roles, assignments, tasks, deadlines, clients, labels, or other project metadata.
- Changes to authentication, workspace membership, workspace ownership, or workspace lifecycle behavior.

### Further Notes

- The owner controls project lifecycle. Managers are limited to creation and normal edits of active projects in their assigned workspace.
- This spec uses the existing workspace meaning of active membership: a user without active membership has no project access.
- No issue tracker configuration or triage-label vocabulary is available in this workspace. This local spec is written as requested; issue publication and the `ready-for-agent` label cannot be applied.
