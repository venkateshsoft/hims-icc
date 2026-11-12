import { describe, expect, it } from "vitest";
import { calculateReadiness, gapFromResponse } from "../lib/assessment";

const questions = [
  { key: "critical", prompt: "Critical control", weight: 3, critical: true },
  { key: "standard", prompt: "Standard control", weight: 1, critical: false },
];

describe("Phase 2 readiness scoring", () => {
  it("uses transparent weighted scoring and preserves critical blockers", () => {
    const result = calculateReadiness(questions, [
      { questionKey: "critical", answer: "NO" },
      { questionKey: "standard", answer: "YES" },
    ]);
    expect(result.score).toBe(25);
    expect(result.criticalBlockers).toBe(1);
    expect(result.blockerQuestionKeys).toEqual(["critical"]);
  });

  it("does not hide unknown or unanswered questions", () => {
    const result = calculateReadiness(questions, [{ questionKey: "critical", answer: "UNKNOWN" }]);
    expect(result.unanswered).toEqual(["standard"]);
    expect(result.criticalBlockers).toBe(1);
  });

  it("creates no gap for an evidenced yes or not-applicable response", () => {
    expect(gapFromResponse(questions[0], "YES")).toBeNull();
    expect(gapFromResponse(questions[0], "NA")).toBeNull();
  });

  it("classifies a critical no as a critical gap", () => {
    const gap = gapFromResponse(questions[0], "NO", "No centralized control exists");
    expect(gap?.severity).toBe("CRITICAL");
    expect(gap?.currentState).toContain("centralized control");
  });
});
