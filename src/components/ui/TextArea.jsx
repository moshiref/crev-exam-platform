import { cn } from '../../utils/cn.js'

/**
 * Generic labeled multiline textarea for admin forms, styled to match
 * the shared `Input` component.
 */
export default function TextArea({ label, id, error, className, ...textareaProps }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full resize-none rounded-xl border bg-slate-50/60 px-4 py-2.5 text-sm font-medium leading-relaxed text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-200 focus:border-primary focus:ring-blue-100'
        )}
        {...textareaProps}
      />
      {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
    </div>
  )
}