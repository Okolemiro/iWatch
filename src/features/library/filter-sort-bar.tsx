"use client";

import { LIBRARY_SORT_OPTIONS, LIBRARY_STATUS_OPTIONS, LIBRARY_TYPE_OPTIONS } from "@/lib/constants";

type FilterSortBarProps = {
  mediaType: string;
  status: string;
  sort: string;
  onChange: (next: { mediaType?: string; status?: string; sort?: string }) => void;
};

export function FilterSortBar({
  mediaType,
  status,
  sort,
  onChange,
}: FilterSortBarProps) {
  return (
    <div className="panel rounded-[2rem] p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <SelectField
          label="Type"
          value={mediaType}
          options={LIBRARY_TYPE_OPTIONS}
          onChange={(value) => onChange({ mediaType: value })}
        />
        <SelectField
          label="Status"
          value={status}
          options={LIBRARY_STATUS_OPTIONS}
          onChange={(value) => onChange({ status: value })}
        />
        <SelectField
          label="Sort"
          value={sort}
          options={LIBRARY_SORT_OPTIONS}
          onChange={(value) => onChange({ sort: value })}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--color-text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
