import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineIdentification, HiOutlineArrowLongLeft, HiOutlineArrowLeft } from 'react-icons/hi2'
import { PiChalkboardTeacherDuotone } from 'react-icons/pi'
import AuthBackground from '../components/auth/AuthBackground.jsx'
import TextField from '../components/auth/TextField.jsx'
import PasswordField from '../components/auth/PasswordField.jsx'
import { loginTeacher } from '../services/auth.js'
import * as repo from '../services/repository.js'
import Checkbox from '../components/auth/Checkbox.jsx'
import { loadRemembered, saveRemembered } from '../utils/rememberMe.js'

/**
 * Teacher login page — /teacher
 *
 * Real authentication: the entered username + password are matched against
 * the Supabase `teachers` table. On success the teacher account is stored
 * and the dashboard unlocks. No demo/default credentials exist.
 */
export default function TeacherLogin() {
  const navigate = useNavigate()

  const remembered = loadRemembered('teacher')

  const [username, setUsername] = useState(remembered.username || '')
  const [password, setPassword] = useState(remembered.password || '')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!username.trim()) nextErrors.username = 'اسم المستخدم مطلوب'
    if (!password.trim()) nextErrors.password = 'كلمة المرور مطلوبة'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const teacher = await repo.findTeacherByUsernamePassword(username, password)
      if (!teacher) {
        setErrors({ form: 'اسم المستخدم أو كلمة المرور غير صحيحة.' })
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      loginTeacher(teacher)
      if (rememberMe) {
        saveRemembered('teacher', { username: username.trim(), password })
      }
      navigate('/teacher/dashboard', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-12 sm:px-8">
      <AuthBackground />

      <div className="w-full max-w-md">
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
            <PiChalkboardTeacherDuotone />
          </motion.div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            بوابة المدرس
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 sm:text-base">
            سجّل الدخول لإدارة الامتحانات والطلاب والنتائج الخاصة بك.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          className={`rounded-auth border border-white/60 bg-white/70 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-300 hover:shadow-soft-lg sm:p-9 ${shake ? 'animate-shake' : ''}`}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <TextField
              id="username"
              label="اسم المستخدم"
              icon={<HiOutlineIdentification />}
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              autoComplete="username"
            />
            <PasswordField
              id="password"
              label="كلمة المرور"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            {errors.form && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-danger ring-1 ring-red-100">
                {errors.form}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Checkbox
                id="rememberMe"
                label="تذكرني"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="mt-1 w-full rounded-2xl bg-gradient-to-l from-primary to-secondary py-4 text-sm font-bold text-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {submitting ? 'جارٍ التحقق...' : 'دخول المدرس'}
            </motion.button>
          </form>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 transition-colors duration-300 hover:border-primary hover:text-primary sm:text-base"
          >
            <HiOutlineArrowLongLeft className="h-5 w-5 rotate-180" />
            العودة للرئيسية
          </motion.button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          type="button"
          onClick={() => navigate('/')}
          className="mt-7 flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-400 sm:text-sm"
        >
          <HiOutlineArrowLeft className="h-4 w-4 rotate-180" />
          العودة للرئيسية
        </motion.button>
      </div>
    </div>
  )
}