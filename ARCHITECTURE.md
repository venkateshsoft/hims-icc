# HIMS-ICC Architecture Assessment and Target Architecture

**Assessment date:** 2026-11-07  
**Repository:** `C:\CodeX Projects\HIMS-ICC`

## 1. Repository assessment

The repository was inspected before implementation. It currently contains no files and is not initialized as a Git repository.

| Area | Current state | Decision |
|---|---|---|
| Application code | None | Establish a Next.js App Router application |
| Package/dependency manifest | None | Pin the requested Node/Next/Prisma versions in Phase 1 |
| Database/schema/migrations | None | Start with PostgreSQL + Prisma and tenant-aware migrations |
| Authentication/authorization | None | Implement server-side session authentication and RBAC before business workflows |
| UI/design system | None | Create a small reusable enterprise component system; avoid page-specific controls |
| Tests/CI | None | Add unit, integration, workflow, and tenant-isolation tests incrementally |
| Documentation | None | This document, `IMPLEMENTATION_PLAN.md`, `DEVELOPMENT_STATUS.md`, and README establish the baseline |
| Git history | None | Initialize version control only if/when the user wants the repository committed |

There is no existing functionality to reuse or protect. Phase 0 therefore focuses on decisions and boundaries rather than a superficial dashboard.

## 2. Product architecture

HIMS-ICC will be a multi-tenant implementation management system with these bounded contexts:

1. **Tenant and identity** — users, roles, permissions, organization/facility access, sessions, audit events.
2. **Organization profile** — organization hierarchy, implementation objectives, deployment model, jurisdiction and scope.
3. **Assessment and readiness** — question templates, responses, evidence, weighted readiness, critical blockers.
4. **HIMS catalogue and scope** — module definitions, dependencies, integrations, scope decisions.
5. **Delivery planning** — projects, phases, workstreams, tasks, milestones, dependencies, resources and RACI.
6. **Checklist and governance** — generated work items, evidence, reviews, approvals, risks, issues and assumptions.
7. **Validation** — requirements, traceability, test plans/cases/executions, defects and UAT.
8. **Operational transition** — go-live gates, exceptions, cutover, hypercare, closure and acceptance.
9. **Reporting and intelligence** — server-generated reports, dashboard projections and optional AI suggestions.

The contexts will share a tenant boundary and project reference, but business rules will remain in services rather than UI components or route handlers.

## 3. Proposed technical structure

```text
src/
  app/                         # App Router pages, layouts and route handlers
  components/                  # Reusable UI and data-display components
  features/                    # Domain-oriented UI and server actions
  server/
    auth/                      # Sessions, authorization and policy checks
    db/                        # Prisma client, transactions and repositories
    services/                  # Assessment, checklist, planning, validation services
    reports/                   # PDF/XLSX generation from application data
    intelligence/              # Provider-neutral AI suggestion interface
  lib/                         # Shared validation, dates, scoring and utilities
  types/                       # Shared public types
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/
  integration/
  workflows/
docs/
```

Recommended request flow:

```text
UI page/form -> server action or authenticated route handler
             -> Zod input schema
             -> authorization policy + tenant scope
             -> domain service transaction
             -> Prisma repository/query
             -> audit event where material
             -> typed result / user-facing error
```

Use server components for read-heavy views, client components only for interactive forms, filters, charts and workflow execution. No database credentials or AI provider keys may enter client bundles.

## 4. Data model boundary

Every tenant-owned record must carry `organizationId` directly or be reachable through a project/organization relationship that is enforced by the service layer. Repository methods should require an organization context; generic unscoped `findMany` methods are prohibited for tenant-owned data.

Core relationships:

```text
Organization
  -> Hospital -> Facility -> Department -> Unit
  -> UserMembership -> User -> Role/Permission
  -> ImplementationProject
       -> Phase -> Task -> ChecklistItem
       -> Milestone / RAID / Requirement / TestPlan / GoLiveAssessment / HypercareIncident
  -> Assessment -> Response -> Gap
  -> ModuleScope -> HIMSModule
```

The schema will use UUID identifiers, UTC timestamps, explicit status enums, foreign keys, uniqueness constraints for business keys, indexes on tenant/status/project filters, and soft deletion only for records where history must remain visible. Evidence and generated reports will store metadata in PostgreSQL and use a pluggable object-storage adapter; file contents will not be stored in arbitrary database text fields.

Important invariants:

- A project, assessment, checklist item, test execution, sign-off or report cannot be read or mutated outside its organization.
- A mandatory checklist item marked `Not Applicable` requires a reason and an authorized approval.
- Critical failed tests, unresolved critical defects, unreconciled migration data, missing mandatory approvals and unapproved exceptions block go-live.
- AI recommendations are suggestions with provenance and accept/modify/reject audit history; they cannot perform approvals or completion certification.
- Clinical, security and regulatory exceptions require human approval and an expiry/review date.

## 5. Readiness scoring model

Readiness will be transparent and will not be a plain average. Each assessment dimension receives a configurable weight and an evidence/confidence value. A suggested baseline is:

```text
dimension score = weighted response points × evidence confidence
overall score = sum(non-blocked dimension scores) / sum(weights)
```

The presentation must always show, separately:

- overall weighted score;
- critical blockers and their owners;
- high-severity gaps;
- unanswered/unknown responses;
- stale or missing evidence;
- score calculation version and last recalculation time.

Any hard blocker overrides a high numerical score for go-live status.

## 6. Security and compliance posture

- Secure, server-side session authentication with password hashing or a supported identity provider.
- RBAC plus organization/facility scope checks; permissions are evaluated on the server.
- Zod validation for all external input and safe upload validation for MIME type, extension, size and storage path.
- Structured audit logs for scope changes, approvals, sign-offs, exports, access changes and AI recommendation decisions.
- Secrets only in environment variables; redact credentials and tokens from logs and exports.
- Rate limiting and consistent error responses on sensitive endpoints.
- Configurable jurisdiction templates (India and other jurisdictions) rather than claims of certification.
- Backup, restore, retention and incident-response guidance documented before production hardening.

## 7. Key technical risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope is broad across clinical, financial and program domains | Delivery can become a collection of shallow screens | Build vertical workflows around acceptance criteria; every feature must persist and be testable |
| Tenant data leakage | Severe confidentiality failure | Organization-scoped repositories, policy tests, negative authorization tests and review of every route/action |
| Checklist generation becomes static | Core product value is lost | Versioned templates + generation rules using profile, modules, gaps, deployment and jurisdiction |
| Readiness score hides blockers | Unsafe go-live recommendation | Hard gates and blocker-first UI independent of percentage completion |
| Evidence/file handling is insecure | Sensitive implementation artifacts exposed | Storage abstraction, allowlist validation, access-controlled download URLs and audit logging |
| Reporting diverges from application state | Stakeholders lose trust | Generate reports from shared query services and test report totals against fixtures |
| AI recommendations become authoritative | Governance and safety risk | Explicit suggestion status, human decision workflow and immutable recommendation audit trail |
| Large datasets slow dashboards | Poor executive experience | Pagination, indexed queries, aggregate projections and date/tenant filters |

## 8. Architectural decisions to revisit

- Whether to use a managed identity provider or local credentials for the first deployable release.
- Object storage provider and malware scanning approach for evidence.
- PDF rendering strategy compatible with Vercel/serverless limits.
- Whether background jobs are needed for large report generation, migration reconciliation and notifications.
- Organization-level versus project-level billing/resource budgeting detail.

