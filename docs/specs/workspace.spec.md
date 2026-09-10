### Problem Statement

Authenticated users need a way to create and organize workspaces. The creator must become the workspace owner automatically. Workspace owners need to add existing application users by email as managers or members, control access, and retain inactive workspace and membership history without deleting it.

### Solution

Provide a protected workspace REST API backed by workspace and workspace-membership records. Every signed-in user may create multiple workspaces. A new workspace makes its creator an active owner. Owners manage the workspace identity, lifecycle, membership lifecycle, and ownership transfer. Managers can be assigned and promoted or demoted, but do not control workspace identity or lifecycle. Members can view active workspace information and its members.

The API has separate workspace-detail and member-list reads. Lists support pagination, filtering, search, and sorting. Workspace and membership records use active/inactive status to preserve history. There are no email invitations, pending invitations, frontend work, or automated tests in this scope.

### User Stories

1. As a signed-in user, I want to create a workspace, so that I can organize work under my own workspace.
2. As a workspace creator, I want to become its owner automatically, so that the workspace has an accountable administrator immediately.
3. As a user, I want to give a workspace a name, so that people can identify it.
4. As a user, I want to give a workspace a unique URL-safe slug, so that it can be addressed predictably.
5. As a user, I want duplicate workspace slugs rejected, so that each workspace has a unique identifier.
6. As a user, I want to belong to multiple workspaces, so that I can participate in different teams.
7. As an owner, I want to update workspace name and slug, so that the workspace identity remains accurate.
8. As an owner, I want to add an existing application user by email, so that they can access my workspace.
9. As an owner, I want new people to be members by default, so that access starts with the least administrative privilege.
10. As an owner, I want to add a person directly as a manager when needed, so that they can help manage members.
11. As an owner, I want an unknown email rejected, so that only registered users can be added.
12. As an owner, I want a duplicate active membership rejected, so that a user has one clear role in a workspace.
13. As an owner, I want to promote a member to manager or demote a manager to member, so that access matches responsibility.
14. As an owner, I want to deactivate a manager or member, so that access can be removed while history remains.
15. As an owner, I want to reactivate a prior member and select their role, so that returning people regain appropriate access without a duplicate record.
16. As a manager, I want my role to be visible, so that I know my workspace responsibility.
17. As a manager, I want to be promoted or demoted by the owner, so that the owner controls my administrative access.
18. As a manager, I want no ability to change my own role, so that privilege changes remain controlled.
19. As a member, I want to view an active workspace, so that I can identify the workspace I belong to.
20. As an active member, I want to view active workspace members, so that I can see who is on the team.
21. As a workspace user, I want member name, email, identifier, and role returned, so that I can identify collaborators in this internal application.
22. As an owner, I want to deactivate and reactivate my workspace, so that I can pause it without losing its history.
23. As a member of an inactive workspace, I want read-only access to workspace and membership information, so that history remains visible.
24. As a user, I want writes blocked while a workspace is inactive, so that paused workspaces cannot be changed accidentally.
25. As an owner, I want to reactivate an inactive workspace, so that normal workspace changes can resume.
26. As an owner, I want to transfer ownership to an active member or manager, so that responsibility can change hands.
27. As a former owner, I want to become a manager after ownership transfer, so that the workspace continues to have one owner.
28. As a non-owner, I want to leave a workspace, so that I can remove my own access.
29. As an owner, I want to see my active workspaces by default, so that routine workspace selection is simple.
30. As an owner, I want to query inactive workspaces and memberships, so that I can manage historical access.
31. As a workspace user, I want paginated workspace and member lists, so that list responses stay manageable.
32. As a workspace user, I want to search workspace lists by name or slug, so that I can find a workspace quickly.
33. As a workspace user, I want to search member lists by name or email, so that I can find a person quickly.
34. As a workspace user, I want supported sorting on lists, so that I can order results for my task.
35. As an API consumer, I want predictable validation, conflict, authorization, and not-found errors, so that the client can handle failures correctly.

