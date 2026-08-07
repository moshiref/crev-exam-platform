import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineSparkles, HiOutlineBookOpen, HiOutlineArrowLongLeft } from 'react-icons/hi2'
import AuthBackground from '../components/auth/AuthBackground.jsx'
import { useSubjects } from '../hooks/useSubjects.js'
import * as repo from '../services/repository.js'

/**
 * Student dashboard — /student/dashboard
 *
 * Reached after a successful (unauthenticated, demo-only) login. Greets the
 * identified student, then walks a two-step flow: pick a subject, then pick
 * one of its published exams. Data is read from the shared repository.
 */
export default function StudentDashboard() {
  const [step, setStep] = useState(1)
  const [selectedSubject, setSelectedSubject] = useState(null)

  const current = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('crev-student-auth') || '{}')
    } catch {
      return {}
    }
  }, [])
  const studentName = current.name || 'عزيزي الطالب'
  const studentStage = current.stage || ''
  const studentGrade = current.grade || ''
  const studentId = current.id || ''

  const { subjects } = useSubjects()

  const studentAttempts = repo.listExamAttempts().filter((a) => a.studentId === studentId)
  const attemptFor = (examId) => studentAttempts.find((a) => a.examId === examId)

  const subjectExams = selectedSubject
    ? repo
        .listExams()
        .filter(
          (exam) =>
            exam.subject === selectedSubject &&
            exam.status === 'Published' &&
            (!studentStage || !exam.stage || exam.stage === studentStage) &&
            (!studentGrade || !exam.grade || exam.grade === studentGrade)
        )
    : []

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-12 sm:px-8">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-md flex-col items-center rounded-auth border border-white/60 bg-white/70 p-8 text-center shadow-glass backdrop-blur-xl sm:p-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-5xl text-white shadow-soft-lg"
        >
          <HiOutlineSparkles />
        </motion.div>

        <h1 className="mt-7 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
          مرحبًا {studentName} 👋
        </h1>

        {step === 1 && (
          <>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500 sm:text-base">
              {subjects.length === 0
                ? 'لا توجد مواد متاحة بعد — أضف مواد عبر لوحة الإدارة لبدء الاختبارات.'
                : 'اختر المادة التي تريد حل امتحاناتها.'}
            </p>

            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              {subjects.map((subject) => {
                const active = selectedSubject === subject.name
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSelectedSubject(subject.name)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-bold transition-colors duration-200 ${
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    <HiOutlineBookOpen className="h-4 w-4 shrink-0" />
                    {subject.name}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              امتحانات «{selectedSubject}» المتاحة لحلّها:
            </p>

            {subjectExams.length === 0 ? (
              <p className="mt-5 w-full rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500 ring-1 ring-slate-100">
                لا توجد امتحانات منشورة لهذه المادة حاليًا.
              </p>
            ) : (
              <div className="mt-6 flex w-full flex-col gap-3">
                {subjectExams.map((exam) => {
                  const attempt = attemptFor(exam.id)
                  if (attempt) {
                    return (
                      <div
                        key={exam.id}
                        className="flex flex-col gap-1.5 rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-start"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{exam.name}</p>
                            <p className="text-xs text-slate-500">{exam.grade} · {exam.questions.length} سؤال</p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                            تم الأداء مسبقًا
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-amber-700">
                          لقد قمت بأداء هذا الامتحان مسبقًا
                          {typeof attempt.score === 'number' && (
                            <span className="text-amber-800"> · نتيجتك: {attempt.score} / {attempt.totalScore}</span>
                          )}
                        </p>
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={exam.id}
                      to={`/student/exam/${exam.id}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-start transition-colors hover:border-primary hover:bg-blue-50/40"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{exam.name}</p>
                        <p className="text-xs text-slate-500">{exam.grade} · {exam.questions.length} سؤال</p>
                      </div>
                      <span className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        حل الامتحان
                        <HiOutlineArrowLongLeft className="h-3.5 w-3.5 rotate-180" />
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-9 flex w-full items-center gap-3">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-sm font-bold text-slate-600 transition-colors hover:border-primary hover:text-primary"
            >
              <HiOutlineArrowLongLeft className="h-5 w-5 rotate-180" />
              السابق
            </button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={step === 1 && !selectedSubject}
            onClick={() => (step === 1 ? setStep(2) : setStep(1))}
            className="w-full rounded-2xl bg-gradient-to-l from-primary to-secondary py-4 text-sm font-bold text-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
          >
            {step === 1 ? 'التالي' : 'اختيار مادة أخرى'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}