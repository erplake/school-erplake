# Permissions Matrix (Initial Seed)

_Last updated: 2025-09-29_

This document enumerates permission codes used by the API and their default role grants (see Alembic migration `20250929_1025_rbac_permissions`). Future modules MUST add new codes here and a matching migration seeding logic.

## Legend
- Code format: `domain:action`.
- Role defaults are additive. User overrides (GRANT / REVOKE) adjust effective set.
- Admin role currently receives all seeded permissions by migration convention.

## Current Permissions
| Code | Description | Default Roles |
|------|-------------|---------------|
| students:list | List students | ADMIN, PRINCIPAL, CLASS_TEACHER, SUBJECT_TEACHER, PARENT, STUDENT |
| students:create | Create student | ADMIN |
| students:update | Update student | ADMIN |
| students:message | Send guardian message | ADMIN, CLASS_TEACHER |
| students:bonafide | Generate bonafide certificate | ADMIN, PRINCIPAL, CLASS_TEACHER |
| attendance:mark | Mark attendance | ADMIN, CLASS_TEACHER, SUBJECT_TEACHER |
| attendance:view | View attendance | ADMIN, PRINCIPAL, CLASS_TEACHER, SUBJECT_TEACHER, PARENT |
| fees:create_invoice | Create fee invoice | ADMIN, ACCOUNTANT |
| fees:view_invoice | View fee invoice | ADMIN, PRINCIPAL, ACCOUNTANT, PARENT |
| staff:list | List staff | ADMIN, PRINCIPAL |
| staff:detail | View staff detail | ADMIN, PRINCIPAL |
| staff:create | Create staff | ADMIN, PRINCIPAL |
| staff:update | Update staff record | ADMIN, PRINCIPAL |
| staff:leave | Manage staff leave | ADMIN, PRINCIPAL |
| transport:read | View transport entities | ADMIN, PRINCIPAL, TRANSPORT |
| transport:write | Create/Update transport entities | ADMIN, TRANSPORT |
| transport:maint | Log maintenance / incidents | ADMIN, TRANSPORT |
| transport:gps | Ingest GPS pings | ADMIN, TRANSPORT |

## Roadmap Placeholders (Not Yet Implemented)
| Planned Code | Module | Notes |
|--------------|--------|-------|
| gradebook:enter | Academics | Marks entry window gated |
| gradebook:moderate | Academics | Moderation step |
| report:publish | Academics | Approve & publish report cards |
| timetable:publish | Academics | Publish timetable window |
| fees:refund | Fees | Approve refunds |
| notifications:send | Comms | Bulk announcements |
| library:issue | Library | Issue circulation action |
| inventory:adjust | Inventory | Stock adjustments require approval |

## Contribution Workflow
1. Add new permission code to a new Alembic migration seeding `core.permission` & any role defaults in `core.role_permission`.
2. Update this matrix table.
3. Reference in PR description with rationale and spec section link.

## Open Questions
- Dynamic custom roles UI (future) – will require dropping enum constraint or adding custom role table.
- Permission dependency graph (e.g., update implies read) – not yet enforced centrally.

---