### Implementation Decisions

- Add a workspace feature module following the project feature structure, plus database entities and a migration. No existing auth behavior is changed.
- A workspace stores name, globally unique slug, active/inactive status, and standard creation and update timestamps.
- A workspace membership stores workspace reference, user reference, role, active/inactive status, and standard creation and update timestamps.
- Roles are `OWNER`, `MANAGER`, and `MEMBER`. Every workspace has one owner. A database uniqueness constraint prevents more than one membership for the same user and workspace.
- Every authenticated user may create a workspace. Creation persists the workspace and an active owner membership for the creator. Per product decision, this initial implementation does not wrap the writes in a database transaction.
- Workspace name is trimmed and must contain 1 to 100 characters. Workspace slug is globally unique, 3 to 64 characters, lowercase, and URL-safe kebab case with no leading, trailing, or repeated hyphens.
- Owner-only operations are workspace name/slug update, workspace activation/deactivation, membership activation/deactivation, manager/member role changes, and ownership transfer.
- Managers and members cannot update workspace identity or workspace status. Managers cannot change their own role. Managers do not deactivate memberships; only owners do.
- An inactive workspace permits active members to read workspace detail and member lists. It blocks all writes except owner reactivation.
- An inactive membership has no workspace access and is treated as not found. A person whose inactive membership is added again is reactivated in the existing record and receives the requested role; it is not a new membership.
- Ownership transfer requires an active existing member or manager as target. The target becomes owner and the old owner becomes manager. The owner cannot remove or deactivate their own owner membership; transfer occurs first.
- Removing a member is a membership status change to inactive, not a hard delete. Workspace deletion is not implemented.
- Workspace detail and member listing are separate reads. Workspace detail does not embed members.
- Protected API surface is: create workspace; list current user's workspaces; get workspace detail; update workspace; get workspace members; add an existing user by email and optional role; update a non-owner membership role; update workspace status; update membership status; transfer ownership; and leave a workspace as a non-owner.
- List endpoints default to active records, page 1, limit 10, and newest-first creation date. Maximum page limit is 100. Workspace lists search by name or slug and sort by name, slug, creation time, or update time. Member lists search by name or email and sort by name, email, role, creation time, or update time.
- Pagination defaults and limits live in common pagination constants and `BaseQueryDto`. Workspace statuses, roles, and supported sort fields stay with workspace unless another feature shares them.
- Error contract: unknown email, missing workspace, and inaccessible membership return 404; role denial returns 403; malformed input returns 400; duplicate slug or active membership returns 409.
- The application is internal, so member email may be returned to authorized active workspace members.

### Testing Decisions

- No automated tests are added in this feature scope.
- The intended highest test seam for later work is the protected HTTP API, using the existing end-to-end test setup and authenticated-cookie flow from the auth feature. Tests should verify observable API behavior rather than service internals.
- Later coverage should include creation ownership, role boundaries, inactive workspace and membership behavior, transfer ownership, duplicate constraints, list defaults, pagination, filtering, search, sorting, and HTTP error contracts.

### Out of Scope

- Frontend implementation.
- Email delivery, invitations, pending invitations, invitation expiry, resend flows, and accounts for unregistered email addresses.
- Workspace deletion and hard deletion of memberships.
- Audit logs beyond creation and update timestamps.
- Rate limiting and workspace/member count limits.
- Attaching any other domain records to workspaces.
- Database transactions for workspace creation and ownership transfer.
- Automated unit or end-to-end tests for this feature.

### Further Notes

- The project currently has authentication, users, and auth sessions only; workspace is the first protected business feature.
- Existing user email normalization is used for member lookup.
- No issue tracker configuration or triage-label vocabulary is available in the workspace. This local spec is written as requested; issue publication and the `ready-for-agent` label cannot be applied.
