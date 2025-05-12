export interface Message {
  id: string;
  title: string;
  service: string[];
  lastUpdated: string;
  published: string;
  tags: string[];
  content: string;
}

export interface MessageResponse {
  messages: Message[];
  total: number;
} 