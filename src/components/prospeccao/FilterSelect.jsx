import React from "react";

export default function FilterSelect({ value, onChange, placeholder, options }) {
  return <select className="h-9 rounded-md border border-input bg-slate-950/35 px-3 text-sm text-slate-100" value={value} onChange={(event) => onChange(event.target.value)}>
    <option value="">{placeholder}</option>
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}