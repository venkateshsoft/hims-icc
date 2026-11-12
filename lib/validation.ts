import { z } from "zod";

export const requirementSchema = z.object({
  key: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.string().min(2),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  projectId: z.string().uuid().optional(),
});

export const executionSchema = z.object({
  testCaseId: z.string().uuid(),
  result: z.enum(["PASSED", "FAILED", "BLOCKED"]),
  tester: z.string().min(2),
  evidenceTitle: z.string().optional(),
  evidenceNotes: z.string().optional(),
});

export const defectSchema = z.object({
  key: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(3),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  requirementId: z.string().uuid().optional(),
  testExecutionId: z.string().uuid().optional(),
  owner: z.string().optional(),
});

export const hypercareSchema = z.object({
  key: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(3),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  owner: z.string().optional(),
  slaDueAt: z.string().datetime().optional(),
});

export type GateInput = {
  mandatoryRequirementsApproved: boolean;
  mandatoryTestsPassed: boolean;
  criticalDefectsClosed: boolean;
  migrationReconciled: boolean;
  uatApproved: boolean;
  securityApproved: boolean;
  cutoverPlanApproved: boolean;
  operationalSupportReady: boolean;
};

export function evaluateGoLiveGates(input: GateInput) {
  const gates = [
    ["REQUIREMENTS", "Mandatory requirements approved", input.mandatoryRequirementsApproved, "All critical and mandatory requirements need an approved traceability record."],
    ["TESTS", "Mandatory test coverage passed", input.mandatoryTestsPassed, "Every mandatory test must have a passed execution."],
    ["DEFECTS", "Critical defects closed", input.criticalDefectsClosed, "Critical and high-severity open defects block go-live."],
    ["MIGRATION", "Data migration reconciled", input.migrationReconciled, "Migration reconciliation evidence and sign-off are required."],
    ["UAT", "UAT approval", input.uatApproved, "Customer UAT approval with evidence is required."],
    ["SECURITY", "Security approval", input.securityApproved, "Security approval cannot be inferred from test completion."],
    ["CUTOVER", "Cutover and rollback plan approved", input.cutoverPlanApproved, "Approved cutover and rollback plans are mandatory."],
    ["OPERATIONS", "Operational support ready", input.operationalSupportReady, "Support ownership and escalation coverage must be ready."],
  ] as const;
  const blockers = gates.filter(([, , passed]) => !passed).map(([code, label, , detail]) => ({ code, label, detail }));
  return { decision: blockers.length ? "NOT_READY" : "READY", gates: gates.map(([code, label, passed, detail]) => ({ code, label, passed, mandatory: true, detail })), blockers };
}

export function buildValidationReport(input: {
  organizationName: string;
  requirements: { key: string; title: string; status: string; priority: string }[];
  tests: { key: string; title: string; result: string }[];
  defects: { key: string; title: string; severity: string; status: string }[];
  incidents: { key: string; title: string; severity: string; status: string }[];
  readiness: ReturnType<typeof evaluateGoLiveGates>;
  exceptions: { title: string; justification: string; status: string }[];
}) {
  const unresolvedRisks = input.defects.filter(d => d.status !== "CLOSED").concat(input.incidents.filter(i => i.status !== "RESOLVED").map(i => ({ ...i, severity: i.severity, status: i.status })));
  return {
    generatedAt: new Date().toISOString(),
    organizationName: input.organizationName,
    executiveDecision: input.readiness.decision,
    requirements: { total: input.requirements.length, approved: input.requirements.filter(r => r.status === "APPROVED").length, uncovered: input.requirements.filter(r => r.status !== "APPROVED").map(r => r.key) },
    testing: { total: input.tests.length, passed: input.tests.filter(t => t.result === "PASSED").length, failed: input.tests.filter(t => t.result === "FAILED").length, blocked: input.tests.filter(t => t.result === "BLOCKED").length },
    unresolvedRisks,
    exceptions: input.exceptions,
    readiness: input.readiness,
    conclusion: input.readiness.decision === "READY" ? "Mandatory validation gates are satisfied based on the recorded evidence." : "Implementation is not ready for go-live. Resolve the listed blockers or obtain separately governed exceptions before approval.",
  };
}
