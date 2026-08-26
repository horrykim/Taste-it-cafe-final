import { useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { ContextualPopover } from "./ContextualPopover";

export function FilterMenu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 items-center justify-between gap-2 rounded-xl border border-taste-border bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-taste-pink focus:border-taste-pink min-w-[140px]"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <ContextualPopover open={open} anchorRef={anchorRef} onClose={() => setOpen(false)} width={240}>
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="flex flex-col gap-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${value === option.value ? 'bg-pink-50 text-taste-pink font-medium' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <div className="flex flex-col text-left">
                <span>{option.label}</span>
                {option.subtitle && <span className="text-xs font-normal text-slate-500">{option.subtitle}</span>}
              </div>
              {value === option.value && <Check size={16} />}
            </button>
          ))}
        </div>
      </ContextualPopover>
    </>
  );
}
