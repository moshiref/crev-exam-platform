import { cn } from '../../utils/cn.js'

const TONES = {
  success: 'bg-green-50 text-emerald-600 ring-emerald-100',
  danger: 'bg-red-50 text-danger ring-red-100',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100',
  neutral: 'bg-slate-100 text-slate-500 ring-slate-200',
  primary: 'bg-blue-50 text-primary ring-blue-100',
}

/** Small rounded status pill — Active/Inactive, exam status, etc. */
export default function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn(`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${TONES[tone]}`, className)}>
      {children}
    </span>
  )
}
