import { HiOutlineChevronDown } from 'react-icons/hi2'
import { cn } from '../../utils/cn.js'

/**
 * Generic labeled select input, styled to match `Input`.
 * `options` is an array of strings or { label, value } objects.
 */
export default function Select({ label, id, error, options, className, ...selectProps }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={cn(
            'w-full appearance-none rounded-xl border bg-slate-50/60 px-4 py-2.5 pl-10 text-sm font-medium text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-4',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-primary focus:ring-blue-100'
          )}
          {...selectProps}
        >
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value
            const label = typeof option === 'string' ? option : option.label
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
        <HiOutlineChevronDown className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
    </div>
  )
}
