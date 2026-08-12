// ============================================================================
// Demo dataset generator.
//
// The platform ships empty — no fake records exist anywhere in the codebase.
// When the admin clicks "Load demo data" (Demo Data page) this module builds a
// complete, internally-consistent working dataset and hands it to the
// repository to persist. The generated data includes subjects, teachers,
// classes, students, exams and linked results so every dashboard fills up.
//
// The generator is deterministic (seeded PRNG) so repeated loads produce a
// stable, believable demo. Everything produced here is discarded by
// "Clear demo data".
// ============================================================================

import { EDUCATIONAL_STAGES, GRADES_BY_STAGE } from './mockData.js'

// ------------------------------- Seeded RNG --------------------------------
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let rand = mulberry32(2026812)
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const pad = (n) => String(n).padStart(2, '0')
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

let attemptSeq = 0

// ------------------------------ Content pools ------------------------------
const FIRST_NAMES = ['محمد', 'أحمد', 'سارة', 'يوسف', 'عمر', 'كريم', 'ليلى', 'مريم', 'حسام', 'خالد', 'مصطفى', 'هند', 'عبد الرحمن', 'فاطمة', 'علي', 'مها', 'زينب', 'طارق', 'جنى', 'ديما', 'رنا', 'أمير', 'سلمى', 'إبراهيم', 'لمى', 'ياسمين', 'آدم', 'نور', 'حمزة', 'ريم']
const LAST_NAMES = ['أحمد', 'حسام', 'العثماني', 'عبد الله', 'فتحي', 'حسن', 'محمود', 'سامي', 'علي', 'الشربيني', 'خليفة', 'الفراني', 'نور', 'السيد', 'دياب', 'زكي', 'مطر', 'الصاوي', 'درويش', 'غانم', 'طه']

const SUBJECTS = ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'الحاسب الآلي']

const TEACHER_DATA = [
  { name: 'أ. أحمد فوزي', subject: 'الرياضيات', username: 'ahmed.fouzi' },
  { name: 'أ. منى عبد الله', subject: 'اللغة الإنجليزية', username: 'mona.abdallah' },
  { name: 'أ. كريم سامي', subject: 'العلوم', username: 'karim.sami' },
  { name: 'أ. هبة الدسوقي', subject: 'اللغة العربية', username: 'heba.desouky' },
  { name: 'أ. محمود صلاح', subject: 'الدراسات الاجتماعية', username: 'mahmoud.salah' },
]

const EXAM_NAMES = ['امتحان الوحدة الأولى', 'امتحان منتصف الترم', 'اختبار قصير', 'امتحان نهاية الوحدة', 'تقييم شهري']

const MCQ_BANK = [
  { text: 'ما عاصمة جمهورية مصر العربية؟', options: ['الإسكندرية', 'القاهرة', 'الجيزة', 'أسوان'], correctIndex: 1, score: 2 },
  { text: 'كم عدد أيام الأسبوع؟', options: ['5', '6', '7', '8'], correctIndex: 2, score: 1 },
  { text: 'ناتج 12 ÷ 4 =', options: ['2', '3', '4', '6'], correctIndex: 1, score: 2 },
  { text: 'ما أكبر كوكب في المجموعة الشمسية؟', options: ['الأرض', 'المريخ', 'المشتري', 'زحل'], correctIndex: 2, score: 2 },
  { text: 'حرف النداء «يا» يسبق المنادى.', options: ['صح', 'خطأ', 'صح', 'خطأ'], correctIndex: 0, score: 1 },
  { text: 'The opposite of "hot" is:', options: ['warm', 'cold', 'soft', 'wet'], correctIndex: 1, score: 1 },
]
const TF_BANK = [
  { text: 'الماء يتجمد عند 0 درجة مئوية.', correctAnswer: true, score: 1 },
  { text: 'الشمس تشرق من الغرب.', correctAnswer: false, score: 1 },
  { text: 'الأرض كوكب صالح للحياة.', correctAnswer: true, score: 1 },
  { text: 'مجموع زوايا المثلث يساوي 360°.', correctAnswer: false, score: 1 },
]

// ------------------------------ Builders -----------------------------------
function buildExam(index) {
  const subject = SUBJECTS[index % SUBJECTS.length]
  const stage = pick(EDUCATIONAL_STAGES)
  const grade = pick(GRADES_BY_STAGE[stage])

  const questions = []
  for (let i = 0; i < 4; i++) {
    const source = rand() < 0.6 ? pick(MCQ_BANK) : pick(TF_BANK)
    questions.push({
      id: `q-${i + 1}`,
      text: source.text,
      type: source.options ? 'MCQ' : 'TF',
      score: source.score,
      options: source.options ?? null,
      correctIndex: source.options ? source.correctIndex : undefined,
      correctAnswer: source.options ? undefined : source.correctAnswer,
    })
  }

  const totalScore = questions.reduce((s, q) => s + q.score, 0)
  const passScore = Math.max(1, Math.round(totalScore / 2))
  const isPublished = index % 3 !== 0 // 7 published, 3 drafts
  const createdAt = `2026-${pad(index + 1)}-${pad(5)}`

  return {
    id: `EX-${String(index + 1).padStart(3, '0')}`,
    name: EXAM_NAMES[index % EXAM_NAMES.length],
    subject,
    stage,
    grade,
    durationMinutes: [20, 30, 40, 45, 60][index % 5],
    status: isPublished ? 'Published' : 'Draft',
    createdAt,
    scheduledDate: `2026-07-${pad(clamp(1 + index * 2, 1, 28))}`,
    startTime: '09:00',
    endTime: '10:30',
    passScore,
    instructions: 'أجب عن الأسئلة في الوقت المحدد. يغلق الامتحان تلقائيًا عند انتهاء الوقت.',
    archived: false,
    questions,
    totalScore,
    isPublished,
  }
}

