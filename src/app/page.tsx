import { MessageList } from '@/components/MessageList';
import { getMessages } from '@/lib/api';


export const revalidate = 604800; // Revalidate every 7 days (7 * 24 * 60 * 60)

export const metadata = {
  title: 'Microsoft Pulse 360° - Home',
  description: 'Stay informed about the latest updates and announcements from Microsoft.',
};

export default async function Home() {
  const messages = await getMessages();

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 [text-wrap:balance] [font-display:swap]">
                Microsoft Pulse 360°
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto [text-wrap:balance]">
                Stay ahead. Stay informed. Stay in control.
              </p>
            </div>
            <MessageList messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
} 