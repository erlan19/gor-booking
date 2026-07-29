import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  hover?: boolean;
}

export function Card({ children, className, onClick, variant = 'default', hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl transition-all duration-200',
        {
          'border border-gray-100 shadow-sm': variant === 'default',
          'border border-gray-100 shadow-md': variant === 'elevated',
          'border-2 border-gray-200 shadow-sm': variant === 'outlined',
        },
        onClick && 'cursor-pointer',
        hover && 'hover:shadow-xl hover:-translate-y-1',
        'rounded-2xl transition-all duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}