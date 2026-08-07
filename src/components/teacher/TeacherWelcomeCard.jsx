import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PiChalkboardTeacherDuotone } from 'react-icons/pi'
import { getCurrentTeacher } from '../../services/auth.js'
import { getTeacherById } from '../../services/repository.js'

/**
 * Professional welcome card shown at the top of the teacher dashboard.
 *
 * Uses the already-signed-in teacher (session) for name + subject, falling
 * back to a single Supabase fetch only when those fields are missing — so the
 * data is requested at most once.
 */
export default function TeacherWelcomeCard() {
  const sessionTeacher = getCurrentTeacher()

  const [name, setName] = useState(sessionTeacher?.name || '')
  const [subject, setSubject] = useState(sessionTeacher?.subject || '')

  useEffect(() => {
    let active = true
    ;(async () => {
      if (sessionTeacher?.name && sessionTeacher.subject) return
      const fetched = await getTeacherById(sessionTeacher?.id)
      if (!active) return
      if (fetched) {
        if (fetched.name) setName(fetched.name)
        if (fetched.subject) setSubject(fetched.subject)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subjectLabel = subject ? subject : 'لم يتم تحديد المادة بعد.'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-card bg-gradient-to-l from-primary to-secondary p-6 shadow-soft sm:p-8"
    >
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-14 -right-6 h-44 w-44 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl text-white backdrop-blur-sm sm:h-14 sm:w-14 sm:text-3xl">
              <PiChalkboardTeacherDuotone />
            </span>
            <div>
              <p className="text-sm font-semibold text-white/80">لوحة تحكم المدرس</p>
              <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                مرحبًا، {name || 'أستاذنا'} 👋
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-white/85 sm:text-base">
            نتمنى لك يومًا موفقًا.
          </p>

          <div className="mt-5 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-white/80">أنت تقوم بتدريس مادة:</p>
            <p className="mt-1 text-lg font-extrabold text-white sm:text-xl">{subjectLabel}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}