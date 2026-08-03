import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", id, ...rest }: Props) {
  return (
    <label className="block" htmlFor={id}>
      {label && (
        <span className="block mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
          {label}
        </span>
      )}
      <input
        id={id}
        className={`w-full bg-surface-container-low border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors duration-150 ${className}`}
        {...rest}
      />
      {error && <span className="block mt-1 text-xs text-danger transition-opacity duration-150">{error}</span>}
    </label>
  );
}
