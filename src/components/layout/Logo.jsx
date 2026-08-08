import { HiOutlineAcademicCap } from 'react-icons/hi2'

/**
 * CREV brand mark — gradient icon badge + wordmark.
 * Shared by the public Navbar, the dashboard Sidebar, and the
 * printable Student Card so the identity stays consistent everywhere.
 */
export default function Logo({ size = 'md', withText = true }) {
  const badgeSize = size === 'sm' ? 'h-8 w-8 text-lg rounded-xl' : 'h-10 w-10 text-xl rounded-2xl'
  const textSize = size === 'sm' ? 'text-base' : 'text-lg sm:text-xl'

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary text-white shadow-soft ${badgeSize}`}
      >
        <HiOutlineAcademicCap />
      </span>
      {withText && (
        <span className={`font-display font-extrabold text-slate-900 ${textSize}`}>
          منصة التميز
        </span>
      )}
    </div>
  )
}
