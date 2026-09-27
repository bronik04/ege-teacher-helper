# Expanded Teacher Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show every FIPI-2026 score level and criterion-by-criterion official and educational examples for all five tasks.

**Architecture:** Reuse `FIPI_2026.criteria.levels` as the single source for scale display. Keep example explanations in typed local rubric data, separate from the calculator; render criterion cards and expandable examples on the existing reference page.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-offline-and-teacher-reference-design.md`

## Global Constraints

- Rules and published examples are from FIPI 2026, written PDF pages 140–141 and oral PDF pages 85–87 for scales; label every example `official` or `educational`.
- All five tasks: writing28, writing29, speaking1, speaking2, speaking3. Speaking1 scores five questions individually and has no K1–K3 codes.
- Include all intermediate score levels. State whole-task zero and task-specific length conditions without reducing qualitative decisions to an error count alone.
- Minimum one official and one educational example per task. Official totals must match the source; fragments must be labeled as fragments.
- Keep saved record and autosaved draft formats unchanged. At 320 CSS px, the page must not scroll horizontally.

## File Map

- `src/rubric/fipi2026.ts`: source-backed level descriptions; no second copy of scores.
- `src/rubric/reference-examples.ts`: typed example content and source metadata.
- `src/rubric/reference-examples.test.ts`: content invariants and official score checks.
- `src/components/ReferencePage.tsx`: scale and example presentation.
- `src/components/ReferencePage.test.tsx`: all-level and example UI tests.
- `src/styles.css`: responsive criterion and example cards.
- `src/App.test.tsx`: update the existing reference-navigation expectation if the old table is replaced.
- `README.md`: document the expanded reference and source limitations.

## Review Focus

1. A task with four criteria: every intermediate score remains visible; Task 1 test covers writing29 3/2/1/0 and writing28 2/1/0.
2. Speaking1 selected: five separate 1/0 rules and no K labels; Task 1 test covers this.
3. K1 = 0 versus K2 = 0: examples state whether the entire task or one criterion is zero; Task 2 data test and Task 3 UI test cover this.
4. Source link offline or inaccessible: locally rendered explanation remains readable, while the source is identified by document and page; Task 3 UI test covers this.
5. A 320 CSS px viewport with long Russian and Chinese text: cards wrap without page overflow; Task 3 manual browser check covers this.

---

### Task 1: Complete Scale Cards

**Files:** Modify `src/rubric/fipi2026.ts`, `src/components/ReferencePage.tsx`, `src/styles.css`, `src/App.test.tsx`; create `src/components/ReferencePage.test.tsx`.

**Interfaces:** Consume `FIPI_2026[taskId].criteria[].levels` and `criterionCode(task, index)`; produce accessible criterion sections with each `level.score` and `level.description` visible. Speaking1 uses `FIPI_2026.speaking1.criteria[0].help` plus explicit 1/0 question rules, without criterion codes.

- [ ] **Step 1: Write failing UI tests.** Render `ReferencePage` for writing28, writing29, speaking1, speaking2 and speaking3. Assert that every criterion shows every score from `maxScore` to `0`, writing29 K1 has 3/2/1/0, speaking1 has 1 and 0 per question without a K label, and the task-wide zero/length note remains visible. Preserve the App navigation test's unsaved-mark assertion.
- [ ] **Step 2: Confirm failure.** Run `npm test -- src/components/ReferencePage.test.tsx src/App.test.tsx`; expect missing intermediate levels.
- [ ] **Step 3: Implement scale cards.** Use the existing levels array and source URL; replace the max/zero-only table, update introductory copy, add vertical mobile CSS. Check source-backed descriptions against the 2026 PDF and correct overly broad text in `fipi2026.ts`; do not alter scoring unless a concrete mismatch is found.
- [ ] **Step 4: Verify.** Run `npm test -- src/components/ReferencePage.test.tsx src/App.test.tsx` and `npm run build`; expect both to pass.
- [ ] **Step 5: Commit.** `git add src/rubric/fipi2026.ts src/components/ReferencePage.tsx src/components/ReferencePage.test.tsx src/styles.css src/App.test.tsx && git commit -m "feat: show complete FIPI score scales"`.

### Task 2: Source-Backed Example Data

**Files:** Modify `src/rubric/reference-examples.ts`; create `src/rubric/reference-examples.test.ts`; if source audit finds a concrete scoring mismatch, modify its `src/rubric/score-*.ts` and corresponding score test in this task.

**Interfaces:** Produce `REFERENCE_EXAMPLES: Record<TaskId, ReferenceEntry>` where each example has `id`, `kind: 'official' | 'educational'`, `title`, `prompt`, `excerpt`, `excerptKind: 'fragment' | 'full'`, `aspects: string[]`, `criteria: {code: string; score: number; reason: string}[]`, `total: number | null`, `page: number`, and optional `zeroReason`. Retain per-task `note`.

- [ ] **Step 1: Write failing data tests.** Assert at least one example of each `kind` for each task; unique IDs; valid page numbers and nonempty reasons; official totals equal the sum of criteria when `total !== null`; the writing28 official example from page 101 has K1=2, K2=1, K3=1, K4=1, total=5; an educational volume example has whole-task zero; an educational K2-zero example has nonzero K1 and does not claim whole-task zero.
- [ ] **Step 2: Confirm failure.** Run `npm test -- src/rubric/reference-examples.test.ts`; expect missing typed fields and per-task source examples.
- [ ] **Step 3: Populate data.** Paraphrase published FIPI reasoning; keep only short excerpts, identify fragments, and link the specific PDF page. Add concrete educational cases for each task. If a source check changes a scorer's threshold, first add a failing regression test, then fix that scorer and run its tests.
- [ ] **Step 4: Verify.** Run `npm test -- src/rubric/reference-examples.test.ts src/rubric/score-writing.test.ts src/rubric/score-speaking.test.ts` and `npm run build`; expect both to pass.
- [ ] **Step 5: Commit.** `git add src/rubric && git commit -m "feat: add annotated FIPI and teaching examples"`.

### Task 3: Example Reading Flow and Mobile Check

**Files:** Modify `src/components/ReferencePage.tsx`, `src/styles.css`, `src/components/ReferencePage.test.tsx`, `README.md`.

**Interfaces:** Consume the Task 2 example shape. Show source type, prompt, labeled excerpt, relevant aspect marks, criterion scores/reasons, total or "остальные критерии не оценивались", and source document/page. Use a native `details/summary` disclosure for long reasoning.

- [ ] **Step 1: Write failing UI tests.** Assert official and educational badges, page number, K1/K2 reasons, fragment label, whole-task-zero explanation, and partial-example no-total text for the selected task. Verify changing tasks changes examples and returning to the check preserves unsaved marks in `App.test.tsx`.
- [ ] **Step 2: Confirm failure.** Run `npm test -- src/components/ReferencePage.test.tsx src/App.test.tsx`; expect missing annotations.
- [ ] **Step 3: Render examples and update CSS/README.** Use accessible disclosure and vertical mobile layout; keep links to FIPI for online use and state that the explanation itself remains available offline.
- [ ] **Step 4: Verify.** Run `npm test` and `npm run build`; at 320 and 375 CSS px inspect all five tasks, check `document.documentElement.scrollWidth === innerWidth`, keyboard disclosure, and long Chinese text wrapping.
- [ ] **Step 5: Commit.** `git add src/components/ReferencePage.tsx src/components/ReferencePage.test.tsx src/styles.css src/App.test.tsx README.md && git commit -m "feat: explain scored examples in teacher reference"`.
