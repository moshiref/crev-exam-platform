import { motion } from 'framer-motion'
import { PiCrownDuotone, PiChalkboardTeacherDuotone, PiStudentDuotone } from 'react-icons/pi'
import { HiOutlineUserGroup } from 'react-icons/hi2'
import LoginCard from './LoginCard.jsx'

// Entry-point cards — the four doors into the platform.
// Colors are drawn from the theme palette so the palette stays consistent
// with the rest of the product as more portals/dashboards are added later.
const PORTALS = [
  {
    icon: <PiCrownDuotone />,
    title: 'الإدارة',
    description: 'لوحة التحكم الرئيسية لإدارة المنصة بالكامل، وإدارة المدرسين والطلاب والمواد والامتحانات والنتائج والإعدادات.',
    buttonLabel: 'دخول الإدارة',
    to: '/admin/login',
    accent: { bg: '#DBEAFE', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)' },
  },
  {
    icon: <PiChalkboardTeacherDuotone />,
    title: 'المدرسون',
    description: 'لوحة خاصة بالمدرس لإدارة الامتحانات الخاصة به، وإضافة الأسئلة، ومتابعة نتائج طلابه.',
    buttonLabel: 'دخول المدرس',
    to: '/teacher',
    accent: { bg: '#E0E7FF', gradient: 'linear-gradient(135deg, #3B82F6, #22C55E)' },
  },
  {
    icon: <PiStudentDuotone />,
    title: 'الطلاب',
    description: 'الدخول بالكود الخاص بالطالب لحل الامتحانات.',
    buttonLabel: 'دخول الطالب',
    to: '/student',
    accent: { bg: '#DCFCE7', gradient: 'linear-gradient(135deg, #16A34A, #22C55E)' },
  },
  {
    icon: <HiOutlineUserGroup />,
    title: 'ولي الأمر',
    description: 'متابعة درجات ومستوى الطالب باستخدام كود الطالب (PIN) الخاص بولي الأمر.',
    buttonLabel: 'دخول ولي الأمر',
    to: '/parent',
    accent: { bg: '#FEF3C7', gradient: 'linear-gradient(135deg, #F59E0B, #F97316)' },
  },
]

/**
 * Landing page hero: headline, subtitle, ambient background shapes,
 * and the three portal cards used to enter the platform.
 */
export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Ambient background — soft blurred shapes + faint dot grid,
          evoking scattered exam sheets without being literal. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
        <motion.div
          animate={{ y: [0, 22, 0], x: [0, 14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -18, 0], x: [0, -16, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-32 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-primary ring-1 ring-blue-100 sm:text-sm"
        >
          منصة CREV التعليمية
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-3xl font-black leading-tight text-slate-900 sm:text-5xl md:text-6xl"
        >
          منصة الامتحانات{' '}
          <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            الإلكترونية
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg"
        >
          منصة ذكية لإدارة الامتحانات ومتابعة الطلاب وأولياء الأمور.
        </motion.p>
      </div>

      {/* Portal cards */}
      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 px-5 sm:px-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {PORTALS.map((portal, index) => (
          <LoginCard key={portal.to} {...portal} delay={index * 0.12} />
        ))}
      </div>
    </section>
  )
}
