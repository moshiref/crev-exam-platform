// ============================================================================
// Exam / question utilities — mock-only at present.
// These pure helpers mirror what Supabase (DB defaults, a Postgres function,
// or an RPC call) would eventually own: id generation and derived scores.
// Keeping them pure means the UI never has to care where ids come from, so
// swapping mock for a real backend won't touch any component.
// ============================================================================

const EXAM_ID_PREFIX = 'EX'
const EXAM_ID_PADDING = 3

/**
 * Returns the next sequential exam id given the current list, e.g.
 * EX-004 -> EX-005. Falls back to EX-001 when the list is empty.
 */
export function generateNextExamId(existingExams) {
  const numbers = existingExams
    .map((exam) => Number.parseInt(exam.id.replace(`${EXAM_ID_PREFIX}-`, ''), 10))
    .filter((n) => !Number.isNaN(n))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `${EXAM_ID_PREFIX}-${String(next).padStart(EXAM_ID_PADDING, '0')}`
}

/** Generates a short, collision-resistant id for a new question. */
export function generateQuestionId() {
  return `Q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Sums every question's score to derive the exam's total marks. */
export function calcTotalScore(questions) {
  return questions.reduce((sum, question) => sum + (Number(question.score) || 0), 0)
}

/**
 * Normalizes an exam record into the shape the builder treats as the
 * source of truth, dropping any legacy/unknown fields. Used when editing
 * an existing exam so the builder always starts from canonical data.
 */
export function toExamInfo(exam) {
  return {
    name: exam.name ?? '',
    subject: exam.subject ?? '',
    stage: exam.stage ?? '',
    grade: exam.grade ?? '',
    durationMinutes: exam.durationMinutes ?? 30,
    status: exam.status ?? 'Draft',
    scheduledDate: exam.scheduledDate ?? '',
    startTime: exam.startTime ?? '',
    endTime: exam.endTime ?? '',
    instructions: exam.instructions ?? '',
    passScore: exam.passScore ?? 0,
    archived: exam.archived ?? false,
  }
}

/**
 * Grades a student's raw answers against an exam's questions.
 * Returns { score, answers } where each answer carries the earned score and
 * whether it was correct. Unanswered questions earn 0.
 */
export function gradeAttempt(exam, rawAnswers) {
  const totalScore = calcTotalScore(exam.questions)
  const answers = exam.questions.map((question) => {
    const raw = rawAnswers[question.id]
    const answered = raw !== undefined && raw !== null && raw !== ''
    let earned = 0
    let correct = false

    if (answered) {
      if (question.type === 'MCQ') {
        correct = Number(raw) === question.correctIndex
      } else {
        correct = Boolean(raw) === question.correctAnswer
      }
      if (correct) earned = Number(question.score) || 0
    }

    return {
      questionId: question.id,
      text: question.text,
      type: question.type,
      score: Number(question.score) || 0,
      earned,
      selected: answered ? raw : null,
      correct,
      options: question.options ?? null,
      correctIndex: question.type === 'MCQ' ? question.correctIndex : null,
      correctAnswer: question.type === 'TF' ? question.correctAnswer : null,
    }
  })

  const score = answers.reduce((sum, answer) => sum + answer.earned, 0)
  return { score, totalScore, answers }
}