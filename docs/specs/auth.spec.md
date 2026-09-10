### Problem Statement

Project Management API needs a small but realistic backend foundation that demonstrates NestJS modules, PostgreSQL migrations, TypeORM, DTO validation, JWT authentication, cookie handling, and protected APIs. Users need to create an account, sign in, remain signed in across refreshes, inspect active sessions, and end one or all sessions.

### Solution

Provide an auth-only REST API. It uses short-lived access JWTs and rotating refresh JWTs in HTTP-only cookies. PostgreSQL stores users and active session state. A user may have at most five active sessions; a sixth login removes oldest active session. Protected routes identify current user from access-token cookie.

### User Stories

1. As a new user, I want to register with name, email, and password, so that I can create an account.
2. As a user, I want email normalized before account lookup and storage, so that email casing does not create duplicate accounts.
3. As a user, I want duplicate registration rejected, so that each email maps to one account.
4. As a user, I want to log in with email and password, so that I can access protected resources.
5. As a user, I want registration to sign me in, so that I do not need a second login request.
6. As a signed-in user, I want access token cookie expiry after one hour, so that an exposed session has limited lifetime.
7. As a signed-in user, I want refresh token cookie expiry after seven days, so that I can resume a session without frequent login.
8. As a signed-in user, I want refresh tokens rotated, so that a previously used refresh token cannot keep a session alive.
9. As a signed-in user, I want to view my profile, so that I can confirm authenticated identity.
10. As a signed-in user, I want to view active sessions, so that I can see where my account is signed in.
11. As a signed-in user, I want each session shown with creation, last-use, expiry, and current-session state, so that I can understand active access.
12. As a user, I want only five active sessions, so that account access stays bounded.
13. As a user logging in on a sixth device, I want oldest session revoked, so that newest login succeeds.
14. As a signed-in user, I want to log out current session, so that current browser loses access.
15. As a signed-in user, I want to log out all sessions, so that I can end all active access.
16. As a browser client, I want auth cookies marked HTTP-only, so that browser JavaScript cannot read tokens.
17. As an API consumer, I want validation errors for malformed auth input, so that invalid requests fail predictably.

### Implementation Decisions

- Auth is current project scope. No protected business domain is included.
- Auth exposes `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, and `GET /auth/sessions`.
- Registration accepts `name`, `email`, and `password`. Name is 1–100 characters. Password minimum is eight characters. Email is trimmed and lowercased.
- Login accepts normalized email and password. Password hashes use Argon2 and are never returned.
- Access and refresh JWTs carry user ID, session ID, and token type. A token is accepted only for matching route purpose.
- Access JWT expires in one hour. Refresh JWT expires in seven days and is replaced after successful refresh.
- Cookies are named `access_token` and `refresh_token`. Both are HTTP-only and `SameSite=Lax`. Access cookie path is `/`; refresh cookie path is `/auth`. Cookies are `Secure` in production.
- Database has users and auth sessions. Sessions hold user reference, refresh-token hash, expiry, creation time, update time, and last-used time. Deleting user deletes sessions.
- Before a login session is created, expired sessions are removed. When five active sessions exist, oldest active session is deleted.
- Session list never returns refresh-token hashes. It returns ID, creation time, last-use time, expiry, and `isCurrent`.

### Out of Scope

- Frontend implementation.
- Tasks or any other protected business module.
- OAuth, email verification, password reset, account recovery, and device names.
- Rate limiting, login audit history, and advanced session management.


### Further Notes

- Environment values include database connection values, `JWT_SECRET`, `NODE_ENV`, and `PORT`.
- Migration history creates auth tables rather than relying on schema synchronization.
- Issue-tracker publishing and triage labeling are not performed because no project tracker or label vocabulary is configured in this workspace.
