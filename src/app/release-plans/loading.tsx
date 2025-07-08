export default function ReleasePlansLoading() {
  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Stay informed about upcoming Microsoft 365 features
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-8 px-2 py-8">
            {[1,2,3].map(i => (
              <div key={i} className="w-full max-w-md mx-auto min-w-0">
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 animate-pulse flex flex-col h-full">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 mx-auto" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2 mx-auto" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2 mx-auto" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2 mx-auto" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6 mx-auto" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 