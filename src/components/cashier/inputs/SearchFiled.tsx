type SearchFieldProps = {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
};

export function SearchField({
  placeholder,
  value,
  onChange,
  onFocus,
  onKeyDown,
  autoFocus,
}: SearchFieldProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        {/* icon search */}
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49 21.49 20zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14"/></svg>
      </span>

      <input
        autoFocus={autoFocus}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          h-11 w-full rounded-full bg-white pl-10 pr-4
          ring-1 ring-slate-300
          focus:outline-none focus:ring-2 focus:ring-[#0B63E5]
          transition
        "
      />
    </div>
  );
}
