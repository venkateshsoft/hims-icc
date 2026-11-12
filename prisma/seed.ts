import { PrismaClient } from "@prisma/client";
import { assessmentQuestions, calculateReadiness, gapFromResponse } from "../lib/assessment";
import { moduleDefinitions } from "../lib/modules";

const prisma = new PrismaClient();

async function main() {
  const moduleByKey = new Map<string, string>();
  for (const [key, name, domain, description, dependencies] of moduleDefinitions) {
    const record = await prisma.hIMSModule.upsert({ where: { key }, update: { name, domain, description, dependencies: [...dependencies] }, create: { key, name, domain, description, dependencies: [...dependencies] } });
    moduleByKey.set(key, record.id);
  }
  for (const question of assessmentQuestions) {
    await prisma.assessmentQuestion.upsert({ where: { key: question.key }, update: { category: question.category, prompt: question.prompt, helpText: question.helpText, weight: question.weight, critical: question.critical, moduleId: moduleByKey.get(question.moduleKey) }, create: { key: question.key, category: question.category, prompt: question.prompt, helpText: question.helpText, weight: question.weight, critical: question.critical, moduleId: moduleByKey.get(question.moduleKey) } });
  }
  const organization = await prisma.organization.upsert({
    where: { name: "Meridian Multispecialty Hospital Network" },
    update: { beds: 1000, hospitalsCount: 3, facilitiesCount: 14, implementationObjectives: ["LEGACY_MODERNIZATION", "MULTI_HOSPITAL_STANDARDIZATION"], deploymentModel: "HYBRID" },
    create: { name: "Meridian Multispecialty Hospital Network", type: "Enterprise healthcare network", country: "India", state: "Karnataka", city: "Bengaluru", hospitalsCount: 3, facilitiesCount: 14, beds: 1000, opdDepartments: 25, ipdDepartments: 18, operatingTheatres: 12, employees: 4200, doctors: 480, nurses: 1120, administrativeUsers: 310, avgDailyOpd: 1850, avgDailyIpd: 610, avgDailyRegistrations: 490, avgDailyBillingTransactions: 920, implementationObjectives: ["LEGACY_MODERNIZATION", "MULTI_HOSPITAL_STANDARDIZATION"], deploymentModel: "HYBRID" },
  });
  const hospitals = [
    ["Meridian Central Hospital", "Bengaluru", 520],
    ["Meridian East Hospital", "Mysuru", 280],
    ["Meridian Women & Children", "Bengaluru", 200],
  ] as const;
  for (const [name, city, beds] of hospitals) {
    const hospital = await prisma.hospital.upsert({ where: { id: `${organization.id}-${name}` }, update: { city, beds }, create: { id: `${organization.id}-${name}`, organizationId: organization.id, name, city, beds } });
    const facility = await prisma.facility.create({ data: { hospitalId: hospital.id, name: `${name} Main Campus` } }).catch(() => null);
    if (facility) await prisma.department.createMany({ data: ["Emergency", "OPD", "IPD", "Laboratory", "Pharmacy"].map(name => ({ facilityId: facility.id, name })) });
  }
  for (const [key, moduleId] of moduleByKey) await prisma.moduleScope.upsert({ where: { organizationId_moduleId: { organizationId: organization.id, moduleId } }, update: { state: key === "DR_BCP" ? "FUTURE_PHASE" : "IN_SCOPE" }, create: { organizationId: organization.id, moduleId, state: key === "DR_BCP" ? "FUTURE_PHASE" : "IN_SCOPE" } });

  const responseMap: Record<string, "YES" | "NO" | "PARTIAL" | "NA" | "UNKNOWN"> = { "ORG-PATIENT-MASTER": "NO", "ORG-ACCESS-CONTROL": "YES", "ORG-AUDIT-TRAIL": "PARTIAL", "ORG-LIS-INTEGRATION": "NO", "ORG-PACS-INTEGRATION": "PARTIAL", "ORG-PHARMACY-STOCK": "PARTIAL", "ORG-CLAIMS-AUTOMATION": "UNKNOWN", "ORG-DR-PLAN": "NO", "ORG-DATA-QUALITY": "PARTIAL", "ORG-TRAINING": "YES" };
  const questions = await prisma.assessmentQuestion.findMany();
  const responses = questions.map(q => ({ questionId: q.id, questionKey: q.key, answer: responseMap[q.key] ?? "UNKNOWN", comment: `Seeded synthetic response for ${q.key}.` }));
  const score = calculateReadiness(questions, responses);
  const assessment = await prisma.organizationAssessment.create({ data: { organizationId: organization.id, version: "2026.1", score: score.score, criticalBlockers: score.criticalBlockers, responses: { create: responses } } });
  await prisma.gap.deleteMany({ where: { organizationId: organization.id } });
  await prisma.gap.createMany({ data: questions.flatMap(q => { const gap = gapFromResponse(q, responseMap[q.key] ?? "UNKNOWN", `Seeded synthetic response for ${q.key}.`); return gap ? [{ ...gap, organizationId: organization.id, questionKey: q.key }] : []; }) });
  const project = await prisma.implementationProject.findFirst({ where: { organizationId: organization.id } }) ?? await prisma.implementationProject.create({ data: { organizationId: organization.id, name: "Meridian HIMS Transformation", status: "ACTIVE", targetGoLive: new Date("2026-12-14") } });
  const req1 = await prisma.requirement.upsert({ where: { organizationId_key: { organizationId: organization.id, key: "REQ-CLIN-001" } }, update: {}, create: { organizationId: organization.id, projectId: project.id, key: "REQ-CLIN-001", title: "OPD to laboratory result workflow", description: "Orders and validated results must flow to the clinical inbox.", category: "Clinical", priority: "CRITICAL", status: "APPROVED", designReference: "DES-CLIN-001", configurationReference: "CFG-LIS-001" } });
  const req2 = await prisma.requirement.upsert({ where: { organizationId_key: { organizationId: organization.id, key: "REQ-DATA-001" } }, update: {}, create: { organizationId: organization.id, projectId: project.id, key: "REQ-DATA-001", title: "Patient master reconciliation", description: "Patient identities must reconcile within the approved variance threshold.", category: "Data migration", priority: "HIGH", status: "IN_PROGRESS", designReference: "DES-DATA-001" } });
  const plan = await prisma.testPlan.findFirst({ where: { projectId: project.id } }) ?? await prisma.testPlan.create({ data: { projectId: project.id, name: "Meridian integrated validation plan" } });
  const tc1 = await prisma.testCase.upsert({ where: { testPlanId_key: { testPlanId: plan.id, key: "TC-LIS-001" } }, update: { requirementId: req1.id }, create: { testPlanId: plan.id, requirementId: req1.id, key: "TC-LIS-001", title: "OPD order to LIS result", workflow: "OPD → Lab order → Result reporting" } });
  const tc2 = await prisma.testCase.upsert({ where: { testPlanId_key: { testPlanId: plan.id, key: "TC-DATA-001" } }, update: { requirementId: req2.id }, create: { testPlanId: plan.id, requirementId: req2.id, key: "TC-DATA-001", title: "Patient master reconciliation", workflow: "Legacy extract → cleanse → reconcile" } });
  await prisma.testExecution.deleteMany({ where: { testCaseId: { in: [tc1.id, tc2.id] } } });
  await prisma.testExecution.createMany({ data: [{ testCaseId: tc1.id, result: "FAILED", tester: "Vikram Singh" }, { testCaseId: tc2.id, result: "BLOCKED", tester: "Priya Menon" }] });
  await prisma.defect.upsert({ where: { organizationId_key: { organizationId: organization.id, key: "DEF-021" } }, update: {}, create: { organizationId: organization.id, projectId: project.id, requirementId: req1.id, key: "DEF-021", title: "LIS result mapping incomplete", description: "Corrected lab results do not reach the clinical inbox.", severity: "CRITICAL", status: "OPEN", owner: "Vikram Singh" } });
  await prisma.approval.deleteMany({ where: { organizationId: organization.id, type: { in: ["UAT", "SECURITY", "OPERATIONS"] } } });
  await prisma.approval.create({ data: { organizationId: organization.id, type: "SECURITY", status: "APPROVED", approver: "Rohan Iyer", decisionReason: "Synthetic security review passed." } });
  await prisma.approval.create({ data: { organizationId: organization.id, type: "UAT", status: "PENDING", approver: "Customer PM" } });
  await prisma.goLiveAssessment.create({ data: { organizationId: organization.id, projectId: project.id, decision: "NOT_READY", migrationReconciled: false, cutoverPlanApproved: false, gates: { create: [{ code: "REQUIREMENTS", label: "Mandatory requirements approved", passed: false, detail: "REQ-DATA-001 remains in progress." }, { code: "TESTS", label: "Mandatory test coverage passed", passed: false, detail: "LIS and migration tests are not passed." }, { code: "DEFECTS", label: "Critical defects closed", passed: false, detail: "DEF-021 is open." }] } } });
  await prisma.hypercareIncident.upsert({ where: { organizationId_key: { organizationId: organization.id, key: "INC-DEMO-001" } }, update: {}, create: { organizationId: organization.id, projectId: project.id, key: "INC-DEMO-001", title: "Synthetic post-go-live monitoring example", description: "Demonstration incident for hypercare workflow.", severity: "MEDIUM", status: "OPEN", owner: "Hypercare desk" } });
  console.log(`Seeded ${organization.name}: assessment ${assessment.id}, score ${score.score}%, ${score.criticalBlockers} critical blockers.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
