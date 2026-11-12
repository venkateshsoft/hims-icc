import { z } from "zod";

export const ANSWERS = ["YES", "NO", "PARTIAL", "NA", "UNKNOWN"] as const;
export type AssessmentAnswer = (typeof ANSWERS)[number];

export const organizationInputSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  country: z.string().min(2),
  state: z.string().optional(),
  city: z.string().optional(),
  hospitalsCount: z.coerce.number().int().nonnegative(),
  facilitiesCount: z.coerce.number().int().nonnegative(),
  beds: z.coerce.number().int().nonnegative(),
  doctors: z.coerce.number().int().nonnegative(),
  nurses: z.coerce.number().int().nonnegative(),
  employees: z.coerce.number().int().nonnegative(),
  implementationObjectives: z.array(z.string()).default([]),
  deploymentModel: z.string().optional(),
});

export const responseInputSchema = z.object({
  questionId: z.string().min(1),
  answer: z.enum(ANSWERS),
  comment: z.string().max(2000).optional(),
  evidenceRef: z.string().max(500).optional(),
});

export const assessmentInputSchema = z.object({
  organizationId: z.string().uuid(),
  version: z.string().min(1).default("2026.1"),
  responses: z.array(responseInputSchema).min(1),
});

export type ScoringQuestion = { key: string; prompt: string; weight: number; critical: boolean };
export type ScoringResponse = { questionKey: string; answer: AssessmentAnswer };

const points: Record<AssessmentAnswer, number> = { YES: 1, PARTIAL: 0.5, NO: 0, UNKNOWN: 0.25, NA: 1 };

export function calculateReadiness(questions: readonly ScoringQuestion[], responses: readonly ScoringResponse[]) {
  const byKey = new Map(responses.map((r) => [r.questionKey, r.answer]));
  let weighted = 0;
  let totalWeight = 0;
  const blockers: string[] = [];
  const unanswered: string[] = [];
  for (const question of questions) {
    totalWeight += question.weight;
    const answer = byKey.get(question.key);
    if (!answer) { unanswered.push(question.key); continue; }
    weighted += points[answer] * question.weight;
    if (question.critical && (answer === "NO" || answer === "UNKNOWN")) blockers.push(question.key);
  }
  return {
    score: totalWeight === 0 ? 0 : Math.round((weighted / totalWeight) * 100),
    criticalBlockers: blockers.length,
    blockerQuestionKeys: blockers,
    unanswered,
    calculatedAt: new Date().toISOString(),
  };
}

export function gapFromResponse(question: ScoringQuestion, answer: AssessmentAnswer, comment?: string) {
  if (answer === "YES" || answer === "NA") return null;
  const severity = question.critical || answer === "NO" ? "CRITICAL" : answer === "UNKNOWN" ? "HIGH" : "MEDIUM";
  return {
    questionKey: question.key,
    title: `Assessment gap: ${question.prompt}`,
    severity,
    currentState: comment || `Response recorded as ${answer}.`,
    desiredState: "Approved, evidenced capability aligned to the target HIMS operating model.",
    businessImpact: question.critical ? "May prevent safe implementation or go-live." : "May reduce adoption, control quality or reporting confidence.",
    recommendedSolution: "Assign an accountable owner, document the target state, and validate closure with evidence.",
    status: "OPEN",
  } as const;
}

export const assessmentQuestions = [
  { key: "ORG-PATIENT-MASTER", category: "Data and identity", prompt: "Is there a governed, centralized patient master with duplicate detection?", helpText: "Assess MPI ownership, matching rules and duplicate merge controls.", weight: 3, critical: true, moduleKey: "PATIENT_REGISTRATION" },
  { key: "ORG-ACCESS-CONTROL", category: "Security", prompt: "Are role-based access controls implemented and periodically reviewed?", helpText: "Include joiner/mover/leaver controls and privileged access review.", weight: 3, critical: true, moduleKey: "IAM" },
  { key: "ORG-AUDIT-TRAIL", category: "Security", prompt: "Are clinical, financial and administrative changes captured in an audit trail?", helpText: "Confirm audit coverage, retention and review ownership.", weight: 2, critical: true, moduleKey: "AUDIT_COMPLIANCE" },
  { key: "ORG-LIS-INTEGRATION", category: "Interoperability", prompt: "Can laboratory orders and validated results flow electronically between systems?", helpText: "Consider interface standards, result codes and downtime handling.", weight: 3, critical: true, moduleKey: "LIS" },
  { key: "ORG-PACS-INTEGRATION", category: "Interoperability", prompt: "Can radiology orders, images and reports be exchanged with PACS?", helpText: "Assess DICOM, worklists, report availability and patient identity matching.", weight: 2, critical: false, moduleKey: "PACS" },
  { key: "ORG-PHARMACY-STOCK", category: "Clinical operations", prompt: "Is pharmacy inventory tracked with batch, expiry and consumption controls?", helpText: "Include ward stock and medication dispensing workflows.", weight: 2, critical: false, moduleKey: "PHARMACY" },
  { key: "ORG-CLAIMS-AUTOMATION", category: "Financial operations", prompt: "Are insurance eligibility, preauthorization and claims handled through an automated workflow?", helpText: "Include TPA rules, denial tracking and remittance reconciliation.", weight: 2, critical: false, moduleKey: "INSURANCE_TPA" },
  { key: "ORG-DR-PLAN", category: "Infrastructure", prompt: "Is there a tested disaster recovery and business continuity strategy for HIMS services?", helpText: "Assess RPO/RTO, failover evidence, backups and recovery ownership.", weight: 3, critical: true, moduleKey: "DR_BCP" },
  { key: "ORG-DATA-QUALITY", category: "Data and identity", prompt: "Are legacy data quality, completeness and migration rules documented?", helpText: "Look for profiling, cleansing, reconciliation and acceptance thresholds.", weight: 2, critical: false, moduleKey: "MDM" },
  { key: "ORG-TRAINING", category: "Change management", prompt: "Is there a role-based training and super-user model for clinical and administrative teams?", helpText: "Include competency assessment, attendance and retraining.", weight: 1, critical: false, moduleKey: "EMR" },
] as const;

export type QuestionDefinition = (typeof assessmentQuestions)[number];
