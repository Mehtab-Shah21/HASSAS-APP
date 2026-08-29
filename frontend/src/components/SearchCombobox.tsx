import { useEffect, useRef, useState } from "react";

interface Props<T> {
  placeholder: string;
  fetchOptions: (query: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string | null | undefined;
  onSelect: (item: T) => void;
  extraOption?: { label: string; onClick: () => void };
}

export default function SearchCombobox<T>({
  placeholder,
  fetchOptions,
  getLabel,
  getSubLabel,
  onSelect,
  extraOption,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      setLoading(true);
      fetchOptions(query)
        .then(setOptions)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open, fetchOptions]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-sm text-slate-400">Searching...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">No matches</div>
          ) : (
            options.map((opt, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <div className="font-medium text-slate-800">{getLabel(opt)}</div>
                {getSubLabel?.(opt) && <div className="text-xs text-slate-400">{getSubLabel(opt)}</div>}
              </button>
            ))
          )}
          {extraOption && (
            <button
              type="button"
              onClick={() => {
                extraOption.onClick();
                setOpen(false);
              }}
              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              {extraOption.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
