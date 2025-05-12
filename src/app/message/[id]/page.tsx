import { MessageDetail } from '@/components/MessageDetail';

export default function MessagePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <MessageDetail messageId={params.id} />
        </div>
      </div>
    </main>
  );
} 