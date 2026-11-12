import { describe, expect, it } from "vitest";
import { assessmentInputSchema, assessmentQuestions, calculateReadiness, gapFromResponse } from "../lib/assessment";

describe("Phase 2 assessment workflow integration", () => {
  it("validates a submitted assessment and derives gaps from its persisted-shaped responses", () => {
    const payload = assessmentInputSchema.parse({
      organizationId: "00000000-0000-0000-0000-000000000001",
      version: "2026.1",
      responses: assessmentQuestions.map((q, index) => ({ questionId: `q-${index}`, answer: index % 3 === 0 ? "NO" : "YES", comment: "Synthetic integration fixture" })),
    });
    const score = calculateReadiness(assessmentQuestions, payload.responses.map((r, index) => ({ questionKey: assessmentQuestions[index].key, answer: r.answer })));
    const gaps = payload.responses.map((r, index) => gapFromResponse(assessmentQuestions[index], r.answer, r.comment)).filter(Boolean);
    expect(payload.responses).toHaveLength(assessmentQuestions.length);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.criticalBlockers).toBeGreaterThan(0);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every(g => g?.currentState.includes("Synthetic integration fixture"))).toBe(true);
  });

  it("rejects an assessment with no responses", () => {
    expect(() => assessmentInputSchema.parse({ organizationId: "00000000-0000-0000-0000-000000000001", responses: [] })).toThrow();
  });
});
