import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function MessageCenterLoading() {
  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Stay informed about Microsoft 365 service updates and changes
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    </div>
  );
} 