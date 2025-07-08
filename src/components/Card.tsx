import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`group bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 h-full cursor-pointer flex flex-col hover:-translate-y-1 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
} 