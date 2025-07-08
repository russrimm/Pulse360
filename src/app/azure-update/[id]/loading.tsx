export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto min-w-0">
        <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-pulse flex flex-col h-full">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 mx-auto" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4 mx-auto" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4 mx-auto" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8 mx-auto" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mt-auto" />
        </div>
      </div>
    </div>
  )
} 