function buildAttempt(attemptSeq, student, exam) {
  const answers = exam.questions.map((q) => {
    const selected = q.type === 'MCQ' ? randInt(0, 3) : rand() < 0.5
    const correct = q.type === 'MCQ' ? selected === q.correctIndex : selected === q.correctAnswer
    return {
      questionId: q.id,
      text: q.text,
      type: q.type,
      score: q.score,
      options: q.options ?? undefined,
      correctIndex: q.correctIndex,
      correctAnswer: q.correctAnswer,
      selected,
      correct,
      earned: correct ? q.score : 0,
    }
  })
  const earned = answers.reduce((s, a) => s + a.earned, 0)
  const offsetDay = clamp(1 + (attemptSeq % 28), 1, 28)

  return {
    id: `AT-${String(attemptSeq + 1).padStart(4, '0')}`,
    examId: exam.id,
    examName: exam.name,
    subject: exam.subject,
    grade: exam.grade,
    studentId: student.id,
    studentName: student.name,
    submittedAt: `2026-07-${pad(offsetDay)} 09:${pad((attemptSeq * 7) % 60)}`,
    score: earned,
    totalScore: exam.totalScore,
    passScore: exam.passScore,
    passed: earned >= exam.passScore,
    answers,
  }
}

// ---------------------------------------------------------------------------
// Builds the complete demo dataset.
// ---------------------------------------------------------------------------
export function createDemoDataset() {
  // Reset the seeded PRNG on every call so repeated loads — including
  // "Load demo data" → "Clear demo data" → "Load demo data" in the same
  // session — always rebuild the exact same deterministic dataset.
  rand = mulberry32(2026812)
  attemptSeq = 0

  // Subjects (6)
  const subjects = SUBJECTS.map((name, i) => ({
    id: `SUB-${String(i + 1).padStart(2, '0')}`,
    name,
    teachersCount: 0,
    examsCount: 0,
  }))

  // Teachers (5) — each gets full stage/grade permission scope (as the admin
  // would grant), so the strict RBAC scoping still shows data in the demo.
  const allGrades = Object.values(GRADES_BY_STAGE).flat()
  const teachers = TEACHER_DATA.map((t, i) => ({
    id: `T-${String(i + 1).padStart(3, '0')}`,
    name: t.name,
    subject: t.subject,
    subjects: [t.subject],
    stages: [...EDUCATIONAL_STAGES],
    grades: allGrades,
    phone: `010${randInt(10000000, 99999999)}`,
    status: i === 3 ? 'Inactive' : 'Active',
    username: t.username,
    password: `${t.username.split('.')[0]}@2026`,
  }))

  // Classes (12) — one row per grade per stage
  const classes = EDUCATIONAL_STAGES.flatMap((stage) =>
    GRADES_BY_STAGE[stage].map((name, gi) => {
      const stageIndex = EDUCATIONAL_STAGES.indexOf(stage)
      const offset = EDUCATIONAL_STAGES.slice(0, stageIndex).reduce((s, st) => s + GRADES_BY_STAGE[st].length, 0)
      return {
        id: `CLS-${String(offset + gi + 1).padStart(2, '0')}`,
        stage,
        name,
        studentsCount: 0,
        examsCount: 0,
      }
    })
  )

  // Students (50) — distinct Arabic names across grades, mostly Active
  const used = new Set()
  const students = []
  for (let i = 0; i < 50; i++) {
    let name = ''
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    } while (used.has(name))
    used.add(name)

    const stage = pick(EDUCATIONAL_STAGES)
    const grade = pick(GRADES_BY_STAGE[stage])
    students.push({
      id: `CREV-${String(1001 + i)}`,
      name,
      stage,
      grade,
      parentPhone: `01${randInt(10000000, 99999999)}`,
      status: i % 10 === 0 ? 'Inactive' : 'Active',
      password: String(randInt(100000, 999999)),
      parentPin: String(randInt(1000, 9999)),
      createdAt: `2026-${pad(randInt(1, 6))}-${pad(randInt(1, 28))}`,
    })
  }

  // Exams (10)
  const exams = Array.from({ length: 10 }, (_, i) => buildExam(i))
  const published = exams.filter((e) => e.isPublished)

  // Attempts (results) — a chunk of students per published exam
  const attempts = []
  published.forEach((exam) => {
    const count = randInt(12, 28)
    const step = Math.max(1, Math.floor(students.length / count))
    students.filter((_, i) => i % step === 0).forEach((student) => {
      attempts.push(buildAttempt(attemptSeq, student, exam))
      attemptSeq += 1
    })
  })
  attempts.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))

  // Compute derived counts
  subjects.forEach((s) => {
    s.teachersCount = teachers.filter((t) => t.subject === s.name).length
    s.examsCount = exams.filter((e) => e.subject === s.name).length
  })
  classes.forEach((c) => {
    c.studentsCount = students.filter((s) => s.grade === c.name && s.stage === c.stage).length
    c.examsCount = exams.filter((e) => e.grade === c.name && e.stage === c.stage).length
  })

  return {
    subjects,
    teachers,
    classes,
    students,
    exams,
    attempts,
  }
}