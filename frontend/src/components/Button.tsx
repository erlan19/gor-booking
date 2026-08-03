import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  full?: boolean;
}

const base = "px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ease-out select-none active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<string, string> = {
  primary: "bg-primary text-on-primary hover:bg-secondary",
  secondary: "bg-transparent text-on-surface border border-primary hover:bg-primary hover:text-on-primary",
  ghost: "bg-transparent text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary",
  danger: "bg-transparent text-danger border border-danger hover:bg-danger hover:text-on-primary",
};

export default function Button({ variant = "primary", full, className = "", ...rest }: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}