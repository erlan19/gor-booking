import { clsx } from 'clsx';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:scale-[0.98]': variant === 'primary',
          'bg-gray-100 text-dark-900 hover:bg-gray-200 focus:ring-gray-400': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
          'bg-transparent text-dark-600 hover:bg-gray-100 focus:ring-gray-400': variant === 'ghost',
          'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500': variant === 'success',
          'px-3 py-1.5 text-sm rounded-lg': size === 'sm',
          'px-4 py-2.5 text-sm rounded-xl': size === 'md',
          'px-6 py-3 text-base rounded-2xl': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}