import { MessageDetail } from '@/components/MessageDetail';
import { getMessage } from '@/lib/api';
import { notFound } from 'next/navigation';

export default async function MessagePage({ params }: { params: { id: string } }) {
  try {
    const message = await getMessage(params.id);
    
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <MessageDetail message={message} />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching message:', error);
    if (error instanceof Error && error.message.includes('404')) {
      notFound();
    }
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                Error loading message. Please check the console for details.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }
} 