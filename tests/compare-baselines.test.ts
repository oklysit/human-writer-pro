/**
 * TDD tests for compareFixture() — pure comparison logic, no file I/O.
 *
 * Tests cover:
 *   - VR5 within tolerance → pass
 *   - VR5 outside tolerance → fail
 *   - Null baseline for GPTZero → info (baseline established)
 *   - GPTZero run value is null (skipped) → info
 *   - GPTZero within tolerance → pass
 *   - GPTZero outside tolerance → fail
 *   - Null baseline for AI-ism → info
 *   - AI-ism count increase within tolerance → pass
 *   - AI-ism count increase exceeds tolerance → fail
 *   - Null baseline for judge scores → info
 *   - Judge score drop within tolerance → pass
 *   - Judge score drop exceeds tolerance → fail (all three judge metrics)
 *   - Aspirational miss → info only, never fail
 *   - Mixed: some pass some fail → overall fail
 *   - All null baselines except VR5 → first-run establishment infos
 */

import { describe, it, expect } from "vitest";
import { compareFixture } from "../scripts/eval/compare-baselines";
import type { RunBlock, BaselineFile, FixtureCompareResult } from "../scripts/eval/compare-baselines";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASELINE_ALL_NULL: BaselineFile = {
  fixture: "cent-capital",
  baseline: {
    vr5_mean: 0.321,
    gptzero_human_plus_mixed: null,
    ai_ism_count: null,
    judge_voice_match: null,
    judge_content_fidelity: null,
  },
  tolerance: {
    vr5: 0.05,
    gptzero_human_plus_mixed: 20,
    ai_ism_count_max_increase: 2,
    judge_score_max_drop: 0.5,
  },
  aspirational_targets: {
    vr5_min: 0.20,
    gptzero_human_plus_mixed_min: 51,
  },
  notes: "Test baseline",
};

function makeRun(overrides: Partial<RunBlock> = {}): RunBlock {
  return {
    fixture: "cent-capital",
    mean_vr5: 0.321,
    std_vr5: 0.010,
    mean_judge_voice: 4.2,
    std_judge_voice: 0.3,
    mean_judge_fidelity: 4.5,
    std_judge_fidelity: 0.2,
    mean_judge_ai_ism: 4.0,
    std_judge_ai_ism: 0.1,
    ai_ism_count_total: 5,
    gptzero_human_plus_mixed: 62,
    ...overrides,
  };
}

