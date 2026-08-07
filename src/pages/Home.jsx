import {
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile,
} from 'react-icons/hi2'
import { HiOutlineChartSquareBar } from 'react-icons/hi'
import MainLayout from '../layouts/MainLayout.jsx'
import Hero from '../components/Hero.jsx'
import FeatureCard from '../components/FeatureCard.jsx'

// Data-driven feature list for the "المميزات" section.
const FEATURES = [
  {
    icon: <HiOutlineBolt />,
    title: 'امتحانات سريعة',
    description: 'إنشاء وتشغيل الامتحانات الإلكترونية في دقائق بواجهة سلسة وسريعة.',
  },
  {
    icon: <HiOutlineChartSquareBar />,
    title: 'نتائج تلقائية',
    description: 'تصحيح فوري وحساب الدرجات آليًا دون أي تدخل يدوي.',
  },
  {
    icon: <HiOutlineChartBar />,
    title: 'متابعة الطلاب',
    description: 'تتبّع أداء كل طالب ومستوى تقدمه عبر جميع الامتحانات.',
  },
  {
    icon: <HiOutlineUserGroup />,
    title: 'لوحة ولي الأمر',
    description: 'اطلاع أولياء الأمور على النتائج والمستوى الدراسي أولًا بأول.',
  },
  {
    icon: <HiOutlineShieldCheck />,
    title: 'دخول آمن',
    description: 'نظام دخول محمي لكل من الإدارة والطلاب وأولياء الأمور.',
  },
  {
    icon: <HiOutlineDevicePhoneMobile />,
    title: 'تصميم متجاوب',
    description: 'تجربة استخدام متكاملة على الجوال والتابلت وأجهزة الكمبيوتر.',
  },
]

/**
 * Landing page — hero + entry portals + features overview.
 * Assembled from smaller, reusable components/layouts.
 */
export default function Home() {
  return (
    <MainLayout>
      <Hero />

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-4xl">
            مميزات المنصة
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
            كل ما تحتاجه إدارة العملية التعليمية الإلكترونية في مكان واحد.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} delay={index * 0.08} />
          ))}
        </div>
      </section>
    </MainLayout>
  )
}
