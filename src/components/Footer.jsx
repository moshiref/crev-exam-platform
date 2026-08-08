import { HiOutlineAcademicCap } from 'react-icons/hi2'

/**
 * Site footer — brand mark and copyright.
 * Kept minimal for the MVP; social/legal links can be added later
 * without restructuring the layout.
 */
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="contact" className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-10 text-center sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
            <HiOutlineAcademicCap className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-extrabold text-slate-900">
            منصة التميز
          </span>
        </div>

        <p className="text-sm text-slate-400">
          © {year} منصة التميز. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  )
}
