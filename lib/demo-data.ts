export const demoOrganization = {
  id: "demo-meridian",
  name: "Meridian Multispecialty Hospital Network",
  type: "Enterprise healthcare network",
  country: "India",
  city: "Bengaluru",
  beds: 1000,
  hospitalsCount: 3,
  facilitiesCount: 14,
};

export const demoModules = [
  ["demo-emr", "EMR", "Electronic Medical Records", "Clinical", "Clinical documentation, orders and results.", ["PATIENT_REGISTRATION", "IAM"]],
  ["demo-reg", "PATIENT_REGISTRATION", "Patient Registration", "Clinical", "MPI and encounter creation.", ["MDM", "IAM"]],
  ["demo-lis", "LIS", "Laboratory Information System", "Clinical", "Orders, specimens and result reporting.", ["INTEGRATION_ENGINE"]],
  ["demo-pacs", "PACS", "Radiology & PACS", "Clinical", "Imaging orders and diagnostic reporting.", ["RIS"]],
  ["demo-pharmacy", "PHARMACY", "Pharmacy Management", "Clinical", "Formulary, stock and dispensing controls.", ["INVENTORY"]],
  ["demo-billing", "BILLING", "Billing Management", "Financial", "Charge capture and payment workflows.", ["PATIENT_REGISTRATION"]],
  ["demo-insurance", "INSURANCE_TPA", "Insurance & TPA Management", "Financial", "Eligibility, claims and remittance workflows.", ["BILLING"]],
  ["demo-mdm", "MDM", "Master Data Management", "Enterprise", "Governed reference data.", []],
  ["demo-integration", "INTEGRATION_ENGINE", "Enterprise Integration Engine", "Enterprise", "HL7, FHIR, DICOM and external APIs.", ["IAM"]],
  ["demo-iam", "IAM", "Identity & Access Management", "Enterprise", "Roles, SSO and privileged access controls.", []],
];

export const demoQuestions = [
  ["demo-q1", "ORG-PATIENT-MASTER", "Data and identity", "Is there a governed, centralized patient master with duplicate detection?", "NO", true],
  ["demo-q2", "ORG-ACCESS-CONTROL", "Security", "Are role-based access controls implemented and periodically reviewed?", "YES", true],
  ["demo-q3", "ORG-AUDIT-TRAIL", "Security", "Are clinical, financial and administrative changes captured in an audit trail?", "PARTIAL", true],
  ["demo-q4", "ORG-LIS-INTEGRATION", "Interoperability", "Can laboratory orders and validated results flow electronically between systems?", "NO", true],
  ["demo-q5", "ORG-PACS-INTEGRATION", "Interoperability", "Can radiology orders, images and reports be exchanged with PACS?", "PARTIAL", false],
  ["demo-q6", "ORG-PHARMACY-STOCK", "Clinical operations", "Is pharmacy inventory tracked with batch, expiry and consumption controls?", "PARTIAL", false],
  ["demo-q7", "ORG-DR-PLAN", "Infrastructure", "Is there a tested disaster recovery and business continuity strategy?", "NO", true],
  ["demo-q8", "ORG-DATA-QUALITY", "Data and identity", "Are legacy data quality, completeness and migration rules documented?", "PARTIAL", false],
];

export const demoGaps = [
  { id: "demo-gap-1", title: "No centralized patient master", severity: "CRITICAL", currentState: "Legacy applications maintain separate patient identities.", desiredState: "Governed enterprise patient master with duplicate detection.", status: "OPEN" },
  { id: "demo-gap-2", title: "LIS integration is not available", severity: "CRITICAL", currentState: "Laboratory results are manually re-entered.", desiredState: "Validated results flow electronically to the clinical inbox.", status: "OPEN" },
  { id: "demo-gap-3", title: "Disaster recovery test is incomplete", severity: "CRITICAL", currentState: "Backups exist but failover evidence is missing.", desiredState: "Approved RPO/RTO with tested failover.", status: "OPEN" },
];

export const demoValidation = {
  requirements: [
    { id: "demo-req-1", key: "REQ-CLIN-001", title: "OPD to laboratory result workflow", priority: "CRITICAL", status: "APPROVED", designReference: "DES-CLIN-001", configurationReference: "CFG-LIS-001", testCases: [{ id: "demo-tc-1" }] },
    { id: "demo-req-2", key: "REQ-DATA-001", title: "Patient master reconciliation", priority: "HIGH", status: "IN_PROGRESS", designReference: "DES-DATA-001", testCases: [{ id: "demo-tc-2" }] },
  ],
  testPlans: [{ id: "demo-plan", testCases: [{ id: "demo-tc-1", key: "TC-LIS-001", title: "OPD order to LIS result", workflow: "OPD > Lab order > Result reporting", requirement: { key: "REQ-CLIN-001" }, executions: [{ result: "FAILED" }] }, { id: "demo-tc-2", key: "TC-DATA-001", title: "Patient master reconciliation", workflow: "Legacy extract > cleanse > reconcile", requirement: { key: "REQ-DATA-001" }, executions: [{ result: "BLOCKED" }] }] }],
  tests: [{ key: "TC-LIS-001", title: "OPD order to LIS result", result: "FAILED" }, { key: "TC-DATA-001", title: "Patient master reconciliation", result: "BLOCKED" }],
  defects: [{ id: "demo-defect-1", key: "DEF-021", title: "LIS result mapping incomplete", severity: "CRITICAL", status: "OPEN", owner: "Vikram Singh" }],
  incidents: [{ id: "demo-incident-1", key: "INC-DEMO-001", title: "Synthetic post-go-live monitoring example", severity: "MEDIUM", status: "OPEN", owner: "Hypercare desk" }],
  approvals: [{ type: "SECURITY", status: "APPROVED" }],
  latestGoLive: null,
  readiness: { decision: "NOT_READY", blockers: [{ code: "TESTS", label: "Mandatory test coverage passed", detail: "LIS and migration tests are not passed." }, { code: "DEFECTS", label: "Critical defects closed", detail: "DEF-021 is open." }], gates: [{ code: "REQUIREMENTS", label: "Mandatory requirements approved", passed: false, detail: "REQ-DATA-001 remains in progress." }, { code: "TESTS", label: "Mandatory test coverage passed", passed: false, detail: "LIS and migration tests are not passed." }, { code: "DEFECTS", label: "Critical defects closed", passed: false, detail: "DEF-021 is open." }] },
};