function makeBaseline(overrides: Partial<BaselineFile["baseline"]> = {}): BaselineFile {
  return {
    ...BASELINE_ALL_NULL,
    baseline: {
      ...BASELINE_ALL_NULL.baseline,
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// VR5 tests
// ---------------------------------------------------------------------------

describe("compareFixture — VR5", () => {
  it("VR5 within tolerance → pass, no failures", () => {
    const run = makeRun({ mean_vr5: 0.321 }); // delta = 0.000
    const result = compareFixture(run, BASELINE_ALL_NULL);
    expect(result.failures.filter((f) => f.metric === "vr5")).toHaveLength(0);
  });

  it("VR5 exactly at tolerance boundary → pass", () => {
    const run = makeRun({ mean_vr5: 0.271 }); // delta = 0.05, not exceeding
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const vr5Failures = result.failures.filter((f) => f.metric === "vr5");
    expect(vr5Failures).toHaveLength(0);
  });

  it("VR5 one tick beyond tolerance → fail", () => {
    const run = makeRun({ mean_vr5: 0.210 }); // delta = 0.111 > 0.05
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const vr5Failures = result.failures.filter((f) => f.metric === "vr5");
    expect(vr5Failures).toHaveLength(1);
    expect(vr5Failures[0].message).toMatch(/VR5/i);
  });

  it("VR5 failure sets status to fail", () => {
    const run = makeRun({ mean_vr5: 0.100 });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    expect(result.status).toBe("fail");
  });

  it("VR5 within tolerance, all other null → pass", () => {
    const run = makeRun({ mean_vr5: 0.330, gptzero_human_plus_mixed: null });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    expect(result.status).toBe("pass");
  });
});

// ---------------------------------------------------------------------------
// GPTZero tests
// ---------------------------------------------------------------------------

describe("compareFixture — GPTZero", () => {
  it("null baseline and run has value → info (baseline established), not fail", () => {
    const run = makeRun({ gptzero_human_plus_mixed: 62 });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const gptzInfos = result.infos.filter((i) => i.metric === "gptzero");
    expect(gptzInfos.length).toBeGreaterThan(0);
    expect(gptzInfos[0].message).toMatch(/baseline established/i);
    const gptzFailures = result.failures.filter((f) => f.metric === "gptzero");
    expect(gptzFailures).toHaveLength(0);
  });

  it("run gptzero is null (skipped) → info, not fail", () => {
    const run = makeRun({ gptzero_human_plus_mixed: null });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const gptzInfos = result.infos.filter((i) => i.metric === "gptzero");
    expect(gptzInfos.length).toBeGreaterThan(0);
    expect(gptzInfos[0].message).toMatch(/skipped|quota/i);
    const gptzFailures = result.failures.filter((f) => f.metric === "gptzero");
    expect(gptzFailures).toHaveLength(0);
  });

  it("GPTZero within tolerance of established baseline → pass", () => {
    const baseline = makeBaseline({ gptzero_human_plus_mixed: 60 });
    const run = makeRun({ gptzero_human_plus_mixed: 65 }); // delta=5, tol=20
    const result = compareFixture(run, baseline);
    const gptzFailures = result.failures.filter((f) => f.metric === "gptzero");
    expect(gptzFailures).toHaveLength(0);
  });

  it("GPTZero beyond tolerance → fail", () => {
    const baseline = makeBaseline({ gptzero_human_plus_mixed: 60 });
    const run = makeRun({ gptzero_human_plus_mixed: 30 }); // delta=30 > 20
    const result = compareFixture(run, baseline);
    const gptzFailures = result.failures.filter((f) => f.metric === "gptzero");
    expect(gptzFailures).toHaveLength(1);
  });

  it("both null (no baseline, no run value) → info (skipped)", () => {
    const run = makeRun({ gptzero_human_plus_mixed: null });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const gptzFailures = result.failures.filter((f) => f.metric === "gptzero");
    expect(gptzFailures).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AI-ism count tests
// ---------------------------------------------------------------------------

describe("compareFixture — AI-ism count", () => {
  it("null baseline → info (baseline established), not fail", () => {
    const run = makeRun({ ai_ism_count_total: 5 });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const aismInfos = result.infos.filter((i) => i.metric === "ai_ism");
    expect(aismInfos.length).toBeGreaterThan(0);
    expect(aismInfos[0].message).toMatch(/baseline established/i);
    expect(result.failures.filter((f) => f.metric === "ai_ism")).toHaveLength(0);
  });

  it("count within tolerance of established baseline → pass", () => {
    const baseline = makeBaseline({ ai_ism_count: 5 });
    const run = makeRun({ ai_ism_count_total: 6 }); // increase=1, tol=2
    const result = compareFixture(run, baseline);
    expect(result.failures.filter((f) => f.metric === "ai_ism")).toHaveLength(0);
  });

  it("count exactly at tolerance boundary → pass", () => {
    const baseline = makeBaseline({ ai_ism_count: 5 });
    const run = makeRun({ ai_ism_count_total: 7 }); // increase=2, tol=2 (not exceeding)
    const result = compareFixture(run, baseline);
    expect(result.failures.filter((f) => f.metric === "ai_ism")).toHaveLength(0);
  });

  it("count exceeds tolerance → fail", () => {
    const baseline = makeBaseline({ ai_ism_count: 5 });
    const run = makeRun({ ai_ism_count_total: 8 }); // increase=3 > 2
    const result = compareFixture(run, baseline);
    const failures = result.failures.filter((f) => f.metric === "ai_ism");
    expect(failures).toHaveLength(1);
    expect(failures[0].message).toMatch(/AI-ism/i);
  });
});

// ---------------------------------------------------------------------------
// Judge score tests
// ---------------------------------------------------------------------------

describe("compareFixture — judge scores", () => {
  it("all judge baselines null → all info (baseline established), no failures", () => {
    const run = makeRun({ mean_judge_voice: 4.2, mean_judge_fidelity: 4.5, mean_judge_ai_ism: 4.0 });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const judgeInfos = result.infos.filter((i) =>
      ["judge_voice", "judge_fidelity", "judge_ai_ism"].includes(i.metric)
    );
    expect(judgeInfos.length).toBe(3);
    const judgeFailures = result.failures.filter((f) =>
      ["judge_voice", "judge_fidelity", "judge_ai_ism"].includes(f.metric)
    );
    expect(judgeFailures).toHaveLength(0);
  });

  it("judge voice dropped by 0.4 (within 0.5 tolerance) → pass", () => {
    const baseline = makeBaseline({ judge_voice_match: 4.5 });
    const run = makeRun({ mean_judge_voice: 4.1 }); // drop=0.4, tol=0.5
    const result = compareFixture(run, baseline);
    expect(result.failures.filter((f) => f.metric === "judge_voice")).toHaveLength(0);
  });

  it("judge voice dropped by 0.6 (exceeds 0.5 tolerance) → fail", () => {
    const baseline = makeBaseline({ judge_voice_match: 4.5 });
    const run = makeRun({ mean_judge_voice: 3.9 }); // drop=0.6 > 0.5
    const result = compareFixture(run, baseline);
    const failures = result.failures.filter((f) => f.metric === "judge_voice");
    expect(failures).toHaveLength(1);
    expect(failures[0].message).toMatch(/voice/i);
  });

  it("judge fidelity dropped by 0.6 → fail", () => {
    const baseline = makeBaseline({ judge_content_fidelity: 4.5 });
    const run = makeRun({ mean_judge_fidelity: 3.9 });
    const result = compareFixture(run, baseline);
    expect(result.failures.filter((f) => f.metric === "judge_fidelity")).toHaveLength(1);
  });

  it("judge fidelity dropped by 0.4 → pass", () => {
    const baseline = makeBaseline({ judge_content_fidelity: 4.5 });
    const run = makeRun({ mean_judge_fidelity: 4.1 });
    const result = compareFixture(run, baseline);
    expect(result.failures.filter((f) => f.metric === "judge_fidelity")).toHaveLength(0);
  });

  it("run judge scores are null (failed scoring) with null baseline → info, not fail", () => {
    const run = makeRun({ mean_judge_voice: null, mean_judge_fidelity: null, mean_judge_ai_ism: null });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const judgeFailures = result.failures.filter((f) =>
      ["judge_voice", "judge_fidelity", "judge_ai_ism"].includes(f.metric)
    );
    expect(judgeFailures).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Aspirational targets
// ---------------------------------------------------------------------------

describe("compareFixture — aspirational targets", () => {
  it("VR5 below aspirational min → info only, not fail", () => {
    const run = makeRun({ mean_vr5: 0.150 }); // below vr5_min=0.20
    // But this also fails VR5 tolerance (0.321 - 0.150 = 0.171 > 0.05)
    // Test with a run close to baseline but below aspirational
    const baseline: BaselineFile = {
      ...BASELINE_ALL_NULL,
      baseline: { ...BASELINE_ALL_NULL.baseline, vr5_mean: 0.180 },
      aspirational_targets: { vr5_min: 0.20, gptzero_human_plus_mixed_min: 51 },
    };
    const run2 = makeRun({ mean_vr5: 0.185 }); // within ±0.05 of 0.180, below aspirational 0.20
    const result = compareFixture(run2, baseline);
    const aspInfos = result.infos.filter((i) => i.metric === "aspirational_vr5");
    expect(aspInfos.length).toBeGreaterThan(0);
    expect(aspInfos[0].message).toMatch(/aspirational/i);
    // Must not generate a failure for this
    expect(result.failures.filter((f) => f.metric === "aspirational_vr5")).toHaveLength(0);
  });

  it("GPTZero below aspirational min → info only, not fail", () => {
    const baseline = makeBaseline({ gptzero_human_plus_mixed: 40 });
    const run = makeRun({ gptzero_human_plus_mixed: 42 }); // within tolerance, but below aspirational 51
    const result = compareFixture(run, baseline);
    const aspInfos = result.infos.filter((i) => i.metric === "aspirational_gptzero");
    expect(aspInfos.length).toBeGreaterThan(0);
    expect(result.failures.filter((f) => f.metric === "aspirational_gptzero")).toHaveLength(0);
  });

  it("VR5 meets aspirational min → no aspirational info", () => {
    const run = makeRun({ mean_vr5: 0.321 }); // above aspirational 0.20
    const result = compareFixture(run, BASELINE_ALL_NULL);
    const aspInfos = result.infos.filter((i) => i.metric === "aspirational_vr5");
    expect(aspInfos).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Status rollup + mixed scenarios
// ---------------------------------------------------------------------------

describe("compareFixture — status rollup", () => {
  it("all null baselines except vr5 within tolerance → status pass", () => {
    const run = makeRun({ mean_vr5: 0.330, gptzero_human_plus_mixed: null });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    expect(result.status).toBe("pass");
  });

  it("any failure → status fail", () => {
    const run = makeRun({ mean_vr5: 0.100 }); // big VR5 drift
    const result = compareFixture(run, BASELINE_ALL_NULL);
    expect(result.status).toBe("fail");
  });

  it("info-only (all null baselines, gptzero null run) → status pass", () => {
    const run = makeRun({ gptzero_human_plus_mixed: null });
    const result = compareFixture(run, BASELINE_ALL_NULL);
    expect(result.status).toBe("pass");
  });

  it("multiple failures accumulated correctly", () => {
    const baseline = makeBaseline({
      gptzero_human_plus_mixed: 60,
      judge_voice_match: 4.5,
      judge_content_fidelity: 4.5,
    });
    const run = makeRun({
      mean_vr5: 0.100, // VR5 fail
      gptzero_human_plus_mixed: 30, // GPTZero fail (delta=30)
      mean_judge_voice: 3.5, // judge voice fail (drop=1.0)
      mean_judge_fidelity: 3.5, // judge fidelity fail (drop=1.0)
    });
    const result = compareFixture(run, baseline);
    expect(result.status).toBe("fail");
    expect(result.failures.length).toBeGreaterThanOrEqual(4);
  });

  it("fixture name propagated to result", () => {
    const run = makeRun({ fixture: "shulman-fleming" });
    const baseline: BaselineFile = { ...BASELINE_ALL_NULL, fixture: "shulman-fleming" };
    const result = compareFixture(run, baseline);
    expect(result.fixture).toBe("shulman-fleming");
  });
});
