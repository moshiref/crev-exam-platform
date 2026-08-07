import { HiCheck } from 'react-icons/hi2'

/**
 * Custom-styled "Remember me" checkbox.
 * Uses a visually-hidden native checkbox (for accessibility/keyboard
 * support) paired with a styled box driven by peer-checked state.
 */
export default function Checkbox({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2.5">
      <span className="relative flex items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100">
          <HiCheck className="h-3.5 w-3.5 scale-0 text-white transition-transform duration-150 peer-checked:scale-100" />
        </span>
      </span>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </label>
  )
}
