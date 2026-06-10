// ─── Response Sheet Types ────────────────────────────────────────────────────

/** One question entry extracted from the student's Response Sheet PDF */
export interface ResponseSheetEntry {
  /** NTA Question ID, e.g. "226895786303" */
  questionId: string;
  /** 1-based index of the option the student chose (0 = not attempted) */
  chosenOptionIndex: number;
  /** The four option IDs in order: [opt1, opt2, opt3, opt4] */
  optionIds: string[];
  /** Subject/Section of the question, e.g. "History" */
  subject: string;
  /** Full text of the question */
  questionText?: string;
  /** Text for each option [opt1Text, opt2Text, opt3Text, opt4Text] */
  optionsText?: string[];
}

/** Full parsed response sheet: questionId → entry */
export type ResponseSheetMap = Map<string, ResponseSheetEntry>;

// ─── Answer Key Types ─────────────────────────────────────────────────────────

/** One row extracted from the Answer Key PDF */
export interface AnswerKeyEntry {
  /** NTA Question ID */
  questionId: string;
  /** The Option ID that is marked as correct */
  correctOptionId: string;
}

/** Full parsed answer key: questionId → entry */
export type AnswerKeyMap = Map<string, AnswerKeyEntry>;

// ─── Comparison Types ─────────────────────────────────────────────────────────

export type QuestionStatus =
  | "correct"
  | "incorrect"
  | "not_attempted"
  | "missing_in_key";

/** Result for a single question after comparison */
export interface ComparisonResult {
  questionId: string;
  /** Human-readable label, e.g. "Option 2" or "Not Attempted" */
  yourAnswer: string;
  /** Human-readable label, e.g. "Option 1" */
  correctAnswer: string;
  /** The raw option ID the student chose (null if not attempted) */
  chosenOptionId: string | null;
  /** The raw correct option ID from the key */
  correctOptionId: string;
  status: QuestionStatus;
  /** Subject/Section of the question */
  subject: string;
  /** All 4 option IDs from the response sheet */
  optionIds: string[];
  /** Chosen option index: 1-4 (0 if skipped) */
  chosenOptionIndex: number;
  /** Full text of the question */
  questionText?: string;
  /** Text for each option [opt1Text, opt2Text, opt3Text, opt4Text] */
  optionsText?: string[];
}

/** Score summary shown in the summary card */
export interface SummaryStats {
  total: number;
  correct: number;
  incorrect: number;
  notAttempted: number;
  missingInKey: number;
  /** Percentage of attempted questions that were correct */
  percentage: number;
  /** CUET weighted score: +5 correct, -1 incorrect, 0 not attempted */
  cuetScore: number;
}

// ─── Subject Stats Types ──────────────────────────────────────────────────────

export interface SubjectStats {
  subject: string;
  stats: SummaryStats;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface CompareApiResponse {
  results: ComparisonResult[];
  stats: SummaryStats;
  subjectStats: SubjectStats[];
}

export interface CompareApiError {
  error: string;
  details?: string;
}
