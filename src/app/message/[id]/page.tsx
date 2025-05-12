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
    notFound();
  }
} 