import { clsx } from 'clsx';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-dark-700 mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-3.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 bg-gray-50 focus:ring-primary-500 focus:border-primary-500 focus:bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';