import type {
  ResponseSheetMap,
  AnswerKeyMap,
  ComparisonResult,
  SummaryStats,
  QuestionStatus,
  SubjectStats,
} from "@/types";

// ─── CUET Scoring Constants ───────────────────────────────────────────────────

const CUET_CORRECT_MARKS = 5;
const CUET_WRONG_MARKS = -1;
const CUET_UNATTEMPTED_MARKS = 0;

// ─── Option Label Helper ──────────────────────────────────────────────────────

/**
 * Given an option ID and the list of 4 option IDs for a question,
 * returns a human-readable label like "Option 2" or "Unknown".
 */
export function optionIdToLabel(
  optionId: string | null,
  optionIds: string[]
): string {
  if (!optionId) return "Not Attempted";
  const idx = optionIds.indexOf(optionId);
  return idx >= 0 ? `Option ${idx + 1}` : `ID: ${optionId}`;
}

// ─── Comparison Engine ────────────────────────────────────────────────────────

/**
 * Compare the student's response sheet against the answer key.
 *
 * For each question in the response sheet:
 *  1. Resolve the chosen option index → chosen option ID.
 *  2. Look up the correct option ID from the answer key.
 *  3. Determine status: correct | incorrect | not_attempted | missing_in_key.
 *
 * @param responseSheet Parsed response sheet map
 * @param answerKey     Parsed answer key map
 * @returns Array of per-question results
 */
export function compareAnswers(
  responseSheet: ResponseSheetMap,
  answerKey: AnswerKeyMap
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  for (const [questionId, responseEntry] of responseSheet) {
    const { chosenOptionIndex, optionIds } = responseEntry;

    // Resolve chosen option ID (null if not attempted)
    const chosenOptionId: string | null =
      chosenOptionIndex > 0 && chosenOptionIndex <= optionIds.length
        ? optionIds[chosenOptionIndex - 1]
        : null;

    // Look up the answer key
    const keyEntry = answerKey.get(questionId);

    let status: QuestionStatus;
    let correctOptionId: string;
    let correctAnswer: string;

    if (!keyEntry) {
      // Question not found in answer key
      status = "missing_in_key";
      correctOptionId = "N/A";
      correctAnswer = "Not in Key";
    } else {
      correctOptionId = keyEntry.correctOptionId;
      correctAnswer = optionIdToLabel(correctOptionId, optionIds);

      if (chosenOptionId === null) {
        status = "not_attempted";
      } else if (chosenOptionId === correctOptionId) {
        status = "correct";
      } else {
        status = "incorrect";
      }
    }

    results.push({
      questionId,
      yourAnswer: optionIdToLabel(chosenOptionId, optionIds),
      correctAnswer,
      chosenOptionId,
      correctOptionId,
      status,
      subject: responseEntry.subject,
      optionIds: [...optionIds],
      chosenOptionIndex,
    });
  }

  // Sort: correct first, then incorrect, then not attempted, then missing
  const ORDER: Record<QuestionStatus, number> = {
    correct: 0,
    incorrect: 1,
    not_attempted: 2,
    missing_in_key: 3,
  };
  results.sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return results;
}

// ─── Stats Calculator ─────────────────────────────────────────────────────────

/**
 * Calculate aggregate statistics from comparison results.
 */
export function calculateStats(results: ComparisonResult[]): SummaryStats {
  const total = results.length;
  let correct = 0;
  let incorrect = 0;
  let notAttempted = 0;
  let missingInKey = 0;

  for (const r of results) {
    switch (r.status) {
      case "correct":
        correct++;
        break;
      case "incorrect":
        incorrect++;
        break;
      case "not_attempted":
        notAttempted++;
        break;
      case "missing_in_key":
        missingInKey++;
        break;
    }
  }

  const attempted = correct + incorrect;
  const percentage =
    attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const cuetScore =
    correct * CUET_CORRECT_MARKS +
    incorrect * CUET_WRONG_MARKS +
    notAttempted * CUET_UNATTEMPTED_MARKS;

  return {
    total,
    correct,
    incorrect,
    notAttempted,
    missingInKey,
    percentage,
    cuetScore,
  };
}

/**
 * Calculate statistics grouped by subject/section.
 */
export function calculateSubjectStats(
  results: ComparisonResult[]
): SubjectStats[] {
  const subjectGroups: Record<string, ComparisonResult[]> = {};

  for (const r of results) {
    if (!subjectGroups[r.subject]) {
      subjectGroups[r.subject] = [];
    }
    subjectGroups[r.subject].push(r);
  }

  const subjectStatsList: SubjectStats[] = [];

  for (const [subject, subjectResults] of Object.entries(subjectGroups)) {
    const stats = calculateStats(subjectResults);
    subjectStatsList.push({
      subject,
      stats,
    });
  }

  // Sort subjects alphabetically
  subjectStatsList.sort((a, b) => a.subject.localeCompare(b.subject));

  return subjectStatsList;
}
