import { describe, expect, it } from "vitest";
import { buildValidationReport, evaluateGoLiveGates } from "../lib/validation";

describe("go-live validation controls", () => {
  it("blocks approval when any mandatory gate fails", () => {
    const result = evaluateGoLiveGates({ mandatoryRequirementsApproved: true, mandatoryTestsPassed: true, criticalDefectsClosed: false, migrationReconciled: true, uatApproved: true, securityApproved: true, cutoverPlanApproved: true, operationalSupportReady: true });
    expect(result.decision).toBe("NOT_READY");
    expect(result.blockers[0].code).toBe("DEFECTS");
  });

  it("allows readiness only when every mandatory gate passes", () => {
    const result = evaluateGoLiveGates({ mandatoryRequirementsApproved: true, mandatoryTestsPassed: true, criticalDefectsClosed: true, migrationReconciled: true, uatApproved: true, securityApproved: true, cutoverPlanApproved: true, operationalSupportReady: true });
    expect(result.decision).toBe("READY");
    expect(result.blockers).toHaveLength(0);
  });

  it("includes unresolved defects, incidents and exceptions in the report", () => {
    const readiness = evaluateGoLiveGates({ mandatoryRequirementsApproved: false, mandatoryTestsPassed: true, criticalDefectsClosed: false, migrationReconciled: false, uatApproved: false, securityApproved: true, cutoverPlanApproved: false, operationalSupportReady: true });
    const report = buildValidationReport({ organizationName: "Synthetic Hospital", requirements: [{ key: "REQ-1", title: "Patient identity", status: "IN_PROGRESS", priority: "CRITICAL" }], tests: [{ key: "TC-1", title: "Registration", result: "FAILED" }], defects: [{ key: "DEF-1", title: "Duplicate merge", severity: "CRITICAL", status: "OPEN" }], incidents: [{ key: "INC-1", title: "Queue delay", severity: "HIGH", status: "OPEN" }], readiness, exceptions: [{ title: "Temporary exception", justification: "Approved remediation date", status: "APPROVED" }] });
    expect(report.executiveDecision).toBe("NOT_READY");
    expect(report.unresolvedRisks).toHaveLength(2);
    expect(report.exceptions[0].status).toBe("APPROVED");
    expect(report.conclusion).toContain("not ready");
  });
});
