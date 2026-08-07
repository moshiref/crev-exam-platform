/**
 * Small "OR" divider used between the primary action and secondary
 * options on auth pages.
 */
export default function Divider({ label = 'أو' }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}
