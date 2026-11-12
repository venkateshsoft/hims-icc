# HIMS Implementation Command Center (HIMS-ICC)

HIMS-ICC is planned as an enterprise implementation assessment, planning, governance and validation platform for healthcare information system programs.

The repository is currently at Phase 0. No application code has been generated yet. The architecture and delivery sequence are documented in:

- [ARCHITECTURE.md](ARCHITECTURE.md) — repository assessment, target architecture, data boundaries, security and risks.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — phased implementation and verification gates.
- [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) — current completion state, defects and next phase.

The intended implementation stack is Next.js 15.5.26, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma 6.19.3 and server-side validation with Zod, subject to confirming the final dependency versions during Phase 1.

All demonstration data will be synthetic. The product will provide configurable assessment templates and must not claim regulatory certification merely because a framework checklist is present.

## Portfolio

See [PORTFOLIO_ENTRY.md](PORTFOLIO_ENTRY.md) for a concise, portfolio-ready description of the product, architecture and demonstrated healthcare implementation capabilities.

## Phase 2 development

The Phase 2 workspace is available at `/phase2` and provides organization onboarding, HIMS module scope, current-state assessment, transactional PostgreSQL submission, derived gap analysis and weighted readiness scoring.

To enable the database workflow, copy `.env.example` to `.env.local`, set `DATABASE_URL` to a PostgreSQL/Neon connection string, then run:

```text
npx prisma migrate dev --name phase2_assessment
npm run prisma:seed
npm run dev
```

The seed creates the synthetic Meridian Multispecialty Hospital Network, module catalogue, assessment questions, assessment responses and response-derived gaps. The app does not use seeded patient data or PHI.

## Validation and transition control

The validation workspace is available at `/validation`. It provides requirements traceability, evidence-linked test execution, defect tracking, mandatory go-live gates, human approval control, hypercare incidents and a downloadable Markdown implementation validation report.

Go-live approval is evaluated on the server. It is rejected when mandatory requirements are not approved, mandatory tests are not passed, critical/high defects remain open, migration reconciliation is missing, UAT/security/operations approvals are missing, or the cutover/rollback plan is not approved.
