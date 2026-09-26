# EGE Chinese Scoring Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser service that guides a teacher through scoring the five extended-response EGE Chinese tasks under the FIPI 2026 rubrics, explains the result, and saves or transfers assessments.

**Architecture:** A static React/TypeScript app separates versioned rubric data, pure scoring functions, browser storage, and UI. The scoring result always carries criterion scores, explanations, missing inputs, and whether the total is final. Saved records keep raw marks and the rubric year; reopening recalculates the score.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, browser `localStorage`, native JSON file download/upload; npm lockfile.

**Spec:** `docs/superpowers/specs/2026-09-26-ege-chinese-scoring-service-design.md`

## Global Constraints

- Scoring and help content use only the final [FIPI 2026 writing guide](https://doc.fipi.ru/ege/dlya-predmetnyh-komissiy-subektov-rf/2026/kit_yaz_pch_mr_ege_2026.pdf) and [speaking guide](https://doc.fipi.ru/ege/dlya-predmetnyh-komissiy-subektov-rf/2026/kit_yaz_uch_mr_ege_2026.pdf), with visible source page links.
- Supported tasks are writing 28 and 29 and speaking 1, 2, and 3. Do not calculate the whole exam or translated test scores.
- A mark starts unset. Never treat an unset field as `−`, zero errors, or an accepted question.
- A criterion that needs expert judgment must request a rubric-level choice. Never invent an automatic score from a heuristic.
- Keep source PDFs supplied by the user intact. Do not commit those large 2024 PDFs or use them to set 2026 thresholds.
- No server, login, answer text, image, or audio persistence. The optional student label may be a pseudonym.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/rubric/types.ts` | Task, mark, draft, score, and saved-record types. |
| `src/rubric/fipi2026.ts` | Five task definitions, aspect labels, criterion levels, short help, and source links. |
| `src/rubric/score-writing.ts` | Pure scoring for tasks 28 and 29. |
| `src/rubric/score-speaking.ts` | Pure scoring for speaking tasks 1–3. |
| `src/rubric/score.ts` | Dispatch and common zeroing/incomplete-result rules. |
| `src/storage/records.ts` | Browser persistence and schema validation. |
| `src/storage/transfer.ts` | JSON export and import with duplicate handling. |
| `src/App.tsx`, `src/components/*` | Task selector, scoring form, rubric help, score panel, saved-work list. |
| `src/**/*.test.ts(x)` | Scoring, reference data, storage, and user-flow tests beside owners. |

## Review Focus

1. **Writing length at 134/135/209/210 and 143/144/220/221:** zero or assessed-fragment prompts must change at the exact boundary. Tested in Task 2.
2. **Zero for communication:** previously entered secondary scores must be displayed as zero with a reason. Tested in Tasks 2 and 3.
3. **Unmarked fields:** a partial assessment must not appear final or be saved as a completed score. Tested in Tasks 2, 3, and 4.
4. **Corrupt or partly invalid import:** no records are changed. Tested in Task 5.
5. **Duplicate imported IDs:** existing records keep their values and appear once. Tested in Task 5.

---

### Task 1: Project shell and versioned rubric reference

**Files:** Create `package.json`, lockfile, Vite/TypeScript config, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/rubric/types.ts`, `src/rubric/fipi2026.ts`, `src/rubric/fipi2026.test.ts`.

**Interfaces:** Export `TaskId = "writing28" | "writing29" | "speaking1" | "speaking2" | "speaking3"`, `AspectMark = "+" | "±" | "−" | null`, `RubricTask`, and `FIPI_2026: Record<TaskId, RubricTask>`. Each task contains ordered aspect labels, criterion maxima and levels, year `2026`, and source PDF/page links. Expected maxima: 8, 12, 5, 7, 8; aspect counts: 6, 5, 0, 5, 4. Source rubric pages: writing 28 → 140, writing 29 → 141, speaking 1 → 85, speaking 2 → 85–86, speaking 3 → 86–87.

- [ ] **Step 1: Write failing rubric tests.** Assert the five IDs, maxima, aspect counts, per-criterion maxima (28: 2+2+2+2; 29: 3+3+3+3; speaking 1: five one-point questions; speaking 2: 3+2+2; speaking 3: 3+2+3), nonempty help, and correct 2026 source URLs/pages.
- [ ] **Step 2: Run `npm test -- src/rubric/fipi2026.test.ts` and confirm failure.** Scaffold only what is necessary to run the test.
- [ ] **Step 3: Implement the rubric data from the cited FIPI appendices and a minimal task selector.** Keep criterion descriptions faithful and concise; include `+ / ± / −` meanings and a link to the full source.
- [ ] **Step 4: Run the rubric test and `npm run build`; confirm both pass.**
- [ ] **Step 5: Commit `feat: add FIPI 2026 rubric data`.**

### Task 2: Written-answer scoring

**Files:** Create `src/rubric/score-writing.ts`, `src/rubric/score.ts`, `src/rubric/score-writing.test.ts`; extend `src/rubric/types.ts`.

**Interfaces:** `calculateAssessment(draft: AssessmentDraft): ScoreResult` dispatches by `taskId`. Define the shared shapes in `types.ts`:

```ts
type CriterionKey = "content" | "organization" | "language" | "script" | "questions";
type AssessmentDraft = {
  taskId: TaskId; rubricYear: 2026; noAnswer: boolean;
  aspects: AspectMark[]; questionAccepted?: (boolean | null)[];
  characterCount?: number | null; phraseCount?: number | null;
  plagiarismOver30?: boolean | null;
  organizationErrors?: number | null; lexicalGrammarErrors?: number | null;
  hanziErrors?: number | null; punctuationErrors?: number | null;
  phoneticErrors?: number | null; grossLexicalGrammarErrors?: number | null;
  grossPhoneticErrors?: number | null;
  expertLevels?: Partial<Record<"content" | "organization" | "language" | "script", number>>;
};
type ScoreResult = {
  criteria: Partial<Record<CriterionKey, number | null>>;
  provisionalTotal: number; finalTotal: number | null;
  missing: string[]; reasons: string[];
};
```

`expertLevels` is accepted only for a source-defined judgment or an ambiguous mark combination, within that criterion's valid range.

- [ ] **Step 1: Write failing tests for task 28.** Cover six full aspects and zero errors → 8; one `±` → content 2; three `−` → content and total 0; `noAnswer` → final 0; length 134/135/209/210; 210 prompts evaluation of only the first 190 signs; incomplete aspects → `finalTotal: null`. Pin the 2026 guide's worked task-28 totals 5 and 1 as source fixtures.
- [ ] **Step 2: Write failing tests for task 29.** Cover all full → content 3; one or two `±` → content 2; one `−` with one `±` → content 1; length 143/144/220/221; established copying over 30% → total 0; a zero content score zeroes every criterion. Pin worked totals 9 and 4 from the 2026 guide.
- [ ] **Step 3: Run only these tests and confirm failure.**
- [ ] **Step 4: Implement `scoreWritten28`, `scoreWritten29`, and shared dispatch.** Apply the exact criterion tables. Translate unambiguous numeric thresholds automatically; when quality, context, or mark mixtures prevent a unique score, use a source-level `expertLevels` choice and explain why it is needed. Do not count Chinese characters from text, because the input is the teacher-confirmed count.
- [ ] **Step 5: Run written scoring tests and the build; confirm pass. Commit `feat: score written responses`.**

### Task 3: Speaking scoring

**Files:** Create `src/rubric/score-speaking.ts`, `src/rubric/score-speaking.test.ts`; extend `src/rubric/types.ts` and `src/rubric/score.ts`.

**Interfaces:** Speaking 1 uses `questionAccepted: (boolean | null)[5]`. Speaking 2 and 3 use aspect marks, `phraseCount`, organization assessment, lexical/grammar and phonetic error counts; speaking 3 additionally records gross-error counts. All use `calculateAssessment` and the common `ScoreResult` shape from Task 2.

- [ ] **Step 1: Write failing tests for speaking 1.** Five accepted questions → 5; a mixture of accepted and rejected sums exactly; `noAnswer` → final 0; an unset question keeps `finalTotal: null`. Use two question examples from the FIPI 2026 speaking guide to document an accepted and rejected case.
- [ ] **Step 2: Write failing tests for speaking 2 and 3.** Cover the 3+2+2 and 3+2+3 maxima, five versus six phrases, source-defined partial/absent aspects, error thresholds, and zero communication zeroing every criterion. Include two FIPI 2026 explained cases per task as fixtures for their stated criterion outcomes. Pin the speaking-3 organization levels to the **2026** table, including its one-error and two-to-four-error boundaries.
- [ ] **Step 3: Run the speaking tests and confirm failure.**
- [ ] **Step 4: Implement pure speaking scorers.** Return `finalTotal: null` where required expert decisions are unset; accept an `expertLevels` value only within the cited criterion's range. Keep reasons readable for the UI.
- [ ] **Step 5: Run all rubric tests and the build; confirm pass. Commit `feat: score speaking responses`.**

### Task 4: Guided checking and saved-work workflow

**Files:** Create `src/components/AssessmentForm.tsx`, `src/components/RubricHelp.tsx`, `src/components/ScorePanel.tsx`, `src/components/RecordList.tsx`, `src/storage/records.ts`, corresponding component/storage tests; modify `src/App.tsx` and `src/main.tsx`.

**Interfaces:** `loadRecords(storage: Storage): AssessmentRecord[]`, `saveRecord(storage: Storage, record: AssessmentRecord): void`, `deleteRecord(storage: Storage, id: string): void`; `AssessmentRecord` holds ID, timestamps, optional label/note, and raw `AssessmentDraft`. `ScorePanel` receives `ScoreResult` and never calculates scores itself.

- [ ] **Step 1: Write failing flow tests.** Choose each task, toggle `+ / ± / −`, enter counts, open help, observe the updated score and source link, and verify incomplete versus final states. Verify a zero-communication message. Save a completed assessment, reload it, edit marks, then delete it. Verify that switching away with unsaved changes asks for confirmation.
- [ ] **Step 2: Write failing storage tests.** A saved record retains raw marks/year and opens with a recalculated result; malformed stored JSON or a storage exception shows a recoverable error; an incomplete draft cannot be marked completed.
- [ ] **Step 3: Run those tests and confirm failure.**
- [ ] **Step 4: Implement responsive, keyboard-accessible forms and local persistence.** Use task data from `FIPI_2026`; label each control; keep source help adjacent to the relevant criterion. Optional student label and note are the only free-text record fields. Do not persist answer content.
- [ ] **Step 5: Run the flow/storage tests, all rubric tests, and build; confirm pass. Commit `feat: add checking and saved work UI`.**

### Task 5: Transfer, final verification, and handoff

**Files:** Create `src/storage/transfer.ts`, `src/storage/transfer.test.ts`; modify `src/App.tsx`; create `README.md`.

**Interfaces:** `exportRecords(records: AssessmentRecord[]): string` produces `{formatVersion: 1, records}` JSON. `importRecords(json: string, existing: AssessmentRecord[]): {records: AssessmentRecord[]; added: number; skipped: number}` validates the whole file first, appends only new IDs, and never mutates the existing array.

- [ ] **Step 1: Write failing transfer tests.** Round-trip multiple tasks; reject unsupported format, invalid mark/range, malformed JSON, and a mixed valid/invalid file without changing existing records; skip duplicate IDs without overwriting them.
- [ ] **Step 2: Run transfer tests and confirm failure.**
- [ ] **Step 3: Implement export/download and import/file-picker UI using the pure transfer functions.** Report added/skipped counts, preserve the current draft on failure, and document browser-local storage and transfer in `README.md`.
- [ ] **Step 4: Run `npm test`, `npm run build`, and `git diff --check`; confirm pass.** Manually check all five tasks, help links, keyboard focus, mobile layout, save/reopen, and exported import in a fresh browser profile. Compare two documented FIPI examples per task with the service output; record any criterion where the source requires human judgment.
- [ ] **Step 5: Commit `feat: add assessment transfer and usage guide`.**

## Self-Review Result

The five tasks cover all design sections. The review-focus conditions each have a named test in the owning task. The scoring engine and UI share the same `AssessmentDraft` / `ScoreResult` contract; storage retains raw input, and transfer validates before persistence. No implementation is authorized by this document alone.
