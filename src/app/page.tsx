import { MessageCard } from '@/components/MessageCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Microsoft 365 Message Center
          </h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Message cards will be rendered here */}
          </div>
        </div>
      </div>
    </main>
  );
} 