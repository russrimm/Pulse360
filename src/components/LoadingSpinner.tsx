export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin border-t-primary-600 dark:border-t-primary-400"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
} 