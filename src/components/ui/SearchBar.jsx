import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

/** Search input with a leading icon, used to filter tables. */
export default function SearchBar({ value, onChange, placeholder = 'بحث...' }) {
  return (
    <div className="relative w-full sm:w-72">
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-[18px] w-[18px] text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pr-11 pl-4 text-sm font-medium text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  )
}
