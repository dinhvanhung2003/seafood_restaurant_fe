"use client";

type Props = {
  value: "all" | "using" | "empty";
  onChange: (v: "all" | "using" | "empty") => void;
  counts: { all: number; using: number; empty: number };
};

export function StatusFilter({ value, onChange, counts }: Props) {
  return (
    <fieldset className="flex items-center gap-4">
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name="status"
          value="all"
          checked={value === "all"}
          onChange={() => onChange("all")}
          className="h-4 w-4 accent-current"
        />
        <span>Tất cả ({counts.all})</span>
      </label>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name="status"
          value="using"
          checked={value === "using"}
          onChange={() => onChange("using")}
          className="h-4 w-4 accent-current"
        />
        <span>Đang dùng ({counts.using})</span>
      </label>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name="status"
          value="empty"
          checked={value === "empty"}
          onChange={() => onChange("empty")}
          className="h-4 w-4 accent-current"
        />
        <span>Trống ({counts.empty})</span>
      </label>
    </fieldset>
  );
}

export default StatusFilter;
