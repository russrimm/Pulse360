import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-0.5 h-full cursor-pointer flex flex-col ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
} 