'use client';

import { MessageList } from '@/components/MessageList';
import { Message } from '@/lib/types';

interface HomeContentProps {
  messages: Message[];
}

export function HomeContent({ messages }: HomeContentProps) {
  return <MessageList messages={messages} />;
}