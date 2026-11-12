# Portfolio Project Entry

## HIMS Implementation Command Center (HIMS-ICC)

**Role:** Principal Software Architect / Healthcare Implementation Product Lead  
**Type:** Enterprise healthcare SaaS command center  
**Stack:** Next.js 15.5.26, React 19, TypeScript, responsive CSS, PostgreSQL-ready Prisma schema

HIMS-ICC is an implementation governance platform for complex healthcare information system programs. It turns an organization profile, module scope and current-state assessment into an evidence-backed delivery plan with readiness gates.

### Demonstrated capabilities

- Executive dashboard for implementation progress, module readiness, gaps and go-live gates.
- Synthetic multi-hospital Meridian Network tenant with hospitals, facilities and implementation context.
- Scope-aware HIMS module catalogue across clinical, financial and enterprise domains.
- Dynamic checklist workspace with status changes persisted in the browser demo store.
- Functional quick-create workflows for new projects, organizations, HIMS modules, generated checklist items and roadmap milestones, with validated modal forms and local demo persistence.
- Phase roadmap, critical-path dependencies, testing/UAT results and RAID governance views.
- Blocker-driven go-live readiness decision that does not equate completion percentage with safety.
- PostgreSQL/Prisma data contract designed for tenant isolation, audit logging and workflow expansion.

### Portfolio framing

This project demonstrates healthcare implementation leadership beyond generic project tracking: current-state assessment, dependency-aware planning, evidence-led validation, hard readiness gates and controlled transition to hypercare.

### Local demo

```text
npm install
npm run dev
http://localhost:3000
```
