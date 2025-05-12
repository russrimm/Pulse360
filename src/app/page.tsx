import { MessageCard } from '@/components/MessageCard';
import { getMessages } from '@/lib/api';

export default async function Home() {
  try {
    const { messages } = await getMessages();
    
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Microsoft 365 Message Center
            </h1>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No messages found</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {messages.map((message) => (
                  <MessageCard
                    key={message.id}
                    id={message.id}
                    title={message.title}
                    service={message.service}
                    lastUpdated={message.lastUpdated}
                    published={message.published}
                    tags={message.tags}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Microsoft 365 Message Center
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                Error loading messages. Please check the console for details.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }
} 