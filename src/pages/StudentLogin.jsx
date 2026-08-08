import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineAcademicCap, HiOutlineIdentification, HiOutlineArrowLongLeft } from 'react-icons/hi2'
import { PiHeadsetDuotone } from 'react-icons/pi'
import AuthBackground from '../components/auth/AuthBackground.jsx'
import TextField from '../components/auth/TextField.jsx'
import PasswordField from '../components/auth/PasswordField.jsx'
import Checkbox from '../components/auth/Checkbox.jsx'
import Divider from '../components/auth/Divider.jsx'
import { isSupabaseConfigured, supabase } from '../services/supabase.js'
import * as repo from '../services/repository.js'
import { loadRemembered, saveRemembered } from '../utils/rememberMe.js'
import { clearOtherSessions, STUDENT_KEY } from '../services/auth.js'

/**
 * Student login page — /student
 *
 * Real (Supabase-backed when configured) authentication: the entered code and
 * password are matched against the `students` table. Only an exact match with
 * status "Active" signs in — there is no auto-bypass. Falls back to the
 * in-memory repo cache when Supabase isn't configured (mock mode).
 */
export default function StudentLogin() {
  const navigate = useNavigate()

  const remembered = loadRemembered('student')

  const [studentId, setStudentId] = useState(remembered.studentId || '')
  const [password, setPassword] = useState(remembered.password || '')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!studentId.trim()) nextErrors.studentId = 'كود الطالب مطلوب'
    if (!password.trim()) nextErrors.password = 'كلمة المرور مطلوبة'

    setErrors(nextErrors)
    setLoginError(null)

    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    try {
      const student = await authenticate(studentId.trim(), password)

      if (!student) {
        setLoginError('كود الطالب أو كلمة المرور غير صحيحة.')
        return
      }

      clearOtherSessions(STUDENT_KEY)
      sessionStorage.setItem(
        STUDENT_KEY,
        JSON.stringify({
          id: student.id,
          name: student.name,
          stage: student.stage,
          grade: student.grade,
        })
      )
      if (rememberMe) {
        saveRemembered('student', { studentId: studentId.trim(), password })
      }
      navigate('/student/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  /** Matches a code/password against the students table (live) or cache (mock). */
  async function authenticate(id, enteredPassword) {
    if (isSupabaseConfigured) {
      // The credential check runs in a SECURITY DEFINER RPC (so the anon key
      // never reads `password` directly). Fall back to the legacy direct table
      // match only while the RPC hasn't been deployed yet.
      const { data, error } = await supabase.rpc('student_login', {
        p_student_id: id,
        p_password: enteredPassword,
      })
      if (!error) return (data && data.length ? data[0] : null) || null
      if (error.code === 'PGRST202' || error.code === '42883') {
        const { data: legacy } = await supabase
          .from('students')
          .select('id, name, stage, grade, parent_pin')
          .eq('id', id)
          .eq('password', enteredPassword)
          .eq('status', 'Active')
          .maybeSingle()
        return legacy || null
      }
      return null
    }
    return (
      repo
        .listStudents()
        .find(
          (s) => s.id.toLowerCase() === id.toLowerCase() && s.password === enteredPassword && s.status === 'Active'
        ) || null
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-12 sm:px-8">
      <AuthBackground />

      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-secondary text-4xl text-white shadow-soft-lg"
          >
            <HiOutlineAcademicCap />
          </motion.div>

          <h1 className="mt-6 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            مرحبًا بك 👋
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 sm:text-base">
            سجل الدخول باستخدام بياناتك للوصول إلى الامتحانات الخاصة بك.
          </p>
        </motion.div>

        {/* Login card — floating glass card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          className="rounded-auth border border-white/60 bg-white/70 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-300 hover:shadow-soft-lg sm:p-9"
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <TextField
              id="studentId"
              label="كود الطالب"
              icon={<HiOutlineIdentification />}
              type="text"
              placeholder="أدخل كود الطالب — مثال: CREV-1025"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              error={errors.studentId}
              autoComplete="username"
            />

            <PasswordField
              id="password"
              label="كلمة المرور"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <Checkbox
                id="rememberMe"
                label="تذكرني"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            </div>

            {loginError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600 ring-1 ring-red-100">
                {loginError}
              </p>
            )}

            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="mt-1 w-full rounded-2xl bg-gradient-to-l from-primary to-secondary py-4 text-sm font-bold text-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {submitting ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
            </motion.button>
          </form>

          <div className="my-6">
            <Divider />
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 transition-colors duration-300 hover:border-primary hover:text-primary sm:text-base"
          >
            <HiOutlineArrowLongLeft className="h-5 w-5 rotate-180" />
            العودة للرئيسية
          </motion.button>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7 flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-400 sm:text-sm"
        >
          <PiHeadsetDuotone className="h-4 w-4 shrink-0 text-slate-400" />
          إذا واجهتك مشكلة في تسجيل الدخول، تواصل مع إدارة السنتر.
        </motion.p>
      </div>
    </div>
  )
}
